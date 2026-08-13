import re
with open("c:/website/web/frontend/canh-bao.js", "r", encoding="utf-8") as f:
    text = f.read()

replacements = {
    "Thng bo": "Thông báo",
    "Khng c d? li?u d?i tho?i chi ti?t.": "Không có dữ liệu đối thoại chi tiết.",
    "Giy th?": "Giây thứ",
    "Nh?n d? xem ton b? h?i tho?i": "Nhấn để xem toàn bộ hội thoại",
    "??": "📍" # Some other ones
}

for k, v in replacements.items():
    text = text.replace(k, v)

with open("c:/website/web/frontend/canh-bao.js", "w", encoding="utf-8") as f:
    f.write(text)
