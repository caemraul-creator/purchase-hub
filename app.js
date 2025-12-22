// ======================
// CONFIG
// ======================
const HIDDEN_COLUMNS = [
  'DoneBy',
  'DoneDate',
  'CreatedAt',
  'RejectedBy',
  'RejectedDate',
  'RejectedReason',
  'PartOf'
];

const NUMBER_COLUMNS = ['Qty'];
const CURRENCY_COLUMNS = ['Price', 'Nominal'];
const DATE_COLUMNS = ['LastBuyingDate', 'OrderDate'];
const DATETIME_COLUMNS = [
  'CreatedAt',
  'SubmissionDate',
  'ApprovedDate',
  'DoneDate'
];

// ======================
// STATE
// ======================
let allData = [];
let filteredData = [];
let headers = [];

let currentPage = 1;
let pageSize = 25;

let editMode = false;
let currentEditId = null;

// ======================
// LOAD DATA (JSONP)
// ======================
function loadData() {
  const old = document.getElementById('jsonp-main');
  if (old) old.remove();

  const s = document.createElement('script');
  s.id = 'jsonp-main';
  s.src = API_URL + '?callback=onDataLoaded';
  document.body.appendChild(s);
}

function onDataLoaded(data) {
  allData = data || [];
  filteredData = [...allData];

  headers = Object.keys(allData[0] || {})
    .filter(h => !HIDDEN_COLUMNS.includes(h));

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
// PAGINATION
// ======================
function getPagedData() {
  const start = (currentPage - 1) * pageSize;
  return filteredData.slice(start, start + pageSize);
}

function renderPagination() {
  const container = document.getElementById('pagination');
  const info = document.getElementById('infoText');
  if (!container || !info) return;

  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  container.innerHTML = '';

  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, total);

  info.textContent = `Menampilkan ${start}–${end} dari ${total} data`;

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
    container.appendChild(b);
  }
}

// ======================
// RENDER TABLE
// ======================
function renderTable() {
  const thead = document.querySelector('thead');
  const tbody = document.querySelector('tbody');
  if (!thead || !tbody) return;

  // Header: Aksi dipindah setelah ID
  const headerHtml = headers.map((h, i) => {
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

  tbody.innerHTML = pageData.map(row => {
    let cellsHtml = headers.map(h => {
      let v = row[h] ?? '';
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

      if (h === 'Items' || h === 'Description') {
        cls += ' truncate';
      }

      let cell = `<td class="${cls}" title="${v}">${v}</td>`;

      if (h === 'Status') {
        cell = `<td class="text-center">
          <span class="status ${String(v).toLowerCase()}">${v}</span>
        </td>`;
      }

      // Sisipkan kolom Aksi setelah ID
      if (h === 'ID') {
        cell += `<td class="text-center">
          <button class="btn-secondary" onclick="openEdit('${row.ID}')" title="Edit">
            ✏️
          </button>
        </td>`;
      }

      return cell;
    }).join('');

    return `<tr>${cellsHtml}</tr>`;
  }).join('');
}

// ======================
// OPEN EDIT
// ======================
function openEdit(id) {
  const row = allData.find(r => r.ID === id);
  if (!row) {
    alert('Data tidak ditemukan');
    return;
  }

  editMode = true;
  currentEditId = id;

  // Isi form
  document.getElementById('formID').value = row.ID;
  document.querySelector('[name="Department"]').value = row.Department || '';
  document.querySelector('[name="Office"]').value = row.Office || '';
  document.querySelector('[name="Items"]').value = row.Items || '';
  document.querySelector('[name="PartOf"]').value = row.PartOf || '';
  document.querySelector('[name="Description"]').value = row.Description || '';
  document.querySelector('[name="Qty"]').value = row.Qty || '';
  document.querySelector('[name="Unit"]').value = row.Unit || '';
  document.querySelector('[name="Price"]').value = row.Price || '';
  document.querySelector('[name="LastBuyingDate"]').value = row.LastBuyingDate || '';
  document.querySelector('[name="OrderDate"]').value = row.OrderDate || '';
  document.querySelector('[name="Priority"]').value = row.Priority || 'Medium';
  document.querySelector('[name="OrderBy"]').value = row.OrderBy || '';
  document.querySelector('[name="Requester"]').value = row.Requester || '';

  // Buka modal
  document.getElementById('modal').classList.add('show');
}

// ======================
// MODAL & FORM HANDLER
// ======================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('search')?.addEventListener('input', onSearch);

  // ---- handler ubah jumlah data per halaman ----
  document.getElementById('pageSize')?.addEventListener('change', (e) => {
    pageSize = Number(e.target.value);
    currentPage = 1;               // reset ke hal-1
    renderTable();
    renderPagination();
  });

  const modal = document.getElementById('modal');
  const btnAdd = document.getElementById('btnAdd');
  const btnClose = document.getElementById('btnClose');
  const btnCancel = document.getElementById('btnCancel');
  const form = document.getElementById('prForm');

  btnAdd.addEventListener('click', () => {
    editMode = false;
    currentEditId = null;
    form.reset();
    document.getElementById('formID').value = '';
    modal.classList.add('show');
  });

  btnClose.addEventListener('click', () => modal.classList.remove('show'));
  btnCancel.addEventListener('click', () => modal.classList.remove('show'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    if (editMode) {
      fd.append('ID', currentEditId);
    }

    try {
      const res = await fetch(API_URL, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Gagal menyimpan');
      showToast('Data berhasil disimpan');
      modal.classList.remove('show');
      loadData(); // reload
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
});

// ======================
// UTIL
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

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}