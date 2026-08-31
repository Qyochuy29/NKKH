import unittest
from types import SimpleNamespace

from pydub import AudioSegment

from transcription import transcribe_vietnamese


def segment(text, avg_logprob=-0.2, no_speech_prob=0.05, compression_ratio=1.0):
    return SimpleNamespace(
        text=text,
        words=[],
        avg_logprob=avg_logprob,
        no_speech_prob=no_speech_prob,
        compression_ratio=compression_ratio,
    )


class FakeModel:
    def __init__(self, segments):
        self.segments = segments
        self.kwargs = None

    def transcribe(self, waveform, **kwargs):
        self.kwargs = kwargs
        return iter(self.segments), SimpleNamespace()


class TranscriptionTests(unittest.TestCase):
    def setUp(self):
        self.audio = AudioSegment.silent(duration=1000, frame_rate=16000)

    def test_uses_conservative_decoding_without_a_biasing_prompt(self):
        model = FakeModel([segment(" Xin chào ")])
        text, _, _, confidence = transcribe_vietnamese(model, self.audio)

        self.assertEqual("Xin chào", text)
        self.assertGreater(confidence, 0)
        self.assertEqual(0.0, model.kwargs["temperature"])
        self.assertIsNone(model.kwargs["initial_prompt"])
        self.assertFalse(model.kwargs["condition_on_previous_text"])
        self.assertTrue(model.kwargs["vad_filter"])

    def test_rejects_low_confidence_or_no_speech_segments(self):
        model = FakeModel(
            [
                segment("câu đoán từ tiếng ồn", avg_logprob=-1.2),
                segment("câu đoán từ im lặng", avg_logprob=-0.5, no_speech_prob=0.9),
            ]
        )
        text, words, accepted, confidence = transcribe_vietnamese(model, self.audio)

        self.assertEqual("", text)
        self.assertEqual([], words)
        self.assertEqual([], accepted)
        self.assertEqual(0.0, confidence)

    def test_rejects_common_hallucinations_and_repetition(self):
        model = FakeModel(
            [
                segment("Cảm ơn các bạn đã xem"),
                segment("xin chào xin chào xin chào"),
                segment("Nội dung thật trong file"),
            ]
        )
        text, _, _, _ = transcribe_vietnamese(model, self.audio)

        self.assertEqual("Nội dung thật trong file", text)


if __name__ == "__main__":
    unittest.main()
