import re

with open("c:/website/web/frontend/canh-bao.js", "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "if (count > 0) {"
end_marker = "event.target.value = '';"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx != -1 and end_idx != -1:
    old_block = text[start_idx:end_idx]
    
    new_block = """if (count > 0) {
        showToast('🚨 Phân tích hoàn tất', `Tìm thấy ${count} cảnh báo trong file âm thanh!`, 'danger');
        
        if (data.alerts && data.alerts.length > 0) {
          const maxConf = Math.max(...data.alerts.map(a => a.confidence_score));
          if (maxConf > 0) {
            // Hiển thị một popup lớn cảnh báo
            const alertId = data.alerts[0].id;
            const overlay = document.createElement('div');
            overlay.id = 'critical-alert-overlay';
            overlay.innerHTML = `
              <style>
                @keyframes pulseDanger { 
                  0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 
                  70% { box-shadow: 0 0 0 30px rgba(239,68,68,0); } 
                  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } 
                }
                @keyframes popIn {
                  0% { transform: scale(0.8); opacity: 0; }
                  100% { transform: scale(1); opacity: 1; }
                }
              </style>
              <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px);">
                <div style="background:white;padding:40px;border-radius:20px;text-align:center;max-width:500px;border:2px solid var(--danger);animation: popIn 0.3s ease-out, pulseDanger 2s infinite;">
                  <div style="font-size:70px;color:var(--danger);margin-bottom:15px;line-height:1;">⚠️</div>
                  <h1 style="color:var(--danger);font-size:32px;font-weight:900;margin-bottom:15px;text-transform:uppercase;letter-spacing:1px;">Cảnh báo bạo lực!</h1>
                  <p style="font-size:18px;color:#333;margin-bottom:30px;line-height:1.5;">Hệ thống phát hiện dấu hiệu bạo lực rất nghiêm trọng từ âm thanh vừa tải lên.<br/><br/>
                  <span style="font-size:16px;">Tỉ lệ xảy ra đánh nhau:</span> <strong style="font-size:28px;color:var(--danger);">${maxConf.toFixed(0)}%</strong></p>
                  <div style="display:flex;gap:15px;justify-content:center;">
                    <button onclick="document.getElementById('critical-alert-overlay').remove()" style="padding:12px 24px;border-radius:8px;border:none;background:#e5e7eb;color:#374151;font-weight:600;font-size:15px;cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">Đóng</button>
                    <button onclick="document.getElementById('critical-alert-overlay').remove(); window.openDialogModal('${alertId}')" style="padding:12px 24px;border-radius:8px;border:none;background:var(--danger);color:white;font-weight:600;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(239,68,68,0.4);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Xem toàn bộ cuộc đối thoại</button>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(overlay);

            // Bật âm thanh còi báo động HTML5 Audio nếu không muốn dùng TTS (hoặc dùng cả 2)
            // User did not like TTS: "không phải là đọc lên như vậy cái tôi muốn là khi cảnh báo nó sẽ có gì đó thông báo lên"
            // So we will just use a beep or let the CSS pulse draw attention. Let's play the default playAlertSound
            if (typeof playAlertSound === 'function') {
                playAlertSound();
            }
          }
        }

        // Reload danh sách để hiện các cảnh báo mới
        await loadAlerts();
      } else {
        showToast('✅ Phân tích hoàn tất', 'Không phát hiện dấu hiệu bạo lực trong file âm thanh.', 'success');
      }

      """
    
    text = text.replace(old_block, new_block)
    
    with open("c:/website/web/frontend/canh-bao.js", "w", encoding="utf-8") as f:
        f.write(text)
    print("Successfully replaced block!")
else:
    print("Could not find start or end marker.")
