import re

with open("c:/website/web/frontend/canh-bao.js", "r", encoding="utf-8") as f:
    text = f.read()

# Replace emojis in renderAlertCard meta section
text = text.replace(
    '<span>📍 ${a.device?.area?.name || a.device?.area || \'?\'} — ${a.device?.name || \'\'}</span>',
    '<span><i class="bi bi-geo-alt-fill"></i> ${a.device?.area?.name || a.device?.area || \'?\'} — ${a.device?.name || \'\'}</span>'
)
text = text.replace(
    '<span>🕐 ${formatDateTime(a.timestamp)}</span>',
    '<span><i class="bi bi-clock-fill"></i> ${formatDateTime(a.timestamp)}</span>'
)
text = text.replace(
    '${a.handled_by ? `<span>👤 ${a.handled_by.full_name}</span>` : \'\'}',
    '${a.handled_by ? `<span><i class="bi bi-person-check-fill"></i> ${a.handled_by.full_name}</span>` : \'\'}'
)
text = text.replace(
    '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">📝 ${a.notes}</div>',
    '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;"><i class="bi bi-pencil-square"></i> ${a.notes}</div>'
)

# Replace emojis in openDialogModal stats section
text = text.replace(
    '<span>⚠️ Tỉ lệ bạo lực: <strong style="color:${probColor};font-size:16px">${prob.toFixed(0)}%</strong></span>',
    '<span><i class="bi bi-exclamation-triangle-fill" style="color:${probColor}"></i> Tỉ lệ bạo lực: <strong style="color:${probColor};font-size:16px">${prob.toFixed(0)}%</strong></span>'
)
text = text.replace(
    "${scream ? '<span>😱 Có tiếng la hét</span>' : ''}",
    "${scream ? '<span><i class=\"bi bi-volume-up-fill text-danger\"></i> Có tiếng la hét</span>' : ''}"
)
text = text.replace(
    '${threats > 0 ? `<span>🔴 Lời đe dọa: ${threats}</span>` : \'\'}',
    '${threats > 0 ? `<span><i class="bi bi-shield-x-fill text-danger"></i> Lời đe dọa: ${threats}</span>` : \'\'}'
)
text = text.replace(
    '${vulgarity > 0 ? `<span>🤬 Chửi thề: ${vulgarity}</span>` : \'\'}',
    '${vulgarity > 0 ? `<span><i class="bi bi-chat-x-fill text-warning"></i> Chửi thề: ${vulgarity}</span>` : \'\'}'
)

with open("c:/website/web/frontend/canh-bao.js", "w", encoding="utf-8") as f:
    f.write(text)

print("Done replacing emojis with Bootstrap icons in canh-bao.js")
