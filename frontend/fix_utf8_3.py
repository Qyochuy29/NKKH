import re
with open("c:/website/web/frontend/canh-bao.js", "r", encoding="utf-8") as f:
    text = f.read()

# Revert the accidental ?? replacements
text = text.replace("const count = data.total_alerts 🗣 data.totalAlerts 🗣 0;", "const count = data.total_alerts ?? data.totalAlerts ?? 0;")

with open("c:/website/web/frontend/canh-bao.js", "w", encoding="utf-8") as f:
    f.write(text)
