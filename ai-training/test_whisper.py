import sys
import glob
sys.stdout.reconfigure(encoding='utf-8')
from faster_whisper import WhisperModel
from pydub import AudioSegment
from transcription import transcribe_vietnamese

print("Loading model...")
model = WhisperModel("large-v3", device="cpu", compute_type="int8")

# Find a test file from tai-lieu
files = (
    glob.glob(r"C:\website\web\tai-lieu\*.wav")
    + glob.glob(r"C:\website\web\tai-lieu\*.m4a")
    + glob.glob(r"C:\website\web\tai-lieu\*.mp3")
)
if not files:
    print("No audio files found.")
    sys.exit(0)

test_file = files[0]
print(f"Testing on {test_file}")

audio = AudioSegment.from_file(test_file)
# Just test the first 10 seconds
chunk = audio[:10000]

transcript, _, segments, confidence = transcribe_vietnamese(model, chunk)
print(f"Transcript ({confidence}%): {transcript or '[không nhận diện chắc chắn được lời nói]'}")
for segment in segments:
    print(
        f"  {segment.start:.2f}-{segment.end:.2f}s | "
        f"logprob={segment.avg_logprob:.3f} | no_speech={segment.no_speech_prob:.3f}"
    )
