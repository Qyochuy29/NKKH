import re

with open("c:/website/web/frontend/canh-bao.js", "r", encoding="utf-8") as f:
    text = f.read()

# Replace the inner dialog div
pattern = r"\$\{a\.notes && a\.notes\.includes\('🗣'\) \? `(.*?)` : ''\}"

new_inner = """
              <div style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 12px; border-radius: 8px; margin: 12px 0 8px 0; font-weight: 600; font-size: 14px; border-left: 4px solid var(--danger);">
                <div style="margin-bottom: 8px;">${a.notes}</div>
                <button onclick="window.openDialogModal('${a.id}')" style="background: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                  <i class="bi bi-chat-text"></i> Xem toàn bộ cuộc đối thoại
                </button>
              </div>
            """
replacement = "${a.notes && a.notes.includes('🗣') ? `" + new_inner + "` : ''}"

text = re.sub(pattern, replacement, text, flags=re.DOTALL)

with open("c:/website/web/frontend/canh-bao.js", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated dialog div via regex.")
