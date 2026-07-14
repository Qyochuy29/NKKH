// thiet-bi.js — Device management page
(function() {
  const user = initPage('devices');
  if (!user) return;

  window.showAddModal = showAddModal;
  window.editDevice = editDevice;
  window.closeDeviceModal = closeDeviceModal;
  window.saveDevice = saveDevice;

  loadDevices();

  // SVG click to pick position
  document.getElementById('position-svg').addEventListener('click', (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    document.getElementById('device-x').value = x.toFixed(1);
    document.getElementById('device-y').value = y.toFixed(1);
    const dot = document.getElementById('position-dot');
    dot.setAttribute('cx', (x / 100) * 400);
    dot.setAttribute('cy', (y / 100) * 250);
    dot.style.display = 'block';
  });

  async function loadDevices() {
    try {
      const devices = await api('GET', '/api/devices');
      const tbody = document.getElementById('devices-tbody');
      tbody.innerHTML = devices.map(d => {
        const statusBadge = d.status === 'online' ? 'badge-online' :
                           d.status === 'error' ? 'badge-error' : 'badge-offline';
        const statusLabel = d.status === 'online' ? 'Hoạt động' :
                           d.status === 'error' ? 'Lỗi' : 'Ngoại tuyến';
        const batteryColor = d.battery_level > 50 ? 'var(--success)' :
                            d.battery_level > 20 ? 'var(--warning)' : 'var(--danger)';
        return `
          <tr>
            <td><strong>${d.name}</strong></td>
            <td>${d.area}</td>
            <td>Tầng ${d.floor}</td>
            <td><span class="badge ${statusBadge}">${statusLabel}</span></td>
            <td>
              <span style="color:${batteryColor};font-weight:600;">${d.battery_level}%</span>
              <span class="confidence-bar" style="width:50px;"><span class="confidence-bar-fill" style="width:${d.battery_level}%;background:${batteryColor}"></span></span>
            </td>
            <td>${formatRelative(d.last_seen)}</td>
            <td><button class="btn btn-outline btn-sm" onclick='editDevice(${JSON.stringify(d).replace(/'/g, "\\'")})'>✏️ Sửa</button></td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    }
  }

  function showAddModal() {
    document.getElementById('modal-title').textContent = 'Thêm thiết bị mới';
    document.getElementById('device-id').value = '';
    document.getElementById('device-name').value = '';
    document.getElementById('device-area').value = '';
    document.getElementById('device-floor').value = '1';
    document.getElementById('device-x').value = '';
    document.getElementById('device-y').value = '';
    document.getElementById('position-dot').style.display = 'none';
    document.getElementById('device-modal').classList.add('active');
  }

  function editDevice(d) {
    document.getElementById('modal-title').textContent = 'Sửa thiết bị';
    document.getElementById('device-id').value = d.id;
    document.getElementById('device-name').value = d.name;
    document.getElementById('device-area').value = d.area;
    document.getElementById('device-floor').value = d.floor;
    document.getElementById('device-x').value = d.position_x.toFixed(1);
    document.getElementById('device-y').value = d.position_y.toFixed(1);
    const dot = document.getElementById('position-dot');
    dot.setAttribute('cx', (d.position_x / 100) * 400);
    dot.setAttribute('cy', (d.position_y / 100) * 250);
    dot.style.display = 'block';
    document.getElementById('device-modal').classList.add('active');
  }

  function closeDeviceModal() {
    document.getElementById('device-modal').classList.remove('active');
  }

  async function saveDevice() {
    const id = document.getElementById('device-id').value;
    const data = {
      name: document.getElementById('device-name').value.trim(),
      area: document.getElementById('device-area').value.trim(),
      floor: parseInt(document.getElementById('device-floor').value),
      position_x: parseFloat(document.getElementById('device-x').value) || 50,
      position_y: parseFloat(document.getElementById('device-y').value) || 50,
    };

    if (!data.name || !data.area) {
      showToast('Lỗi', 'Vui lòng nhập tên và khu vực', 'danger');
      return;
    }

    try {
      if (id) {
        await api('PUT', `/api/devices/${id}`, data);
        showToast('Thành công', 'Đã cập nhật thiết bị', 'success');
      } else {
        await api('POST', '/api/devices', data);
        showToast('Thành công', 'Đã thêm thiết bị mới', 'success');
      }
      closeDeviceModal();
      loadDevices();
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    }
  }

  // Close modal on overlay click
  document.getElementById('device-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeDeviceModal();
  });
})();
