import re
with open("c:/website/web/frontend/canh-bao.js", "r", encoding="utf-8") as f:
    text = f.read()

# Replace corrupted Vietnamese characters across the whole file
replacements = {
    "C?nh bo, pht hi?n m thanh b?o l?c. M?c d? t? l? x?y ra dnh nhau l": "Cảnh báo, phát hiện âm thanh bạo lực. Mức độ tỷ lệ xảy ra đánh nhau là",
    "ph?n tram": "phần trăm",
    "Thng bo": "Thông báo",
    "Khng c d? li?u d?i tho?i chi ti?t.": "Không có dữ liệu đối thoại chi tiết.",
    "Giy th?": "Giây thứ",
    "Nh?n d? xem ton b? h?i tho?i": "Nhấn để xem toàn bộ hội thoại",
    "??": "🗣", # The ones I missed 
}
for k, v in replacements.items():
    text = text.replace(k, v)

# Let's ensure emojis are correct:
text = text.replace("🗣 🗣", "🗣") # just in case
text = text.replace("🗣 ${formatDateTime", "🕒 ${formatDateTime")
text = text.replace("🗣 ${a.device?.area?.name", "📍 ${a.device?.area?.name")
text = text.replace("🗣 Ph", "🚨 Ph")
text = text.replace("🗣 Phát hiện", "🚨 Phát hiện")
text = text.replace("🗣 Phân tích hoàn tất", "🚨 Phân tích hoàn tất")

with open("c:/website/web/frontend/canh-bao.js", "w", encoding="utf-8") as f:
    f.write(text)
