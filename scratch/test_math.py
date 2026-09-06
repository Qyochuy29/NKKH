import math
sample16 = 10000 # normal speaking level

# Case 1: Bug in esp32-voice-recorder
sumSquares = sample16 * sample16
rms = math.sqrt(sumSquares)
rmsDbfs_bug = 20.0 * math.log10(rms)
overallRms_bug = math.pow(10.0, rmsDbfs_bug / 20.0)
crest_bug = 1.0 / overallRms_bug

# Case 2: Correct math in codetrainplatf
fv = sample16 / 32768.0
sumSq = fv * fv
rms_corr = math.sqrt(sumSq)
rmsDbfs_corr = 20.0 * math.log10(rms_corr)
overallRms_corr = math.pow(10.0, rmsDbfs_corr / 20.0)
crest_corr = (sample16 / 32768.0) / overallRms_corr

print("BUG in esp32-voice-recorder:")
print(f"  rmsDbfs: {rmsDbfs_bug:.1f} dBFS (SHOULD BE NEGATIVE!)")
print(f"  overallRms: {overallRms_bug:.1f}")
print(f"  crest: {crest_bug:.6f} (Gate requires >= 12.0) -> ALWAYS FAILS!")

print("\nCORRECT in codetrainplatf:")
print(f"  rmsDbfs: {rmsDbfs_corr:.1f} dBFS")
print(f"  overallRms: {overallRms_corr:.4f}")
print(f"  crest: {crest_corr:.2f}")
