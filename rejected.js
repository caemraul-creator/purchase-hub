// ======================
// CONFIG
// ======================
const REJECTED_HIDDEN_COLUMNS = [
  'DoneBy',
  'DoneDate',
  'Price',
  'Nominal',
  'LastBuyingDate',
  'Aksi',
  'CreatedAt',
  'ApprovedBy',
  'ApprovedDate'
];

const NUMBER_COLUMNS = ['Qty'];
const CURRENCY_COLUMNS = ['Price', 'Nominal'];
const DATE_COLUMNS = ['LastBuyingDate', 'OrderDate'];
const DATETIME_COLUMNS = [
  'CreatedAt',
  'SubmissionDate',
  'ApprovedDate',
  'DoneDate',
  'RejectedDate'
];

// ======================
// STATE
// ======================
let allData = [];
let filteredData = [];
let headers = [];

let currentPage = 1;
let pageSize = 20;

// ======================
// LOAD DATA (JSONP)
// ======================
function loadData() {
  const old = document.getElementById('jsonp-rejected');
  if (old) old.remove();

  const s = document.createElement('script');
  s.id = 'jsonp-rejected';
  // Add timestamp to prevent caching
  const timestamp = new Date().getTime();
  s.src = API_URL + '?sheet=rejected&callback=onRejectedLoaded&t=' + timestamp;
  document.body.appendChild(s);
}

function onRejectedLoaded(data) {
  // Use data from 'rejected' sheet directly
  allData = data || [];
  filteredData = [...allData];

  if (allData.length > 0) {
    // Preserve spreadsheet column order
    headers = Object.keys(allData[0])
      .filter(h => !REJECTED_HIDDEN_COLUMNS.includes(h));
  } else {
    headers = [];
  }

  currentPage = 1;
  renderTable();
  renderPagination();
}

// ======================
// SEARCH
// ======================
function onSearch(e) {
  const q = e.target.value.toLowerCase();
  currentPage = 1;

  filteredData = allData.filter(r =>
    headers.map(h => r[h]).join(' ').toLowerCase().includes(q)
  );

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

  // Header
  const headerHtml = headers.map(h => `<th>${h}</th>`).join('');
  thead.innerHTML = `<tr>${headerHtml}</tr>`;

  const pageData = getPagedData();

  if (!pageData.length) {
    tbody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center">Data tidak ditemukan</td></tr>`;
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
        v = Number(v).toLocaleString('id-ID');
        cls = 'text-right';
      }

      if (CURRENCY_COLUMNS.includes(h)) {
        v = 'Rp ' + Number(v).toLocaleString('id-ID');
        cls = 'text-right';
      }

      if (h === 'Items' || h === 'Description' || h === 'RejectedReason') {
        cls += ' truncate';
      }

      let cell = `<td class="${cls}" title="${v}">${v}</td>`;

      if (h === 'Status') {
        cell = `<td class="text-center"><span class="status rejected">rejected</span></td>`;
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
// FORMAT HELPERS
// ======================
function formatDate(v) {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d)) return v;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
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

// ======================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('search')?.addEventListener('input', onSearch);
});
