// dang-nhap.js — Login page logic
(function() {
  initTheme();

  // If already logged in, redirect
  const user = getCurrentUser();
  if (user) {
    window.location.href = './tong-quan.html';
    return;
  }

  const form = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');

  form.addEventListener('submit', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showError('Vui lòng nhập email và mật khẩu');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Đang đăng nhập...';
    errorDiv.classList.remove('show');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.message || 'Email hoặc mật khẩu không đúng');
        return;
      }

      setTokens(data.access_token, data.refresh_token);
      window.location.href = './tong-quan.html';
    } catch (err) {
      showError('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Đăng nhập';
    }
  });

  function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.add('show');
  }
})();
