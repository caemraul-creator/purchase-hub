// auth.js - Authentication & Authorization System + Debug

// Role permissions mapping
const PERMISSIONS = {
  admin: ['dashboard.html', 'index.html', 'approval.html', 'done.html', 'rekap.html', 'rejected.html'],
  viewer: ['dashboard.html', 'index.html'],
  staff_a: ['dashboard.html', 'index.html', 'rekap.html', 'rejected.html'],
  staff_b: ['dashboard.html', 'index.html', 'approval.html', 'done.html', 'rekap.html'],
  staff_c: ['dashboard.html', 'index.html', 'approval.html', 'done.html', 'rekap.html', 'rejected.html']
};

// Role display names
const ROLE_NAMES = {
  admin: 'Administrator Utama',
  viewer: 'Viewer / Analyst',
  staff_a: 'Staff Tipe A',
  staff_b: 'Staff Tipe B',
  staff_c: 'Staff Tipe C'
};

// Helper to normalize role names (e.g., "Staff C" -> "staff_c")
function normalizeRole(role) {
  if (!role) return 'viewer';
  return role.toLowerCase().trim().replace(/ /g, '_');
}

// Check if user is logged in
function checkAuth() {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  if (isLoggedIn !== 'true') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Check if user has permission to access current page  (VERSI DEBUG)
function checkPermission() {
  if (!checkAuth()) return;

  const rawRole = sessionStorage.getItem('userRole');
  const userRole = normalizeRole(rawRole);

  const currentPage = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1) || 'dashboard.html';
  const allowedPages = PERMISSIONS[userRole] || [];

  const debug =
    `Debug Info
host     : ${location.host}
pathname : ${location.pathname}
page     : ${currentPage}
userRole : ${userRole}
allowed  : ${JSON.stringify(allowedPages)}`;

  if (!allowedPages.includes(currentPage)) {
    alert('❌ Anda tidak memiliki akses ke halaman ini!\n\n' + debug);
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

// Get current user info
function getCurrentUser() {
  const rawRole = sessionStorage.getItem('userRole');
  const normalizedRole = normalizeRole(rawRole);
  return {
    username: sessionStorage.getItem('username'),
    role: normalizedRole,
    roleName: ROLE_NAMES[normalizedRole] || (rawRole || 'Unknown')
  };
}

// Logout function
function logout() {
  const confirm = window.confirm('Apakah Anda yakin ingin logout?');
  if (confirm) {
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
}

// Get menu items based on user role
function getMenuItems(rawRole) {
  const role = normalizeRole(rawRole);
  const allMenus = [
    { page: 'index.html', icon: '📄', title: 'Request', desc: 'Buat & lihat permintaan barang', class: 'request' },
    { page: 'approval.html', icon: '✅', title: 'Approval', desc: 'Setujui atau tolak permintaan', class: 'approval' },
    { page: 'done.html', icon: '🛍️', title: 'Done', desc: 'Permintaan yang sudah selesai', class: 'done' },
    { page: 'rekap.html', icon: '📊', title: 'Rekapan', desc: 'Rekap data permintaan yang sudah DONE', class: 'rekap' },
    { page: 'rejected.html', icon: '❌', title: 'Rejected', desc: 'Permintaan yang ditolak', class: 'rejected' }
  ];
  const allowedPages = PERMISSIONS[role] || [];
  return allMenus.filter(menu => allowedPages.includes(menu.page));
}

// Add user info to page
function displayUserInfo() {
  const user = getCurrentUser();
  if (window.location.pathname.includes('dashboard.html')) return;

  const userInfoDiv = document.createElement('div');
  userInfoDiv.id = 'user-info-box';
  userInfoDiv.style.cssText = `
    position: fixed;
    bottom: 12px; right: 12px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); padding: 8px 12px; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 1000; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255,255,255,0.2);`;

  userInfoDiv.innerHTML = `
      <div style="text-align: right;">
        <div style="font-size: 0.6rem; color: #6b7280; text-transform: uppercase;">Logged in as</div>
        <div style="font-weight: 700; color: #1f2937; font-size: 0.8rem; line-height: 1;">${user.username}</div>
        <div style="font-size: 0.65rem; color: #4f46e5; font-weight: 500;">${user.roleName}</div>
      </div>
      <button onclick="logout()" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: all 0.2s ease;">
        Logout
      </button>
  `;
  document.body.appendChild(userInfoDiv);
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function () {
  if (window.location.pathname.includes('login.html')) return;
  if (checkPermission()) {
    displayUserInfo();
  }
});