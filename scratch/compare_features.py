import re

def parse_functions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Find all function signatures
    pattern = r'(?:void|static void|bool|static bool|float|static float|int|static int)\s+([A-Za-z0-9_]+)\s*\([^)]*\)'
    funcs = re.findall(pattern, content)
    return set(funcs), content

funcs_code, content_code = parse_functions(r'c:\NKKH\esp32-voice-recorder-20260828T083632Z-1-001\codetrainplatf\main.cpp')
funcs_rec, content_rec = parse_functions(r'c:\NKKH\esp32-voice-recorder-20260828T083632Z-1-001\esp32-voice-recorder\src\main.cpp')

print("Functions in codetrainplatf:")
print(sorted(list(funcs_code)))
print("\nFunctions in esp32-voice-recorder:")
print(sorted(list(funcs_rec)))

print("\nFunctions only in codetrainplatf:")
print(sorted(list(funcs_code - funcs_rec)))

print("\nFunctions only in esp32-voice-recorder:")
print(sorted(list(funcs_rec - funcs_code)))
