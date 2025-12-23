// auth.js - Authentication & Authorization System
// Role diambil persis dari spreadsheet: viewer, staff_a, staff_b, staff_c, admin

const PERMISSIONS = {
  admin: ['dashboard.html', 'index.html', 'approval.html', 'done.html', 'rekap.html', 'rejected.html'],
  viewer: ['dashboard.html', 'index.html'],
  staff_a: ['dashboard.html', 'index.html', 'rekap.html', 'rejected.html'],
  staff_b: ['dashboard.html', 'index.html', 'approval.html', 'done.html', 'rekap.html'],
  staff_c: ['dashboard.html', 'index.html', 'approval.html', 'done.html', 'rekap.html', 'rejected.html']
};

const ROLE_NAMES = {
  admin: 'Administrator Utama',
  viewer: 'Viewer / Analyst',
  staff_a: 'Staff Tipe A',
  staff_b: 'Staff Tipe B',
  staff_c: 'Staff Tipe C'
};

// Normalisasi nama role (spasi -> underscore, lowercase)
function normalizeRole(role) {
  if (!role) return 'viewer';
  return role.toLowerCase().trim().replace(/ /g, '_');
}

// Cek sudah login?
function checkAuth() {
  if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Cek hak akses halaman
function checkPermission() {
  if (!checkAuth()) return;

  const userRole = normalizeRole(sessionStorage.getItem('userRole'));
  const currentPage = location.pathname.substring(location.pathname.lastIndexOf('/') + 1) || 'dashboard.html';
  const allowed = PERMISSIONS[userRole] || [];

  if (!allowed.includes(currentPage)) {
    alert('❌ Anda tidak memiliki akses ke halaman ini!\n\nAnda akan diarahkan ke Dashboard.');
    location.href = 'dashboard.html';
    return false;
  }
  return true;
}

// Data user saat ini
function getCurrentUser() {
  const nr = normalizeRole(sessionStorage.getItem('userRole'));
  return {
    username: sessionStorage.getItem('username'),
    role: nr,
    roleName: ROLE_NAMES[nr] || 'Unknown'
  };
}

// Logout
function logout() {
  if (confirm('Apakah Anda yakin ingin logout?')) {
    sessionStorage.clear();
    location.href = 'login.html';
  }
}

// Menu yang boleh ditampilkan di dashboard
function getMenuItems(rawRole) {
  const role = normalizeRole(rawRole);
  const all = [
    { page: 'index.html', icon: '📄', title: 'Request', desc: 'Buat & lihat permintaan barang', class: 'request' },
    { page: 'approval.html', icon: '✅', title: 'Approval', desc: 'Setujui atau tolak permintaan', class: 'approval' },
    { page: 'done.html', icon: '🛍️', title: 'Done', desc: 'Permintaan yang sudah selesai', class: 'done' },
    { page: 'rekap.html', icon: '📊', title: 'Rekapan', desc: 'Rekap data permintaan yang sudah DONE', class: 'rekap' },
    { page: 'rejected.html', icon: '❌', title: 'Rejected', desc: 'Permintaan yang ditolak', class: 'rejected' }
  ];
  const allowed = PERMISSIONS[role] || [];
  return all.filter(m => allowed.includes(m.page));
}

// Tampilkan info user (di pojok kanan bawah)
function displayUserInfo() {
  if (location.pathname.includes('dashboard.html')) return; // dashboard punya sendiri
  const u = getCurrentUser();
  const box = document.createElement('div');
  box.id = 'user-info-box';
  box.style.cssText = `
    position:fixed; bottom:12px; right:12px; background:rgba(255,255,255,.9);
    backdrop-filter:blur(8px); padding:8px 12px; border-radius:10px;
    box-shadow:0 4px 16px rgba(0,0,0,.1); z-index:1000; display:flex;
    align-items:center; gap:10px; border:1px solid rgba(255,255,255,.2);`;
  box.innerHTML = `
    <div style="text-align:right;">
      <div style="font-size:.6rem; color:#6b7280; text-transform:uppercase;">Logged in as</div>
      <div style="font-weight:700; color:#1f2937; font-size:.8rem;">${u.username}</div>
      <div style="font-size:.65rem; color:#4f46e5; font-weight:500;">${u.roleName}</div>
    </div>
    <button onclick="logout()" style="background:#ef4444; color:white; border:none;
     padding:6px 10px; border-radius:6px; cursor:pointer; font-size:.75rem; font-weight:600;">Logout</button>`;
  document.body.appendChild(box);
}

// Jalankan otomatis saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
  if (location.pathname.includes('login.html')) return;
  if (checkPermission()) displayUserInfo();
});