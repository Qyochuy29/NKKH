import re
with open("c:/website/web/frontend/canh-bao.js", "r", encoding="utf-8") as f:
    text = f.read()

# Replace corrupted emoji patterns
text = text.replace("a.notes.includes('??')", "a.notes.includes('🗣')")
text = text.replace("?? ${a.notes}", "📝 ${a.notes}")
text = text.replace("dY\"? ${a.device?.area?.name", "📍 ${a.device?.area?.name")
text = text.replace("dY ? ${formatDateTime", "🕒 ${formatDateTime")
text = text.replace("dY`  ${a.handled_by.full_name}", "👤 ${a.handled_by.full_name}")
text = text.replace("?? ${a.handled_by.full_name}", "👤 ${a.handled_by.full_name}")
text = text.replace("?? ${a.device?.area?.name", "📍 ${a.device?.area?.name")
text = text.replace("?? ${formatDateTime", "🕒 ${formatDateTime")

with open("c:/website/web/frontend/canh-bao.js", "w", encoding="utf-8") as f:
    f.write(text)
