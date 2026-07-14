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

  loadUsers();

  const roleLabels = {
    admin: 'Quản trị viên',
    ban_giam_hieu: 'Ban giám hiệu',
    giam_thi: 'Giám thị',
    bao_ve: 'Bảo vệ',
  };

  async function loadUsers() {
    try {
      const users = await api('GET', '/api/users');
      const tbody = document.getElementById('users-tbody');
      tbody.innerHTML = users.map(u => `
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
    } catch (err) {
      showToast('Lỗi', err.message, 'danger');
    }
  }

  function showAddUser() {
    document.getElementById('user-modal-title').textContent = 'Thêm người dùng mới';
    document.getElementById('user-id').value = '';
    document.getElementById('user-name').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-role').value = 'giam_thi';
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
