// cai-dat.js — System settings page
(function() {
  const user = initPage('settings');
  if (!user) return;

  window.saveSettings = saveSettings;

  loadSettings();

  async function loadSettings() {
    try {
      const settings = await api('GET', '/api/settings');

      if (settings.min_confidence_threshold) {
        const slider = document.getElementById('confidence-slider');
        slider.value = settings.min_confidence_threshold;
        document.getElementById('confidence-val').textContent = settings.min_confidence_threshold + '%';
      }


      if (settings.audio_retention_days) {
        document.getElementById('retention-days').value = settings.audio_retention_days;
      }

      if (settings.simulator_enabled) {
        document.getElementById('simulator-enabled').checked = settings.simulator_enabled === 'true';
      }
    } catch (err) {
      showToast('Lỗi', 'Không thể tải cài đặt: ' + err.message, 'danger');
    }
  }

  async function saveSettings() {
    const settings = [
      { key: 'min_confidence_threshold', value: document.getElementById('confidence-slider').value },
      { key: 'audio_retention_days', value: document.getElementById('retention-days').value },
      { key: 'simulator_enabled', value: document.getElementById('simulator-enabled').checked ? 'true' : 'false' },
    ];

    try {
      await api('PUT', '/api/settings', { settings });
      showToast('Thành công', 'Đã lưu cài đặt hệ thống', 'success');
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    }
  }
})();
