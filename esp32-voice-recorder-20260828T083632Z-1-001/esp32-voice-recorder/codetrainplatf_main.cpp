#include <Arduino.h>
#include <driver/i2s.h>
#include <esp_heap_caps.h>
#include <math.h>
#include <MicroTFLite.h>

#include "4NHAN91.h"

// ============================================================
// ESP32-S3 + INMP441
// L/R cua INMP441 noi GND => LEFT channel
// ============================================================
#define I2S_PORT I2S_NUM_0
#define I2S_BCLK 12
#define I2S_LRCL 13
#define I2S_DIN 14

// ============================================================
// MODEL CONTRACT
// ============================================================
static constexpr int SR = AUDIO_MODEL_SAMPLE_RATE;
static constexpr int NUM_SEC = AUDIO_MODEL_DURATION_SECONDS;
static constexpr int N_SAMPLES = AUDIO_MODEL_SAMPLES;
static constexpr int N_FFT = AUDIO_MODEL_N_FFT;
static constexpr int HOP = AUDIO_MODEL_HOP_LENGTH;
static constexpr int N_MELS = AUDIO_MODEL_N_MELS;
static constexpr int N_FRAMES = AUDIO_MODEL_FRAMES;
static constexpr int N_BINS = N_FFT / 2 + 1;
static constexpr int N_INPUTS = N_MELS * N_FRAMES;
static constexpr int N_CLASSES = 4;

// ============================================================
// MEMORY
// ============================================================
static constexpr size_t TENSOR_ARENA_SIZE = 768 * 1024;

static int16_t *g_audio = nullptr;
static float *g_melPower = nullptr;
static float *g_melFilter = nullptr;
static uint8_t *g_tensorArena = nullptr;

static float g_hann[N_FFT];
static float g_fftReal[N_FFT];
static float g_fftImag[N_FFT];
static float g_fftCos[N_FFT / 2];
static float g_fftSin[N_FFT / 2];
static float g_power[N_BINS];

// ============================================================
// PHAT HIEN VA DAP / GO BAN
// ============================================================
// Khong chi dua vao clipping.
// Phan tich RMS theo block 10 ms de nhan xung ngan kieu "BOP".
static bool g_audioClipped = false;
static uint32_t g_clippedSamples = 0;

static bool g_audioLikelyImpact = false;
static float g_impactPeakNorm = 0.0f;
static float g_impactCrest = 0.0f;
static float g_impactActiveMs = 0.0f;
static float g_impactLongestMs = 0.0f;
static int g_impactTransientCount = 0;

// Block 10 ms @ 16 kHz
static constexpr int IMPACT_BLOCK_MS = 10;
static constexpr int IMPACT_BLOCK_SAMPLES = SR * IMPACT_BLOCK_MS / 1000;
static constexpr int IMPACT_NUM_BLOCKS = N_SAMPLES / IMPACT_BLOCK_SAMPLES;

// Nguong bao thu, de tranh KHOC that bi ep thanh DAP_PHA.
// Co the tune sau neu can.
// FIX: khong bat buoc mic phai clipping moi duoc coi la va dap.
// Dung 2 gate: mot cu dap rat manh, hoac nhieu transient ngan lien tiep.
static constexpr float IMPACT_SINGLE_MIN_PEAK_NORM = 0.70f;
static constexpr float IMPACT_SINGLE_MIN_CREST = 12.0f;
static constexpr float IMPACT_SINGLE_MAX_ACTIVE_MS = 320.0f;
static constexpr float IMPACT_SINGLE_MAX_LONGEST_MS = 90.0f;

static constexpr float IMPACT_MULTI_MIN_PEAK_NORM = 0.55f;
static constexpr float IMPACT_MULTI_MIN_CREST = 9.0f;
static constexpr float IMPACT_MULTI_MAX_ACTIVE_MS = 550.0f;
static constexpr float IMPACT_MULTI_MAX_LONGEST_MS = 140.0f;

// ============================================================
// LABELS
// Thu tu phai trung voi file .h:
// 0 KHOC, 1 DAP_PHA, 2 CHUI_NHAU, 3 TIENG_ON
// ============================================================
static const char *LABELS[N_CLASSES] = {
    "KHOC",
    "DAP_PHA",
    "CHUI_NHAU",
    "TIENG_ON"};

// ============================================================
// HELPERS
// ============================================================
static void fatal(const char *msg)
{
    Serial.println();
    Serial.println("========================================");
    Serial.print("LOI: ");
    Serial.println(msg);
    Serial.println("========================================");

    while (true)
    {
        delay(1000);
    }
}

static void *allocPsram(size_t bytes, const char *name)
{
    void *p = heap_caps_malloc(bytes, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);

    if (!p)
    {
        Serial.printf("Khong cap phat duoc %s: %u bytes\n",
                      name, (unsigned)bytes);
        return nullptr;
    }

    memset(p, 0, bytes);
    Serial.printf("OK %-14s: %u bytes\n", name, (unsigned)bytes);
    return p;
}

// ============================================================
// I2S / INMP441
// ============================================================
static void initI2S()
{
    i2s_config_t cfg = {};
    cfg.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX);
    cfg.sample_rate = SR;
    cfg.bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT;
    cfg.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT;
    cfg.communication_format = I2S_COMM_FORMAT_STAND_I2S;
    cfg.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
    cfg.dma_buf_count = 8;
    cfg.dma_buf_len = 512;
    cfg.use_apll = false;
    cfg.tx_desc_auto_clear = false;
    cfg.fixed_mclk = 0;

    i2s_pin_config_t pins = {};
    pins.bck_io_num = I2S_BCLK;
    pins.ws_io_num = I2S_LRCL;
    pins.data_out_num = I2S_PIN_NO_CHANGE;
    pins.data_in_num = I2S_DIN;

    esp_err_t err = i2s_driver_install(I2S_PORT, &cfg, 0, nullptr);
    if (err != ESP_OK)
    {
        Serial.printf("i2s_driver_install = %d\n", (int)err);
        fatal("Khoi tao I2S that bai");
    }

    err = i2s_set_pin(I2S_PORT, &pins);
    if (err != ESP_OK)
    {
        Serial.printf("i2s_set_pin = %d\n", (int)err);
        fatal("Gan chan I2S that bai");
    }

    i2s_zero_dma_buffer(I2S_PORT);

    Serial.println("I2S OK");
    Serial.printf("INMP441: BCLK=%d  WS=%d  SD=%d\n",
                  I2S_BCLK, I2S_LRCL, I2S_DIN);
}

static bool capture5Seconds(float &rmsDbfs, int16_t &peakOut)
{
    static int32_t raw[512];

    int collected = 0;
    double sumSq = 0.0;
    int32_t peak = 0;
    uint32_t clippedSamples = 0;

    while (collected < N_SAMPLES)
    {
        size_t bytesRead = 0;

        esp_err_t err = i2s_read(
            I2S_PORT,
            raw,
            sizeof(raw),
            &bytesRead,
            portMAX_DELAY);

        if (err != ESP_OK)
        {
            Serial.printf("i2s_read error = %d\n", (int)err);
            return false;
        }

        const int count = bytesRead / sizeof(int32_t);

        for (int i = 0; i < count && collected < N_SAMPLES; ++i)
        {
            int32_t s = raw[i] >> 16;

            if (s > 32767)
                s = 32767;
            if (s < -32768)
                s = -32768;

            const int16_t v = (int16_t)s;
            g_audio[collected++] = v;

            const int32_t av = (v < 0) ? -(int32_t)v : (int32_t)v;
            if (av > peak)
                peak = av;
            if (av >= 32700)
                ++clippedSamples;

            const double fv = (double)v / 32768.0;
            sumSq += fv * fv;
        }
    }

    const double rms = sqrt(sumSq / (double)N_SAMPLES);

    if (rms > 1e-12)
    {
        rmsDbfs = (float)(20.0 * log10(rms));
    }
    else
    {
        rmsDbfs = -120.0f;
    }

    peakOut = (int16_t)((peak > 32767) ? 32767 : peak);
    g_clippedSamples = clippedSamples;
    g_audioClipped = (clippedSamples > 0);

    // Se phan tich va dap bang ham analyzeImpact() sau khi thu xong.
    g_audioLikelyImpact = false;

    return true;
}

// ============================================================
// PHAN TICH XUNG VA DAP / GO BAN
// ============================================================
static bool analyzeImpact(float rmsDbfs, int16_t peakSample)
{
    float blockRms[IMPACT_NUM_BLOCKS];

    float maxBlock = 0.0f;
    float meanBlock = 0.0f;

    for (int b = 0; b < IMPACT_NUM_BLOCKS; ++b)
    {
        double sumSq = 0.0;
        const int start = b * IMPACT_BLOCK_SAMPLES;

        for (int n = 0; n < IMPACT_BLOCK_SAMPLES; ++n)
        {
            const float x =
                (float)g_audio[start + n] / 32768.0f;

            sumSq += (double)x * (double)x;
        }

        const float rms =
            sqrtf((float)(sumSq / IMPACT_BLOCK_SAMPLES));

        blockRms[b] = rms;
        meanBlock += rms;

        if (rms > maxBlock)
        {
            maxBlock = rms;
        }
    }

    meanBlock /= (float)IMPACT_NUM_BLOCKS;

    const float overallRms =
        powf(10.0f, rmsDbfs / 20.0f);

    const float peakNorm =
        fabsf((float)peakSample) / 32768.0f;

    float crest = 0.0f;

    if (overallRms > 1e-8f)
    {
        crest = peakNorm / overallRms;
    }

    // Active threshold tu dong:
    // xung go thuong co 1 vai block cao hon nen rat nhieu.
    float activeTh = maxBlock * 0.18f;

    const float meanBased = meanBlock * 2.5f;
    if (activeTh < meanBased)
    {
        activeTh = meanBased;
    }

    if (activeTh < 0.0020f)
    {
        activeTh = 0.0020f;
    }

    int activeBlocks = 0;
    int longestRun = 0;
    int currentRun = 0;

    // Dem transient: block vuot 55% max, sau do phai ha xuong
    // duoi 22% max moi cho dem xung tiep theo.
    const float highTh = maxBlock * 0.55f;
    const float lowTh = maxBlock * 0.22f;

    int transientCount = 0;
    bool armed = true;

    for (int b = 0; b < IMPACT_NUM_BLOCKS; ++b)
    {
        const bool active = blockRms[b] >= activeTh;

        if (active)
        {
            ++activeBlocks;
            ++currentRun;

            if (currentRun > longestRun)
            {
                longestRun = currentRun;
            }
        }
        else
        {
            currentRun = 0;
        }

        if (armed &&
            highTh > 0.002f &&
            blockRms[b] >= highTh)
        {
            ++transientCount;
            armed = false;
        }

        if (!armed && blockRms[b] <= lowTh)
        {
            armed = true;
        }
    }

    const float activeMs =
        activeBlocks * IMPACT_BLOCK_MS;

    const float longestMs =
        longestRun * IMPACT_BLOCK_MS;

    g_impactPeakNorm = peakNorm;
    g_impactCrest = crest;
    g_impactActiveMs = activeMs;
    g_impactLongestMs = longestMs;
    g_impactTransientCount = transientCount;

    // ==========================================================
    // DIEU KIEN VA DAP - FIX
    // ==========================================================
    // KHONG bat buoc clipping. INMP441 co the thu mot cu dap rat manh
    // nhung peak van duoi 32700, nhu mau thuc te peakNorm=0.740.
    //
    // Gate A: 1 cu dap manh, xung rat nhon va ngan.
    const bool singleStrongImpact =
        transientCount >= 1 &&
        peakNorm >= IMPACT_SINGLE_MIN_PEAK_NORM &&
        crest >= IMPACT_SINGLE_MIN_CREST &&
        activeMs <= IMPACT_SINGLE_MAX_ACTIVE_MS &&
        longestMs <= IMPACT_SINGLE_MAX_LONGEST_MS;

    // Gate B: co tu 2 transient tro len; cho phep peak thap hon mot chut
    // nhung van yeu cau crest cao va cac xung ngan de tranh tieng noi.
    const bool multiTransientImpact =
        transientCount >= 2 &&
        peakNorm >= IMPACT_MULTI_MIN_PEAK_NORM &&
        crest >= IMPACT_MULTI_MIN_CREST &&
        activeMs <= IMPACT_MULTI_MAX_ACTIVE_MS &&
        longestMs <= IMPACT_MULTI_MAX_LONGEST_MS;

    const bool impact = singleStrongImpact || multiTransientImpact;

    g_audioLikelyImpact = impact;

    Serial.println();
    Serial.println("============= IMPACT CHECK =============");
    Serial.printf("peakNorm   : %.3f\n", peakNorm);
    Serial.printf("crest      : %.2f\n", crest);
    Serial.printf("activeMs   : %.0f ms\n", activeMs);
    Serial.printf("longestMs  : %.0f ms\n", longestMs);
    Serial.printf("transients : %d\n", transientCount);
    Serial.printf("gateSingle : %s\n", singleStrongImpact ? "YES" : "NO");
    Serial.printf("gateMulti  : %s\n", multiTransientImpact ? "YES" : "NO");
    Serial.printf("impact     : %s\n", impact ? "YES" : "NO");
    Serial.println("========================================");

    return impact;
}

// ============================================================
// FFT 512 - chi dung de tao Log-Mel cho model
// KHONG dung FFT de override nhan.
// ============================================================
static void initFFT()
{
    for (int n = 0; n < N_FFT; ++n)
    {
        g_hann[n] =
            0.5f - 0.5f * cosf(2.0f * PI * (float)n / (float)N_FFT);
    }

    for (int k = 0; k < N_FFT / 2; ++k)
    {
        const float a = -2.0f * PI * (float)k / (float)N_FFT;
        g_fftCos[k] = cosf(a);
        g_fftSin[k] = sinf(a);
    }
}

static void fft512(float *re, float *im)
{
    unsigned j = 0;

    for (unsigned i = 1; i < N_FFT; ++i)
    {
        unsigned bit = N_FFT >> 1;

        while (j & bit)
        {
            j ^= bit;
            bit >>= 1;
        }

        j ^= bit;

        if (i < j)
        {
            float t = re[i];
            re[i] = re[j];
            re[j] = t;

            t = im[i];
            im[i] = im[j];
            im[j] = t;
        }
    }

    for (unsigned len = 2; len <= N_FFT; len <<= 1)
    {
        const unsigned half = len >> 1;
        const unsigned twStep = N_FFT / len;

        for (unsigned base = 0; base < N_FFT; base += len)
        {
            for (unsigned n = 0; n < half; ++n)
            {
                const unsigned tw = n * twStep;

                const float wr = g_fftCos[tw];
                const float wi = g_fftSin[tw];

                const unsigned even = base + n;
                const unsigned odd = even + half;

                const float orr = re[odd];
                const float oii = im[odd];

                const float tr = wr * orr - wi * oii;
                const float ti = wr * oii + wi * orr;

                const float er = re[even];
                const float ei = im[even];

                re[even] = er + tr;
                im[even] = ei + ti;
                re[odd] = er - tr;
                im[odd] = ei - ti;
            }
        }
    }
}

// ============================================================
// LIBROSA SLANEY MEL FILTER
// ============================================================
static float hzToMelSlaney(float hz)
{
    const float fMin = 0.0f;
    const float fSp = 200.0f / 3.0f;

    float mel = (hz - fMin) / fSp;

    const float minLogHz = 1000.0f;
    const float minLogMel = (minLogHz - fMin) / fSp;
    const float logStep = logf(6.4f) / 27.0f;

    if (hz >= minLogHz)
    {
        mel = minLogMel + logf(hz / minLogHz) / logStep;
    }

    return mel;
}

static float melToHzSlaney(float mel)
{
    const float fMin = 0.0f;
    const float fSp = 200.0f / 3.0f;

    float hz = fMin + fSp * mel;

    const float minLogHz = 1000.0f;
    const float minLogMel = (minLogHz - fMin) / fSp;
    const float logStep = logf(6.4f) / 27.0f;

    if (mel >= minLogMel)
    {
        hz = minLogHz * expf(logStep * (mel - minLogMel));
    }

    return hz;
}

static void initMelFilterBank()
{
    float melFreq[N_MELS + 2];

    const float fMin = 0.0f;
    const float fMax = SR * 0.5f;

    const float melMin = hzToMelSlaney(fMin);
    const float melMax = hzToMelSlaney(fMax);

    for (int i = 0; i < N_MELS + 2; ++i)
    {
        const float mel =
            melMin + (melMax - melMin) * (float)i / (float)(N_MELS + 1);

        melFreq[i] = melToHzSlaney(mel);
    }

    for (int m = 0; m < N_MELS; ++m)
    {
        const float left = melFreq[m];
        const float center = melFreq[m + 1];
        const float right = melFreq[m + 2];

        const float enorm = 2.0f / (right - left);

        for (int k = 0; k < N_BINS; ++k)
        {
            const float hz = (float)k * (float)SR / (float)N_FFT;

            const float lower = (hz - left) / (center - left);
            const float upper = (right - hz) / (right - center);

            float w = fminf(lower, upper);
            if (w < 0.0f)
                w = 0.0f;

            g_melFilter[m * N_BINS + k] = w * enorm;
        }
    }
}

// ============================================================
// LOG-MEL -> MODEL INPUT
// ============================================================
static bool buildLogMelAndSetModelInput()
{
    float maxMel = 0.0f;

    for (int frame = 0; frame < N_FRAMES; ++frame)
    {
        const int firstSample = frame * HOP - N_FFT / 2;

        for (int n = 0; n < N_FFT; ++n)
        {
            const int src = firstSample + n;

            float x = 0.0f;

            if (src >= 0 && src < N_SAMPLES)
            {
                x = (float)g_audio[src] / 32768.0f;
            }

            g_fftReal[n] = x * g_hann[n];
            g_fftImag[n] = 0.0f;
        }

        fft512(g_fftReal, g_fftImag);

        for (int k = 0; k < N_BINS; ++k)
        {
            const float re = g_fftReal[k];
            const float im = g_fftImag[k];

            g_power[k] = re * re + im * im;
        }

        for (int m = 0; m < N_MELS; ++m)
        {
            const float *filter = &g_melFilter[m * N_BINS];

            float e = 0.0f;

            for (int k = 0; k < N_BINS; ++k)
            {
                e += filter[k] * g_power[k];
            }

            g_melPower[m * N_FRAMES + frame] = e;

            if (e > maxMel)
            {
                maxMel = e;
            }
        }

        if ((frame & 31) == 0)
        {
            delay(0);
        }
    }

    const float amin = 1e-10f;
    const float refPower = fmaxf(maxMel, amin);
    const float refDb = 10.0f * log10f(refPower);

    int inputIndex = 0;

    for (int m = 0; m < N_MELS; ++m)
    {
        for (int frame = 0; frame < N_FRAMES; ++frame)
        {
            float p = g_melPower[m * N_FRAMES + frame];

            if (p < amin)
            {
                p = amin;
            }

            float db = 10.0f * log10f(p) - refDb;

            if (db < -80.0f)
                db = -80.0f;
            if (db > 0.0f)
                db = 0.0f;

            float feat = (db + 80.0f) / 80.0f;

            if (feat < 0.0f)
                feat = 0.0f;
            if (feat > 1.0f)
                feat = 1.0f;

            if (!ModelSetInput(feat, inputIndex))
            {
                Serial.printf("ModelSetInput fail tai index %d\n", inputIndex);
                return false;
            }

            ++inputIndex;
        }

        delay(0);
    }

    return inputIndex == N_INPUTS;
}

// ============================================================
// ALERT
// ============================================================
static void sendAlert(int cls, float confidence)
{
    Serial.println();
    Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    Serial.printf("CANH BAO: %s | %.2f%%\n",
                  LABELS[cls],
                  confidence * 100.0f);
    Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    Serial.println();
}

// ============================================================
// KET QUA: SU DUNG THRESHOLD + IMPACT DETECTION
// ============================================================
static void printAndHandleResult()
{
    float prob[N_CLASSES];

    for (int i = 0; i < N_CLASSES; ++i)
    {
        prob[i] = ModelGetOutput(i);

        if (!isfinite(prob[i]))
            prob[i] = 0.0f;
        if (prob[i] < 0.0f)
            prob[i] = 0.0f;
        if (prob[i] > 1.0f)
            prob[i] = 1.0f;
    }

    Serial.println();
    Serial.println("============= KET QUA AI =============");
    Serial.printf("KHOC      : %6.2f %%\n",
                  prob[AUDIO_CLASS_KHOC] * 100.0f);
    Serial.printf("DAP PHA   : %6.2f %%\n",
                  prob[AUDIO_CLASS_DAP_PHA] * 100.0f);
    Serial.printf("CHUI NHAU : %6.2f %%\n",
                  prob[AUDIO_CLASS_CHUI_NHAU] * 100.0f);
    Serial.printf("TIENG ON  : %6.2f %%\n",
                  prob[AUDIO_CLASS_TIENG_ON] * 100.0f);

    Serial.println("--------------------------------------");

    // ==========================================================
    // DAP_PHA: PHAI CO IMPACT DETECTION
    // ==========================================================
    if (prob[AUDIO_CLASS_DAP_PHA] >= AUDIO_THRESHOLD_DAP_PHA &&
        g_audioLikelyImpact)
    {
        Serial.printf("=> NHAN: DAP_PHA (%.2f%%) + IMPACT DETECTED\n",
                      prob[AUDIO_CLASS_DAP_PHA] * 100.0f);
        Serial.println("======================================");
        sendAlert(AUDIO_CLASS_DAP_PHA, prob[AUDIO_CLASS_DAP_PHA]);
        return;
    }

    // ==========================================================
    // KHOC: CHI CANH BAO NEU >= THRESHOLD
    // ==========================================================
    if (prob[AUDIO_CLASS_KHOC] >= AUDIO_THRESHOLD_KHOC)
    {
        Serial.printf("=> NHAN: KHOC (%.2f%%)\n",
                      prob[AUDIO_CLASS_KHOC] * 100.0f);
        Serial.println("======================================");
        sendAlert(AUDIO_CLASS_KHOC, prob[AUDIO_CLASS_KHOC]);
        return;
    }

    // ==========================================================
    // CHUI_NHAU: CHI CANH BAO NEU >= THRESHOLD
    // ==========================================================
    if (prob[AUDIO_CLASS_CHUI_NHAU] >= AUDIO_THRESHOLD_CHUI_NHAU)
    {
        Serial.printf("=> NHAN: CHUI_NHAU (%.2f%%)\n",
                      prob[AUDIO_CLASS_CHUI_NHAU] * 100.0f);
        Serial.println("======================================");
        sendAlert(AUDIO_CLASS_CHUI_NHAU, prob[AUDIO_CLASS_CHUI_NHAU]);
        return;
    }

    // ==========================================================
    // KO DUNG NHAN NAO
    // ==========================================================
    Serial.println("=> KET QUA: KHONG RO NHAN NAO");
    Serial.println("=> KHONG CANH BAO.");
    Serial.println("======================================");
}

// ============================================================
// SETUP
// ============================================================
void setup()
{
    Serial.begin(115200);
    delay(1500);

    Serial.println();
    Serial.println("================================================");
    Serial.println(" ESP32-S3 + INMP441 - AI 4 NHAN");
    Serial.println(" QUY TAC - IMPACT FIX:");
    Serial.printf(" - DAP_PHA CNN threshold: %.0f%% (neu impact manh thi override truoc CNN)\n",
                  AUDIO_THRESHOLD_DAP_PHA * 100.0f);
    Serial.printf(" - KHOC threshold: %.0f%%\n", AUDIO_THRESHOLD_KHOC * 100.0f);
    Serial.printf(" - CHUI_NHAU threshold: %.0f%%\n", AUDIO_THRESHOLD_CHUI_NHAU * 100.0f);
    Serial.println(" - CON LAI: KHONG RO, KHONG CANH BAO");
    Serial.println("================================================");

    Serial.printf("Model bytes: %u\n",
                  (unsigned)g_audio_model_data_4classes_5s_len);
    Serial.printf("Audio: %d Hz, %d giay, %d samples\n",
                  SR, NUM_SEC, N_SAMPLES);
    Serial.printf("LogMel: %d mel x %d frame\n",
                  N_MELS, N_FRAMES);

    if (!psramFound())
    {
        fatal("Khong thay PSRAM. Kiem tra platformio.ini / board ESP32-S3.");
    }

    Serial.printf("PSRAM free: %u bytes\n",
                  (unsigned)ESP.getFreePsram());

    g_audio = (int16_t *)allocPsram(
        N_SAMPLES * sizeof(int16_t),
        "audio");

    g_melPower = (float *)allocPsram(
        N_INPUTS * sizeof(float),
        "melPower");

    g_melFilter = (float *)allocPsram(
        N_MELS * N_BINS * sizeof(float),
        "melFilter");

    g_tensorArena = (uint8_t *)allocPsram(
        TENSOR_ARENA_SIZE,
        "tensorArena");

    if (!g_audio || !g_melPower || !g_melFilter || !g_tensorArena)
    {
        fatal("Khong du PSRAM");
    }

    initFFT();
    initMelFilterBank();
    initI2S();

    Serial.println();
    Serial.println("Khoi tao TensorFlow Lite Micro...");

    if (!ModelInit(
            g_audio_model_data_4classes_5s,
            g_tensorArena,
            TENSOR_ARENA_SIZE))
    {
        fatal("ModelInit that bai.");
    }

    Serial.println("MODEL INIT OK");
    Serial.println();
    Serial.println("BAT DAU TEST.");
    Serial.println();
}

// ============================================================
// LOOP
// ============================================================
void loop()
{
    Serial.println("----------------------------------------");
    Serial.println("Dang thu 5 giay am thanh...");

    float rmsDbfs = -120.0f;
    int16_t peak = 0;

    const uint32_t t0 = millis();

    if (!capture5Seconds(rmsDbfs, peak))
    {
        Serial.println("Thu am that bai, thu lai...");
        delay(200);
        return;
    }

    const uint32_t tCapture = millis();

    Serial.printf(
        "Thu xong: %.2fs | RMS %.1f dBFS | peak %d | clip %lu mau\n",
        (tCapture - t0) / 1000.0f,
        rmsDbfs,
        (int)peak,
        (unsigned long)g_clippedSamples);

    if (peak < 2)
    {
        Serial.println(
            "CANH BAO MIC: tin hieu gan 0. Kiem tra BCLK/WS/SD/L-R/GND.");
    }

    // Phan tich xung va dap NGAY SAU KHI THU.
    // Khong can doi den clipping.
    analyzeImpact(rmsDbfs, peak);

    if (g_audioLikelyImpact)
    {
        Serial.println();
        Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        Serial.println("=> PHAT HIEN XUNG VA DAP / GO BAN");
        Serial.println("=> KET QUA CUOI: DAP_PHA");
        Serial.println("=> KHONG DUA XUNG NAY VAO MODEL KHOC");
        Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

        sendAlert(AUDIO_CLASS_DAP_PHA, 1.0f);

        delay(200);
        return;
    }

    // Neu clipping keo dai ma khong phai xung ngan,
    // bo qua cua so de tranh model doc sai tin hieu bi bao hoa.
    if (g_audioClipped && !g_audioLikelyImpact)
    {
        Serial.println(
            "=> BO QUA: tin hieu bi bao hoa keo dai, khong du dieu kien ket luan.");
        delay(200);
        return;
    }

    Serial.println("Dang tao Log-Mel 40x501...");

    if (!buildLogMelAndSetModelInput())
    {
        Serial.println("Tao feature / nap input that bai.");
        delay(500);
        return;
    }

    const uint32_t tFeat = millis();

    Serial.printf("DSP xong: %.2fs\n",
                  (tFeat - tCapture) / 1000.0f);

    Serial.println("Dang inference...");

    if (!ModelRunInference())
    {
        Serial.println("ModelRunInference FAILED");
        delay(500);
        return;
    }

    const uint32_t tInfer = millis();

    Serial.printf("Inference: %.3fs\n",
                  (tInfer - tFeat) / 1000.0f);

    printAndHandleResult();

    Serial.printf("Tong chu ky: %.2fs\n",
                  (millis() - t0) / 1000.0f);

    delay(100);
}
