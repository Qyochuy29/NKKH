// nguoi-dung.js — User management page (admin only)
(function() {
  const user = initPage('users');
  if (!user) return;

  // Check admin role
  if (user.role !== 'admin') {
    document.querySelector('.main-content').innerHTML = `
      <div class="empty-state" style="margin-top:80px;">
        <div class="empty-icon">🔒</div>
        <h3>Không có quyền truy cập</h3>
        <p>Chỉ quản trị viên mới có thể quản lý người dùng</p>
        <a href="/tong-quan.html" class="btn btn-primary" style="margin-top:16px;">Về trang chủ</a>
      </div>
    `;
    return;
  }

  window.showAddUser = showAddUser;
  window.editUser = editUser;
  window.closeUserModal = closeUserModal;
  window.saveUser = saveUser;
  window.deleteUser = deleteUser;

  let allUsers = [];
  let allAreas = [];
  let currentPage = 1;
  const itemsPerPage = 10;

  loadUsers();
  loadAreas();

  // Role change event to toggle classroom select
  document.getElementById('user-role').addEventListener('change', (e) => {
    const cg = document.getElementById('classroom-group');
    if (e.target.value === 'phu_huynh') {
      cg.style.display = 'block';
    } else {
      cg.style.display = 'none';
      document.getElementById('user-classroom').value = '';
    }
  });

  const roleLabels = {
    admin: 'Quản trị viên',
    ban_giam_hieu: 'Ban giám hiệu',
    giam_thi: 'Giám thị',
    bao_ve: 'Bảo vệ',
    phu_huynh: 'Phụ huynh'
  };

  async function loadAreas() {
    try {
      allAreas = await api('GET', '/api/areas');
      const select = document.getElementById('user-classroom');
      select.innerHTML = '<option value="">-- Chọn lớp học --</option>' + 
        allAreas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    } catch(err) {
      console.error('Failed to load areas', err);
    }
  }

  async function loadUsers() {
    try {
      allUsers = await api('GET', '/api/users');
      renderUsers();
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    }
  }

  function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedUsers = allUsers.slice(start, end);

    tbody.innerHTML = pagedUsers.map(u => `
      <tr>
        <td><strong>${u.full_name}</strong></td>
        <td>${u.email}</td>
        <td><span class="badge badge-info">${roleLabels[u.role] || u.role}</span></td>
        <td>${formatDate(u.created_at)}</td>
        <td style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-sm" onclick='editUser(${JSON.stringify(u).replace(/'/g, "\\'")})'>✏️ Sửa</button>
          <button class="btn btn-outline btn-sm" style="color:var(--danger);border-color:var(--danger)" onclick="deleteUser('${u.id}', '${u.full_name}')">🗑️ Xóa</button>
        </td>
      </tr>
    `).join('');

    renderPagination(allUsers.length, itemsPerPage, currentPage, 'pagination-users', (page) => {
      currentPage = page;
      renderUsers();
    });
  }

  function showAddUser() {
    document.getElementById('user-modal-title').textContent = 'Thêm người dùng mới';
    document.getElementById('user-id').value = '';
    document.getElementById('user-name').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = 'giam_thi';
    document.getElementById('classroom-group').style.display = 'none';
    document.getElementById('user-classroom').value = '';
    document.getElementById('pw-hint').style.display = 'none';
    document.getElementById('user-modal').classList.add('active');
  }

  function editUser(u) {
    document.getElementById('user-modal-title').textContent = 'Sửa thông tin';
    document.getElementById('user-id').value = u.id;
    document.getElementById('user-name').value = u.full_name;
    document.getElementById('user-email').value = u.email;
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = u.role;
    
    if (u.role === 'phu_huynh') {
      document.getElementById('classroom-group').style.display = 'block';
      document.getElementById('user-classroom').value = u.classroom_id || '';
    } else {
      document.getElementById('classroom-group').style.display = 'none';
      document.getElementById('user-classroom').value = '';
    }

    document.getElementById('pw-hint').style.display = 'inline';
    document.getElementById('user-modal').classList.add('active');
  }

  function closeUserModal() {
    document.getElementById('user-modal').classList.remove('active');
  }

  async function saveUser() {
    const id = document.getElementById('user-id').value;
    const data = {
      full_name: document.getElementById('user-name').value.trim(),
      email: document.getElementById('user-email').value.trim(),
      role: document.getElementById('user-role').value,
      classroom_id: document.getElementById('user-classroom').value || null
    };

    const pw = document.getElementById('user-password').value;
    if (pw) data.password = pw;

    if (!data.full_name || !data.email) {
      showToast('Lỗi', 'Vui lòng nhập đầy đủ thông tin', 'danger');
      return;
    }

    if (!id && !pw) {
      showToast('Lỗi', 'Vui lòng nhập mật khẩu cho người dùng mới', 'danger');
      return;
    }

    try {
      if (id) {
        await api('PUT', `/api/users/${id}`, data);
        showToast('Thành công', 'Đã cập nhật người dùng', 'success');
      } else {
        await api('POST', '/api/users', data);
        showToast('Thành công', 'Đã thêm người dùng mới', 'success');
      }
      closeUserModal();
      loadUsers();
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    }
  }

  document.getElementById('user-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeUserModal();
  });

  async function deleteUser(id, name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api('DELETE', `/api/users/${id}`);
      showToast('Thành công', 'Đã xóa người dùng', 'success');
      loadUsers();
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    }
  }
})();
