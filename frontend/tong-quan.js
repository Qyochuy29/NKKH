// tong-quan.js — Dashboard page logic
(function() {
  const user = initPage('dashboard');
  if (!user) return;

  loadKPIs();
  loadDevicesMap(1);
  loadAlertFeed();
  loadHourlyChart();

  // Floor tabs
  document.getElementById('floor-tabs').addEventListener('click', (e) => {
    if (e.target.classList.contains('floor-tab')) {
      document.querySelectorAll('.floor-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      loadDevicesMap(parseInt(e.target.dataset.floor));
    }
  });

  // WebSocket: live alert feed
  onWsEvent('new-alert', (alert) => {
    prependAlertToFeed(alert);
    loadKPIs(); // Refresh KPIs
  });

  async function loadKPIs() {
    try {
      const data = await api('GET', '/api/statistics/summary');
      document.getElementById('kpi-devices').textContent = data.devices_online;
      document.getElementById('kpi-devices-sub').textContent = `/ ${data.total_devices} tổng`;
      document.getElementById('kpi-alerts').textContent = data.alerts_today;
      document.getElementById('kpi-urgent').textContent = data.pending_urgent;
      document.getElementById('kpi-response').textContent = data.avg_response_minutes + ' phút';
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    }
  }

  async function loadDevicesMap(floor) {
    try {
      const devices = await api('GET', '/api/devices');
      const floorDevices = devices.filter(d => d.floor === floor);
      renderMap(floorDevices, floor);
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  }

  function renderMap(devices, floor) {
    const svg = document.getElementById('map-svg');
    // Draw school building outline
    let html = `
      <rect x="20" y="20" width="760" height="460" rx="8" fill="var(--bg-hover)" stroke="var(--border)" stroke-width="2"/>
      <text x="400" y="50" text-anchor="middle" fill="var(--text-muted)" font-size="14" font-weight="600">Tầng ${floor} — Trường THPT Mẫu</text>
      <!-- Rooms outline -->
      <rect x="40" y="70" width="200" height="120" rx="4" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="4"/>
      <text x="140" y="135" text-anchor="middle" fill="var(--text-muted)" font-size="10">Dãy phòng học A</text>
      <rect x="260" y="70" width="200" height="120" rx="4" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="4"/>
      <text x="360" y="135" text-anchor="middle" fill="var(--text-muted)" font-size="10">Hành lang</text>
      <rect x="480" y="70" width="280" height="120" rx="4" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="4"/>
      <text x="620" y="135" text-anchor="middle" fill="var(--text-muted)" font-size="10">Dãy phòng học B</text>
      <rect x="40" y="220" width="340" height="120" rx="4" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="4"/>
      <text x="210" y="285" text-anchor="middle" fill="var(--text-muted)" font-size="10">${floor === 1 ? 'Sân trường / Canteen' : 'Khu vực chung'}</text>
      <rect x="400" y="220" width="360" height="120" rx="4" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="4"/>
      <text x="580" y="285" text-anchor="middle" fill="var(--text-muted)" font-size="10">${floor === 1 ? 'Nhà xe / Cổng' : 'Phòng chức năng'}</text>
      <rect x="40" y="370" width="720" height="90" rx="4" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="4"/>
      <text x="400" y="420" text-anchor="middle" fill="var(--text-muted)" font-size="10">${floor === 1 ? 'Khu vực cổng trường' : 'Cầu thang / Nhà vệ sinh'}</text>
    `;

    // Draw device dots
    devices.forEach(d => {
      const x = 20 + (d.position_x / 100) * 760;
      const y = 20 + (d.position_y / 100) * 460;
      const color = d.status === 'online' ? 'var(--success)' :
                    d.status === 'error' ? 'var(--danger)' : 'var(--text-muted)';
      const pulse = d.status === 'error' ? `<animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite"/>` : '';

      html += `
        <circle cx="${x}" cy="${y}" r="6" fill="${color}" class="device-dot" opacity="0.9">
          ${pulse}
          <title>${d.name} — ${d.area} (${d.status}) Pin: ${d.battery_level}%</title>
        </circle>
      `;
    });

    svg.innerHTML = html;
  }

  async function loadAlertFeed() {
    try {
      const result = await api('GET', '/api/alerts?limit=10');
      const feed = document.getElementById('alert-feed');
      if (result.data.length === 0) {
        feed.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><h3>Không có cảnh báo</h3><p>Hệ thống đang hoạt động bình thường</p></div>';
        return;
      }
      feed.innerHTML = result.data.map(a => renderAlertItem(a)).join('');
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }

  function renderAlertItem(a) {
    const type = SOUND_TYPE_LABELS[a.sound_type] || { icon: '❓', label: a.sound_type, color: 'info' };
    const status = STATUS_LABELS[a.status] || { label: a.status, class: 'badge-muted' };
    return `
      <div class="alert-card ${getSeverityClass(a.confidence_score)}" style="padding:12px 16px;margin-bottom:8px;">
        <div class="alert-card-header" style="margin-bottom:4px;">
          <span class="alert-card-type">${type.icon} ${type.label}</span>
          <span class="badge ${status.class}">${status.label}</span>
        </div>
        <div class="alert-card-meta">
          <span>📍 ${a.device?.area || '?'}</span>
          <span>🎯 ${a.confidence_score.toFixed(0)}%</span>
          <span>🕐 ${formatRelative(a.timestamp)}</span>
        </div>
      </div>
    `;
  }

  function prependAlertToFeed(alert) {
    const feed = document.getElementById('alert-feed');
    const empty = feed.querySelector('.empty-state');
    if (empty) empty.remove();

    const div = document.createElement('div');
    div.innerHTML = renderAlertItem(alert);
    const el = div.firstElementChild;
    el.classList.add('alert-new');
    feed.prepend(el);

    // Keep max 10
    while (feed.children.length > 10) {
      feed.lastElementChild.remove();
    }
  }

  let hourlyChart = null;
  async function loadHourlyChart() {
    try {
      const data = await api('GET', '/api/statistics/hourly-today');
      const ctx = document.getElementById('hourly-chart').getContext('2d');

      if (hourlyChart) hourlyChart.destroy();
      hourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => `${d.hour}:00`),
          datasets: [{
            label: 'Số cảnh báo',
            data: data.map(d => d.count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#3b82f6',
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          }
        }
      });
    } catch (err) {
      console.error('Failed to load hourly chart:', err);
    }
  }
})();
