// ======================
// CONFIG
// ======================
const APPROVAL_HIDDEN_COLUMNS = [
  'CreatedAt',
  'ApprovedBy',
  'ApprovedDate',
  'DoneBy',
  'DoneDate',
  'RejectedBy',
  'RejectedDate',
  'RejectedReason'
];

const NUMBER_COLUMNS = ['Qty'];
const CURRENCY_COLUMNS = ['Price', 'Nominal'];

const DATE_COLUMNS = [
  'LastBuyingDate',
  'OrderDate'
];

const DATETIME_COLUMNS = [
  'SubmissionDate',
  'ApprovedDate',
  'CreatedAt'
];

// ======================
// STATE
// ======================
let allData = [];
let filteredData = [];
let headers = [];

let currentPage = 1;
let pageSize = 15;

// ======================
// LOAD DATA (JSONP)
// ======================
function loadData() {
  const old = document.getElementById('jsonp-approval');
  if (old) old.remove();

  const s = document.createElement('script');
  s.id = 'jsonp-approval';
  s.src = API_URL + '?callback=onDataLoadedApproval';
  document.body.appendChild(s);
}

function onDataLoadedApproval(data) {
  allData = (data || []).filter(d => d.Status === 'pending');
  filteredData = [...allData];

  headers = Object.keys(allData[0] || {})
    .filter(h => !APPROVAL_HIDDEN_COLUMNS.includes(h));

  currentPage = 1;
  renderTable();
  renderPagination();
}

// ======================
// RENDER TABLE
// ======================
function renderTable() {
  const thead = document.querySelector('thead');
  const tbody = document.querySelector('tbody');
  if (!thead || !tbody) return;

  // Header: Aksi dipindah setelah ID
  const headerHtml = headers.map(h => {
    let html = `<th>${h}</th>`;
    if (h === 'ID') {
      html += '<th>Aksi</th>';
    }
    return html;
  }).join('');

  thead.innerHTML = `<tr>${headerHtml}</tr>`;

  const pageData = getPagedData();

  if (!pageData.length) {
    tbody.innerHTML =
      `<tr><td colspan="${headers.length + 1}" class="text-center">
        Data tidak ditemukan
      </td></tr>`;
    return;
  }

  tbody.innerHTML = pageData.map(r => {
    let cellsHtml = headers.map(h => {
      let v = r[h] ?? '';
      let cls = '';

      if (DATETIME_COLUMNS.includes(h)) {
        v = formatDateTime(v);
        cls = 'text-center';
      } else if (DATE_COLUMNS.includes(h)) {
        v = formatDate(v);
        cls = 'text-center';
      }

      if (NUMBER_COLUMNS.includes(h)) {
        v = formatNumber(v);
        cls = 'text-right';
      }

      if (CURRENCY_COLUMNS.includes(h)) {
        v = formatRupiah(v);
        cls = 'text-right';
      }

      let cell = `<td class="${cls}">${v}</td>`;

      if (h === 'Status') {
        cell = `<td class="text-center">
          <span class="status pending">pending</span>
        </td>`;
      }

      // Sisipkan kolom Aksi setelah ID
      if (h === 'ID') {
        cell += `<td class="text-center" style="white-space:nowrap;">
          <button class="btn-primary" onclick="approve('${r.ID}')" title="Approve">
            ✅
          </button>
          <button class="btn-secondary" onclick="reject('${r.ID}')" title="Reject">
            ❌
          </button>
        </td>`;
      }

      return cell;
    }).join('');

    return `<tr>${cellsHtml}</tr>`;
  }).join('');
}

// ======================
// PAGINATION
// ======================
function getPagedData() {
  const start = (currentPage - 1) * pageSize;
  return filteredData.slice(start, start + pageSize);
}

function renderPagination() {
  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const p = document.getElementById('pagination');
  const info = document.getElementById('infoText');
  if (!p || !info) return;

  p.innerHTML = '';
  info.textContent =
    `Menampilkan ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)} dari ${total}`;

  for (let i = 1; i <= totalPages; i++) {
    const b = document.createElement('button');
    b.textContent = i;
    b.className = 'pagination-btn';
    if (i === currentPage) b.classList.add('active');
    b.onclick = () => {
      currentPage = i;
      renderTable();
      renderPagination();
    };
    p.appendChild(b);
  }
}

// ======================
// APPROVE
// ======================
async function approve(id) {
  const user = getCurrentUser();
  const name = user.username || prompt('Masukkan nama approver:');
  if (!name) return;

  const fd = new FormData();
  fd.append('ID', id);
  fd.append('Status', 'approved');
  fd.append('ApprovedBy', name);

  await submit(fd);
}

// ======================
// REJECT
// ======================
async function reject(id) {
  const user = getCurrentUser();
  const rejectedBy = user.username || prompt('Masukkan nama penolak:');
  if (!rejectedBy) return;

  const reason = prompt('Masukkan alasan reject:');
  if (!reason) return;

  const fd = new FormData();
  fd.append('ID', id);
  fd.append('Status', 'rejected');
  fd.append('RejectedBy', rejectedBy);       // ✅ FIX
  fd.append('RejectedReason', reason);

  await submit(fd);
}

// ======================
// SUBMIT HELPER
// ======================
async function submit(fd) {
  try {
    await fetch(API_URL, { method: 'POST', body: fd });
    showToast('Status berhasil diperbarui');
    loadData();
  } catch {
    alert('Gagal update status');
  }
}

// ======================
// FORMAT HELPERS
// ======================
function formatDate(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return v;

  return `${String(d.getDate()).padStart(2, '0')}/` +
    `${String(d.getMonth() + 1).padStart(2, '0')}/` +
    d.getFullYear();
}

function formatDateTime(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return v;

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');

  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

function formatNumber(v) {
  return v === '' ? '' : Number(v).toLocaleString('id-ID');
}

function formatRupiah(v) {
  return v === '' ? '' : 'Rp ' + Number(v).toLocaleString('id-ID');
}

// ======================
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ======================
document.addEventListener('DOMContentLoaded', loadData);
