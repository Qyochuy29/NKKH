// khu-vuc.js — Area management page
(function () {
  const user = initPage('areas');
  if (!user) return;

  window.showAddAreaModal = showAddAreaModal;
  window.closeAreaModal = closeAreaModal;
  window.editArea = editArea;
  window.saveArea = saveArea;
  window.deleteArea = deleteArea;
  window.closeDeleteModal = closeDeleteModal;
  window.confirmDelete = confirmDelete;

  // Only admin can add/edit/delete
  if (user.role !== 'admin') {
    const btn = document.getElementById('btn-add-area');
    if (btn) btn.style.display = 'none';
  }

  let pendingDeleteId = null;

  let allAreas = [];
  let currentPage = 1;
  const itemsPerPage = 10;

  loadAreas();

  async function loadAreas() {
    try {
      allAreas = await api('GET', '/api/areas');
      renderAreas();
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    }
  }

  function renderAreas() {
    const tbody = document.getElementById('areas-tbody');
    if (allAreas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">Chưa có khu vực nào</td></tr>`;
      return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedAreas = allAreas.slice(start, end);

    tbody.innerHTML = pagedAreas.map((a, idx) => `
      <tr>
        <td style="color:var(--text-muted);font-size:13px;">${start + idx + 1}</td>
        <td><strong>${escapeHTML(a.name)}</strong></td>
        <td style="color:var(--text-secondary);font-size:13px;">${escapeHTML(a.description || '') || '<em style="color:var(--text-muted)">—</em>'}</td>
        <td>
          <span class="badge ${a.device_count > 0 ? 'badge-online' : 'badge-muted'}">
            <i class="bi bi-mic"></i> ${a.device_count} thiết bị
          </span>
        </td>
        <td style="font-size:13px;color:var(--text-muted);">${formatDate(a.created_at)}</td>
        <td style="display:flex;gap:6px;justify-content:flex-end;">
          ${user.role === 'admin' ? `
            <button class="btn btn-outline btn-sm" onclick='editArea(${JSON.stringify(a).replace(/'/g, "\\'")})'><i class="bi bi-pencil"></i> Sửa</button>
            <button class="btn btn-sm" style="background:var(--danger);color:#fff;" onclick="deleteArea('${a.id}','${a.name.replace(/'/g, "\\'")}',${a.device_count})"><i class="bi bi-trash"></i> Xoá</button>
          ` : ''}
        </td>
      </tr>
    `).join('');

    renderPagination(allAreas.length, itemsPerPage, currentPage, 'pagination-areas', (page) => {
      currentPage = page;
      renderAreas();
    });
  }

  function showAddAreaModal() {
    document.getElementById('area-modal-title').textContent = 'Thêm khu vực mới';
    document.getElementById('area-id').value = '';
    document.getElementById('area-name').value = '';
    document.getElementById('area-description').value = '';
    document.getElementById('area-modal').classList.add('active');
    setTimeout(() => document.getElementById('area-name').focus(), 100);
  }

  function editArea(a) {
    document.getElementById('area-modal-title').textContent = 'Sửa khu vực';
    document.getElementById('area-id').value = a.id;
    document.getElementById('area-name').value = a.name;
    document.getElementById('area-description').value = a.description || '';
    document.getElementById('area-modal').classList.add('active');
    setTimeout(() => document.getElementById('area-name').focus(), 100);
  }

  function closeAreaModal() {
    document.getElementById('area-modal').classList.remove('active');
  }

  async function saveArea() {
    const id = document.getElementById('area-id').value;
    const name = document.getElementById('area-name').value.trim();
    const description = document.getElementById('area-description').value.trim();

    if (!name) {
      showToast('Lỗi', 'Vui lòng nhập tên khu vực', 'danger');
      return;
    }

    const saveBtn = document.getElementById('area-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';

    try {
      const data = { name, description: description || undefined };
      if (id) {
        await api('PUT', `/api/areas/${id}`, data);
        showToast('Thành công', 'Đã cập nhật khu vực', 'success');
      } else {
        await api('POST', '/api/areas', data);
        showToast('Thành công', 'Đã thêm khu vực mới', 'success');
      }
      closeAreaModal();
      loadAreas();
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Lưu';
    }
  }

  function deleteArea(id, name, deviceCount) {
    pendingDeleteId = id;
    const msg = deviceCount > 0
      ? `Khu vực <strong>"${escapeHTML(name)}"</strong> hiện có <strong>${deviceCount} thiết bị</strong> đang sử dụng.<br><br>Bạn cần gỡ hoặc chuyển thiết bị sang khu vực khác trước khi xoá.`
      : `Bạn có chắc muốn xoá khu vực <strong>"${escapeHTML(name)}"</strong>?<br><br>Hành động này không thể hoàn tác.`;
    document.getElementById('area-delete-msg').innerHTML = msg;
    const confirmBtn = document.getElementById('area-delete-confirm-btn');
    confirmBtn.disabled = deviceCount > 0;
    confirmBtn.style.opacity = deviceCount > 0 ? '0.5' : '1';
    document.getElementById('area-delete-modal').classList.add('active');
  }

  function closeDeleteModal() {
    document.getElementById('area-delete-modal').classList.remove('active');
    pendingDeleteId = null;
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const btn = document.getElementById('area-delete-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Đang xoá...';
    try {
      await api('DELETE', `/api/areas/${pendingDeleteId}`);
      showToast('Thành công', 'Đã xoá khu vực', 'success');
      closeDeleteModal();
      loadAreas();
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.textContent = '🗑️ Xoá';
    }
  }

  // Close modals on overlay click
  document.getElementById('area-modal').addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeAreaModal();
  });
  document.getElementById('area-delete-modal').addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeDeleteModal();
  });

  // Enter key in form
  document.getElementById('area-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveArea();
  });
  document.getElementById('area-description').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveArea();
  });
})();
