// canh-bao.js — Live Alerts page logic
(function() {
  const user = initPage('alerts');
  if (!user) return;

  window.loadAlerts = loadAlerts;
  window.clearFilters = clearFilters;
  window.handleAlert = handleAlert;
  window.uploadAudio = uploadAudio;

  loadAreaFilter();
  loadAlerts();

  async function loadAreaFilter() {
    try {
      const areas = await api('GET', '/api/areas');
      const select = document.getElementById('filter-area');
      areas.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.name;
        opt.textContent = a.name;
        select.appendChild(opt);
      });
    } catch {}
  }

  async function uploadAudio(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('ai-loading-overlay').style.display = 'flex';

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await fetch(`${API_BASE}/api/alerts/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const newAlert = await res.json();
      document.getElementById('ai-loading-overlay').style.display = 'none';
      showToast('Phân tích hoàn tất', 'AI đã phân tích xong file âm thanh', 'success');
      
      // newAlert will come via websocket anyway, but we can also just let it be.
      // Reset input
      event.target.value = '';
    } catch (err) {
      document.getElementById('ai-loading-overlay').style.display = 'none';
      showToast('Lỗi', 'Không thể phân tích âm thanh: ' + err.message, 'danger');
      event.target.value = '';
    }
  }

  // WebSocket: new alerts
  onWsEvent('new-alert', (alert) => {
    prependAlertCard(alert);
  });

  onWsEvent('alert-updated', (alert) => {
    const card = document.getElementById(`alert-${alert.id}`);
    if (card) {
      card.outerHTML = renderAlertCard(alert);
    }
  });

  async function loadAlerts() {
    const type = document.getElementById('filter-type').value;
    const status = document.getElementById('filter-status').value;
    const area = document.getElementById('filter-area').value;

    let url = '/api/alerts?limit=50';
    if (type) url += `&sound_type=${type}`;
    if (status) url += `&status=${status}`;
    if (area) url += `&area=${encodeURIComponent(area)}`;

    try {
      const result = await api('GET', url);
      const list = document.getElementById('alerts-list');
      const empty = document.getElementById('alerts-empty');

      if (result.data.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
      }

      empty.style.display = 'none';
      list.innerHTML = result.data.map(a => renderAlertCard(a)).join('');
    } catch (err) {
      showToast('Lỗi', 'Không thể tải cảnh báo: ' + err.message, 'danger');
    }
  }

  function clearFilters() {
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-area').value = '';
    loadAlerts();
  }

  function renderAlertCard(a) {
    const type = SOUND_TYPE_LABELS[a.sound_type] || { icon: '❓', label: a.sound_type, color: 'info' };
    const status = STATUS_LABELS[a.status] || { label: a.status, class: 'badge-muted' };
    const canHandle = a.status === 'pending';
    const audioHtml = a.audio_file_url
      ? `<audio controls preload="none" style="height:32px;"><source src="${a.audio_file_url}" type="audio/mpeg">Trình duyệt không hỗ trợ</audio>`
      : '';

    return `
      <div class="alert-card ${getSeverityClass(a.confidence_score)}" id="alert-${a.id}">
        <div class="alert-card-header">
          <span class="alert-card-type">
            ${type.icon} ${type.label}
            <span class="confidence-bar"><span class="confidence-bar-fill" style="width:${a.confidence_score}%;background:${getConfidenceColor(a.confidence_score)}"></span></span>
            <strong>${a.confidence_score.toFixed(0)}%</strong>
          </span>
          <span class="badge ${status.class}">${status.label}</span>
        </div>
        <div class="alert-card-meta">
          <span>📍 ${a.device?.area?.name || a.device?.area || '?'} — ${a.device?.name || ''}</span>
          <span>🕐 ${formatDateTime(a.timestamp)}</span>
          ${a.handled_by ? `<span>👤 ${a.handled_by.full_name}</span>` : ''}
        </div>
        <div class="alert-card-body" style="margin-top:10px;">
          <div>${audioHtml}</div>
          ${a.notes && a.notes.includes('🗣') ? `
            <div style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 8px 12px; border-radius: 6px; margin: 12px 0 8px 0; font-weight: 600; font-size: 13px; border-left: 3px solid var(--danger);">
              ${a.notes}
            </div>
          ` : ''}
          ${canHandle ? `
            <div class="alert-card-actions">
              <button class="btn btn-danger btn-sm" onclick="handleAlert('${a.id}','confirmed')">✅ Xác nhận sự cố</button>
              <button class="btn btn-outline btn-sm" onclick="handleAlert('${a.id}','false_alarm')">❌ Báo động giả</button>
              <button class="btn btn-warning btn-sm" onclick="handleAlert('${a.id}','resolved')">📤 Chuyển BGH</button>
            </div>
          ` : `
            ${a.notes && !a.notes.includes('🗣') ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">📝 ${a.notes}</div>` : ''}
          `}
        </div>
      </div>
    `;
  }

  async function handleAlert(id, status) {
    const notes = status === 'confirmed' ? 'Xác nhận có xảy ra sự cố' :
                  status === 'false_alarm' ? 'Đánh dấu là báo động giả' :
                  'Chuyển ban giám hiệu xử lý';
    try {
      await api('PATCH', `/api/alerts/${id}`, { status, notes });
      showToast('Thành công', 'Đã cập nhật trạng thái cảnh báo', 'success');
      loadAlerts();
    } catch (err) {
      showToast('Lỗi', 'Không thể cập nhật: ' + err.message, 'danger');
    }
  }

  function prependAlertCard(alert) {
    const list = document.getElementById('alerts-list');
    const empty = document.getElementById('alerts-empty');
    empty.style.display = 'none';

    const div = document.createElement('div');
    div.innerHTML = renderAlertCard(alert);
    const el = div.firstElementChild;
    el.classList.add('alert-new');
    list.prepend(el);
  }
})();
