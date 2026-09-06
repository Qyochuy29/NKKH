import re
import unicodedata

PHONETIC_WORD_MAP = {
    'lôn': 'lồn',
    'lồz': 'lồn',
    'loz': 'lồn',
    'đit': 'địt',
    'đjt': 'địt',
    'dit': 'địt',
    'djt': 'địt',
    'buoi': 'buồi',
    'bùi': 'buồi',
    'buôi': 'buồi',
    'kặc': 'cặc',
    'cac': 'cặc',
    'cặt': 'cặc',
    'nhợn': 'nhờn',
    'nhớt': 'nhờn',
}

def clean_and_normalize_word(raw_word: str) -> str:
    text = unicodedata.normalize("NFC", raw_word or "").lower()
    clean = re.sub(r"[^\w\s]", "", text).strip()
    return PHONETIC_WORD_MAP.get(clean, clean)

# Test matching
tokens_spoken = ["đit", "con", "mẹ", "mày", "tuổi", "lôn", "sánh", "vai"]
clean_tokens = [clean_and_normalize_word(w) for w in tokens_spoken]
print("Tokens spoken:", tokens_spoken)
print("Normalized tokens:", clean_tokens)

profanities = ["địt con mẹ mày", "tuổi lồn sánh vai"]
for p in profanities:
    p_tokens = p.split()
    k = len(p_tokens)
    for i in range(len(clean_tokens) - k + 1):
        if clean_tokens[i:i+k] == p_tokens:
            print(f"MATCH FOUND for '{p}' at indices {i} to {i+k-1}!")
