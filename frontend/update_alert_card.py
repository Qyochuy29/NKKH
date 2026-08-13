import re

with open("c:/website/web/frontend/canh-bao.js", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Revert the uploadAudio modal logic
start_str = "if (count > 0) {"
end_str = "event.target.value = '';"
start_idx = text.find(start_str)
end_idx = text.find(end_str)

if start_idx != -1 and end_idx != -1:
    old_block = text[start_idx:end_idx]
    
    new_block = """if (count > 0) {
        showToast('🚨 Phân tích hoàn tất', `Tìm thấy ${count} cảnh báo trong file âm thanh!`, 'danger');
        // Reload danh sách để hiện các cảnh báo mới
        await loadAlerts();
      } else {
        showToast('✅ Phân tích hoàn tất', 'Không phát hiện dấu hiệu bạo lực trong file âm thanh.', 'success');
      }

      """
    
    text = text.replace(old_block, new_block)

# 2. Modify renderAlertCard to make the card background red if it has dialog or high confidence
# Find the renderAlertCard div
old_card_div = '<div class="alert-card ${getSeverityClass(a.confidence_score)}" id="alert-${a.id}">'

new_card_div = """
      const isCritical = a.confidence_score >= 80 || (a.notes && a.notes.includes('🗣'));
      const cardStyle = isCritical ? 'background: rgba(239, 68, 68, 0.05); border: 2px solid var(--danger); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.15);' : '';
      
      return `
      <div class="alert-card ${getSeverityClass(a.confidence_score)}" id="alert-${a.id}" style="${cardStyle}">
"""

text = text.replace("return `\n      <div class=\"alert-card ${getSeverityClass(a.confidence_score)}\" id=\"alert-${a.id}\">", new_card_div)

# 3. Enhance the click button to be a distinct button instead of just a div, to make it obvious they need to click it.
# The user wants to see the whole dialog when clicking on it.
old_dialog_div = """${a.notes && a.notes.includes('🗣') ? `
              <div onclick="window.openDialogModal('${a.id}')" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 8px 12px; border-radius: 6px; margin: 12px 0 8px 0; font-weight: 600; font-size: 13px; border-left: 3px solid var(--danger); cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'" title="Nhấn để xem toàn bộ hội thoại">
                ${a.notes}
              </div>
            ` : ''}"""

new_dialog_div = """${a.notes && a.notes.includes('🗣') ? `
              <div style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 12px; border-radius: 8px; margin: 12px 0 8px 0; font-weight: 600; font-size: 14px; border-left: 4px solid var(--danger);">
                <div style="margin-bottom: 8px;">${a.notes}</div>
                <button onclick="window.openDialogModal('${a.id}')" style="background: var(--danger); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                  <i class="bi bi-chat-text"></i> Xem toàn bộ cuộc đối thoại
                </button>
              </div>
            ` : ''}"""

text = text.replace(old_dialog_div, new_dialog_div)

with open("c:/website/web/frontend/canh-bao.js", "w", encoding="utf-8") as f:
    f.write(text)
print("Updated successfully")
