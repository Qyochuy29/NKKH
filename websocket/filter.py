"""
filter.py
---------
Xử lý âm thanh PCM 16-bit theo kiểu STREAMING (từng gói tin nhỏ nhận liên
tục từ ESP32/INMP441 qua WebSocket), giữ trạng thái riêng cho từng thiết bị
(device_id) giữa các lần gọi.

Có 2 chế độ (tham số `mode` trong process_audio):

  mode="off" (MẶC ĐỊNH, khuyến nghị cho ghi âm cần độ trung thực cao):
      Chỉ loại DC-offset bằng high-pass rất nhẹ (~20Hz). KHÔNG spectral
      subtraction. Bảo toàn 100% transient (xung tấn công) và toàn bộ dải
      tần số. Phù hợp khi cần ghi âm "chuẩn nhất" các âm thanh xung động
      mạnh, dải tần rộng: tiếng súng, đổ vỡ, hét, nhạc, âm thanh môi
      trường nói chung.

  mode="denoise":
      High-pass ~40Hz (chỉ cắt rung/rumble rất thấp của quạt, KHÔNG giới hạn
      dải tần cao) + spectral subtraction (adaptive, "leaky minimum" + làm
      mượt gain). Nhờ tính chất của bộ theo dõi "leaky minimum": chỉ âm
      thanh NHỎ và ỔN ĐỊNH KÉO DÀI (đúng bản chất tiếng quạt, tiếng rè/hiss)
      mới bị học thành nhiễu và bị hạ mạnh; âm thanh TO ĐỘT NGỘT (súng, đổ
      vỡ, hét) có biên độ lớn hơn hẳn nền nhiễu nên gần như không bị ảnh
      hưởng. Dùng mode này khi mục tiêu CHỈ là cắt tiếng quạt/rè, giữ
      nguyên các âm thanh khác.

LƯU Ý QUAN TRỌNG VỀ SAMPLE RATE: nếu ESP32 đang lấy mẫu 16kHz, Nyquist chỉ
là 8kHz -> mất hoàn toàn nội dung trên 8kHz của tiếng vỡ/hét/nhạc (các âm
này có năng lượng đáng kể tới 10-15kHz+). Phần mềm không thể khôi phục dữ
liệu đã bị cắt khi lấy mẫu. Nếu cần ghi "chuẩn nhất", nên tăng sample rate
ở firmware ESP32 lên 44100Hz hoặc 48000Hz.
"""

from __future__ import annotations

import numpy as np
from scipy.signal import butter, lfilter

# ---------------------------------------------------------------------------
# Tham số STFT cho spectral subtraction (overlap-add 50%, cửa sổ Hann)
# Hann 50% overlap thoả COLA=1 (hann(n) + hann(n+N/2) = 1) nên không cần
# hệ số chuẩn hoá thêm khi overlap-add.
# ---------------------------------------------------------------------------
FRAME_LEN = 512
HOP = FRAME_LEN // 2
WINDOW = np.hanning(FRAME_LEN).astype(np.float32)

NOISE_RISE_RATE = 0.05         # tốc độ TĂNG của ước lượng nhiễu nền (chậm, tránh học nhầm giọng nói)
GAIN_TIME_SMOOTH = 0.55        # làm mượt gain theo thời gian (0-1, cao hơn = mượt hơn nhưng trễ hơn)
GAIN_FREQ_KERNEL = np.array([0.25, 0.5, 0.25], dtype=np.float32)  # làm mượt gain theo tần số


class _DeviceState:
    """Trạng thái xử lý streaming cho MỘT thiết bị (1 kết nối ESP32)."""

    __slots__ = (
        "sample_rate", "b", "a", "zi",
        "dc_b", "dc_a", "dc_zi",
        "in_buffer", "out_buffer", "write_pos",
        "noise_mag", "prev_gain", "frame_count",
    )

    def __init__(self, sample_rate: int, hp_cutoff: float = 40.0, order: int = 4):
        nyq = 0.5 * sample_rate
        # High-pass duy nhất (dùng cho mode="denoise"): cắt rung/rumble tần số
        # rất thấp của quạt mà không giới hạn dải tần cao -> không đụng tới
        # tiếng vỡ/hét/súng (cần dải tần rộng).
        self.b, self.a = butter(order, hp_cutoff / nyq, btype="high")
        self.zi = np.zeros(max(len(self.a), len(self.b)) - 1, dtype=np.float64)

        # High-pass rất nhẹ chỉ để loại DC-offset (dùng cho mode="off")
        self.dc_b, self.dc_a = butter(2, 20.0 / nyq, btype="high")
        self.dc_zi = np.zeros(max(len(self.dc_a), len(self.dc_b)) - 1, dtype=np.float64)

        self.sample_rate = sample_rate
        self.in_buffer = np.zeros(0, dtype=np.float32)   # sample thô chưa đủ 1 khung
        self.out_buffer = np.zeros(0, dtype=np.float32)  # kết quả overlap-add
        self.write_pos = 0                               # vị trí ghi khung kế tiếp trong out_buffer
        self.noise_mag = None                            # phổ biên độ nhiễu nền (leaky-minimum tracker)
        self.prev_gain = None                            # gain của khung trước (làm mượt theo thời gian)
        self.frame_count = 0


_DEVICE_STATES: dict[int, _DeviceState] = {}


def _get_state(device_id: int, sample_rate: int) -> _DeviceState:
    st = _DEVICE_STATES.get(device_id)
    if st is None or st.sample_rate != sample_rate:
        st = _DeviceState(sample_rate)
        _DEVICE_STATES[device_id] = st
    return st


def reset_device(device_id: int) -> None:
    """Xoá trạng thái lọc của 1 thiết bị. Gọi khi đóng phiên ghi (recorder.close())."""
    _DEVICE_STATES.pop(device_id, None)


def _spectral_subtract_frame(frame: np.ndarray, state: _DeviceState,
                              alpha: float, beta: float) -> np.ndarray:
    windowed = frame * WINDOW
    spec = np.fft.rfft(windowed)
    mag = np.abs(spec)

    # --- Ước lượng nhiễu nền kiểu "leaky minimum follower" ---
    # Đây là kỹ thuật minimum-statistics chuẩn cho spectral subtraction:
    # - Nếu khung hiện tại có biên độ THẤP HƠN ước lượng nhiễu -> hạ ngay
    #   xuống mức đó (bám sát đáy phổ, vốn là nơi chỉ còn nhiễu nền).
    # - Nếu biên độ CAO HƠN (ví dụ đang có giọng nói) -> chỉ tăng rất chậm
    #   (NOISE_RISE_RATE nhỏ), nên giọng nói liên tục KHÔNG bị học nhầm
    #   thành nhiễu nền (khắc phục lỗi "tiếng bé" ở bản trước).
    if state.noise_mag is None:
        state.noise_mag = mag.copy()
    else:
        rising = mag > state.noise_mag
        state.noise_mag = np.where(
            rising,
            state.noise_mag + NOISE_RISE_RATE * (mag - state.noise_mag),
            mag,
        )

    # --- Tính gain (0..1) thay vì trừ trực tiếp biên độ -> giữ nguyên pha ---
    gain = 1.0 - alpha * (state.noise_mag / (mag + 1e-9))
    gain = np.clip(gain, beta, 1.0)

    # Làm mượt gain theo TẦN SỐ (giảm musical noise dạng "tiếng rít/vo ve")
    gain = np.convolve(gain, GAIN_FREQ_KERNEL, mode="same")

    # Làm mượt gain theo THỜI GIAN, nhưng KHÔNG đối xứng:
    # - Gain TĂNG (âm thanh to đột ngột xuất hiện) -> áp dụng NGAY, không làm
    #   mượt, để giữ trọn vẹn transient (súng, vỡ, hét...).
    # - Gain GIẢM (trở lại nền yên tĩnh) -> làm mượt chậm, tránh musical noise.
    if state.prev_gain is None:
        state.prev_gain = gain
    else:
        rising = gain > state.prev_gain
        gain = np.where(
            rising,
            gain,
            GAIN_TIME_SMOOTH * state.prev_gain + (1 - GAIN_TIME_SMOOTH) * gain,
        )
        state.prev_gain = gain

    clean_spec = spec * gain
    clean_frame = np.fft.irfft(clean_spec, n=FRAME_LEN).astype(np.float32)
    return clean_frame


def process_audio(
    audio_numpy_array: np.ndarray,
    sample_rate: int,
    device_id: int = 0,
    mode: str = "off",
    alpha: float = 1.2,
    beta: float = 0.15,
) -> bytes:
    """
    Xử lý 1 gói PCM int16 streaming (có trạng thái theo device_id).

    Tham số
    -------
    audio_numpy_array : mảng int16, 1 kênh, 1 gói tin từ ESP32
    sample_rate        : tần số lấy mẫu (Hz)
    device_id          : tách trạng thái lọc cho từng thiết bị/kết nối
    mode               : "off"   -> CHỈ khử DC-offset/rumble bằng high-pass rất nhẹ
                                    (~20Hz), KHÔNG spectral subtraction. Giữ nguyên
                                    100% transient và toàn bộ dải tần. Dùng cho ghi
                                    âm cần độ trung thực cao: tiếng súng, đổ vỡ, hét,
                                    hoặc bất kỳ âm thanh không phải chỉ giọng nói.
                         "voice" -> bandpass 80-6000Hz + spectral subtraction, tối
                                    ưu cho ghi âm giọng nói trong môi trường ồn ổn
                                    định (quạt, tiếng máy...). SẼ làm biến dạng nhạc
                                    và làm mờ transient của âm thanh xung động mạnh
                                    (súng, va đập) -> KHÔNG dùng cho các âm thanh đó.
    alpha, beta        : chỉ có tác dụng khi mode="voice" (xem mô tả bên dưới)

    Trả về
    ------
    bytes PCM int16 đã xử lý.
    """
    if audio_numpy_array.size == 0:
        return b""

    state = _get_state(device_id, sample_rate)

    if mode == "off":
        # Chỉ high-pass rất nhẹ (~20Hz) để loại DC-offset/rumble điện, không
        # đụng tới nội dung âm thanh -> bảo toàn transient + full dải tần.
        # Không dùng buffer/STFT nên KHÔNG có độ trễ, không đổi độ dài dữ liệu.
        x = audio_numpy_array.astype(np.float32) / 32768.0
        x, state.dc_zi = lfilter(state.dc_b, state.dc_a, x, zi=state.dc_zi)
        out = np.clip(x * 32768.0, -32768, 32767).astype(np.int16)
        return out.tobytes()

    # --- mode == "denoise": high-pass 40Hz + spectral subtraction (leaky-min) ---
    x = audio_numpy_array.astype(np.float32) / 32768.0
    x, state.zi = lfilter(state.b, state.a, x, zi=state.zi)
    x = x.astype(np.float32)

    # --- Bước 2: gộp vào buffer đầu vào, tách khung xử lý spectral subtraction ---
    state.in_buffer = np.concatenate([state.in_buffer, x])

    while len(state.in_buffer) >= FRAME_LEN:
        frame = state.in_buffer[:FRAME_LEN]
        state.in_buffer = state.in_buffer[HOP:]  # trượt HOP mẫu (overlap 50%)

        clean = _spectral_subtract_frame(frame, state, alpha, beta)
        state.frame_count += 1

        # Overlap-add vào out_buffer tại vị trí write_pos
        end = state.write_pos + FRAME_LEN
        if len(state.out_buffer) < end:
            state.out_buffer = np.concatenate(
                [state.out_buffer, np.zeros(end - len(state.out_buffer), dtype=np.float32)]
            )
        state.out_buffer[state.write_pos:end] += clean
        state.write_pos += HOP

    # Các mẫu trước write_pos đã nhận đủ đóng góp từ mọi khung liên quan
    # (khung tiếp theo, nếu có, chỉ ảnh hưởng từ vị trí write_pos trở đi)
    # -> có thể "chốt" (flush) an toàn.
    ready_len = state.write_pos
    if ready_len > 0:
        ready = state.out_buffer[:ready_len].copy()
        state.out_buffer = state.out_buffer[ready_len:]
        state.write_pos = 0
    else:
        ready = np.zeros(0, dtype=np.float32)

    out_int16 = np.clip(ready * 32768.0, -32768, 32767).astype(np.int16)
    return out_int16.tobytes()