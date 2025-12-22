// ======================
// CONFIG
// ======================
const DONE_HIDDEN_COLUMNS = [
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
  'SubmissionDate',
  'LastBuyingDate',
  'OrderDate'
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
  const old = document.getElementById('jsonp-done');
  if (old) old.remove();

  const s = document.createElement('script');
  s.id = 'jsonp-done';
  s.src = API_URL + '?callback=onDoneLoaded';
  document.body.appendChild(s);
}

function onDoneLoaded(data) {
  // hanya APPROVED
  allData = (data || []).filter(d => d.Status === 'approved');
  filteredData = [...allData];

  headers = Object.keys(allData[0] || {})
    .filter(h => !DONE_HIDDEN_COLUMNS.includes(h));

  currentPage = 1;
  renderTable();
  renderPagination();
}

// ======================
// SEARCH
// ======================
function onSearch(e) {
  const keyword = e.target.value.toLowerCase();
  currentPage = 1;

  filteredData = allData.filter(row =>
    headers.map(h => row[h]).join(' ')
      .toLowerCase()
      .includes(keyword)
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
    tbody.innerHTML = `
      <tr>
        <td colspan="${headers.length + 1}" class="text-center">
          Tidak ada data APPROVED
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = pageData.map(r => {
    let cellsHtml = headers.map(h => {
      let v = r[h] ?? '';
      let cls = '';

      if (DATE_COLUMNS.includes(h)) {
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
        cell = `
            <td class="text-center">
              <span class="status approved">approved</span>
            </td>`;
      }

      // Sisipkan kolom Aksi setelah ID
      if (h === 'ID') {
        cell += `<td class="text-center">
          <button class="btn-primary" onclick="markDone('${r.ID}')" title="Mark Done">
            🛍️
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
// MARK DONE (COMPLETED / PARTIAL)
// ======================
function markDone(id) {
  const choice = prompt(
    'Pilih:\n1 = Completed (semua dibeli)\n2 = Partial (sebagian dibeli)'
  );

  if (choice === '1') completeAll(id);
  else if (choice === '2') partialComplete(id);
}

// ======================
// COMPLETED
// ======================
async function completeAll(id) {
  const user = getCurrentUser();
  const doneBy = user.username || prompt('Masukkan nama yang menyelesaikan pembelian:');
  if (!doneBy) return;

  const fd = new FormData();
  fd.append('ID', id);
  fd.append('Status', 'done');
  fd.append('DoneBy', doneBy);

  await fetch(API_URL, { method: 'POST', body: fd });
  showToast('Request selesai (Completed)');
  loadData();
}

// ======================
// PARTIAL
// ======================
async function partialComplete(id) {
  const data = allData.find(d => d.ID === id);
  if (!data) return;

  const boughtQty = Number(
    prompt(`Qty dibeli (maks ${data.Qty}):`)
  );

  if (!boughtQty || boughtQty <= 0 || boughtQty >= data.Qty) {
    alert('Qty tidak valid');
    return;
  }

  const user = getCurrentUser();
  const doneBy = user.username || prompt('Masukkan nama yang menyelesaikan pembelian:');
  if (!doneBy) return;

  const fd = new FormData();
  fd.append('ID', id);
  fd.append('Status', 'partial');
  fd.append('BoughtQty', boughtQty);
  fd.append('RemainingQty', data.Qty - boughtQty);
  fd.append('DoneBy', doneBy);

  await fetch(API_URL, { method: 'POST', body: fd });
  showToast('Partial completed');
  loadData();
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

function formatNumber(v) {
  return v === '' ? '' : Number(v).toLocaleString('id-ID');
}

function formatRupiah(v) {
  return v === '' ? '' : 'Rp ' + Number(v).toLocaleString('id-ID');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ======================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('search')?.addEventListener('input', onSearch);
});
