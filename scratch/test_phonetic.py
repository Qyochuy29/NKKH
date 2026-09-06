import re
import unicodedata

PHONETIC_FIXES = [
    # Whisper commonly confuses 'địt' with 'mịt' or 'đit' or 'đệt' when shouted
    (r'(?i)\b(cái\s+)?mịt\s+con\s+mẹ\b', r'\1địt con mẹ'),
    (r'(?i)\bmịt\s+mẹ\b', 'địt mẹ'),
    (r'(?i)\bmịt\s+cụ\b', 'địt cụ'),
    (r'(?i)\bmình\s+còn\s+mẹ\s+à\s+mày\b', 'địt con mẹ mày'),
    (r'(?i)\bđit\b', 'địt'),
    (r'(?i)\bđjt\b', 'địt'),
    
    # Whisper confuses 'lồn' with 'lôn', 'nồn', 'lôm'
    (r'(?i)\btuổi\s+lôn\s+(xánh|xảnh|sánh)\s+(mày|bay|vai)\b', 'tuổi lồn sánh vai'),
    (r'(?i)\btuổi\s+lôn\b', 'tuổi lồn'),
    (r'(?i)\bmặt\s+lôn\b', 'mặt lồn'),
    (r'(?i)\bhãm\s+lôn\b', 'hãm lồn'),
    (r'(?i)\bláo\s+lôn\b', 'láo lồn'),
    (r'(?i)\bcon\s+lôn\b', 'con lồn'),
    (r'(?i)\bthằng\s+lôn\b', 'thằng lồn'),
    
    # Whisper confuses 'nhờn' with 'nhợn', 'nhớt'
    (r'(?i)\bbố\s+mày\s+(nhợn|nhớt|nhận)\s+với\s+mày\b', 'bố mày nhờn với mày'),
    (r'(?i)\bnhợn\s+với\s+(tao|bố)\b', r'nhờn với \1'),
    
    # Whisper confuses 'súc vật' with 'su vật', 'phật su vật'
    (r'(?i)\b(đồ|con|loại|phật)\s+su\s+vật\b', r'đồ súc vật'),
    (r'(?i)\b(một|mùa)\s+xíu\s+vật\b', 'đồ súc vật'),
    
    # Whisper confuses 'tao lạy mày' with 'tao lại mày', 'tao lạy máy'
    (r'(?i)\btao\s+(lại|lạy)\s+(máy|mậy)\b', 'tao lạy mày'),
    (r'(?i)\buống\s+phải\s+lạy\b', 'cũng phải lạy'),
    
    # Threats
    (r'(?i)\bđánh\s+bỡi\b', 'đánh vỡ mồm'),
]

def correct_vietnamese_transcription(text: str) -> str:
    text = unicodedata.normalize("NFC", text or "")
    for pat, rep in PHONETIC_FIXES:
        text = re.sub(pat, rep, text)
    return text

# Test cases
sample_1 = "Địt con mẹ mày, tuổi lôn xánh mày, nhớ à, cái mẹ bố mày nhờn với mày đấy à, đánh bỡi nhé mày, con mẹ mày, tao lại mày, đồ chó đánh vỡ mồm mày ra rồi"
sample_2 = "Mình còn mẹ à mày, tuổi lôn xảnh bay! bố mày nhợn với mày đấy hả? đồ su vật, tao lạy máy"

print("Original 1:", sample_1)
print("Corrected 1:", correct_vietnamese_transcription(sample_1))
print()
print("Original 2:", sample_2)
print("Corrected 2:", correct_vietnamese_transcription(sample_2))
