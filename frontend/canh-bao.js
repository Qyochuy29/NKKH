// canh-bao.js — Live Alerts page logic
(function() {
  const user = initPage('alerts');
  if (!user) return;

  window.loadAlerts = loadAlerts;
  window.clearFilters = clearFilters;
  window.uploadAudio = uploadAudio;

  let allAlerts = [];
  let currentPage = 1;
  const itemsPerPage = 10;

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

    const overlay = document.getElementById('ai-loading-overlay');
    overlay.style.display = 'flex';

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const res = await fetch(`${API_BASE}/api/alerts/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });

      overlay.style.display = 'none';

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      const count = data.totalAlerts ?? 0;

      if (count > 0) {
        showToast('🚨 Phân tích hoàn tất', `Tìm thấy ${count} cảnh báo trong file âm thanh!`, 'danger');
        // Reload danh sách để hiện các cảnh báo mới
        await loadAlerts();
      } else {
        showToast('✅ Phân tích hoàn tất', 'Không phát hiện dấu hiệu bạo lực trong file âm thanh.', 'success');
      }

      event.target.value = '';
    } catch (err) {
      overlay.style.display = 'none';
      showToast('❌ Lỗi phân tích', err.message, 'danger');
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

    let url = '/api/alerts?limit=1000';
    if (type) url += `&sound_type=${type}`;
    if (status) url += `&status=${status}`;
    if (area) url += `&area=${encodeURIComponent(area)}`;

    try {
      const result = await api('GET', url);
      allAlerts = result.data || [];
      currentPage = 1;
      renderAlerts();
    } catch (err) {
      showToast('Lỗi', 'Không thể tải cảnh báo: ' + err.message, 'danger');
    }
  }

  function renderAlerts() {
    const list = document.getElementById('alerts-list');
    const empty = document.getElementById('alerts-empty');

    if (allAlerts.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      document.getElementById('pagination-alerts').innerHTML = '';
      return;
    }

    empty.style.display = 'none';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedAlerts = allAlerts.slice(start, end);

    list.innerHTML = pagedAlerts.map(a => renderAlertCard(a)).join('');

    renderPagination(allAlerts.length, itemsPerPage, currentPage, 'pagination-alerts', (page) => {
      currentPage = page;
      renderAlerts();
    });
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
    const audioHtml = a.audio_file_url
      ? `<audio controls preload="none" style="height:32px;"><source src="${a.audio_file_url}">Trình duyệt không hỗ trợ</audio>`
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
          ${a.notes && !a.notes.includes('🗣') ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">📝 ${a.notes}</div>` : ''}
        </div>
      </div>
    `;
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
