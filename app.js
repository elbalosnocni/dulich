const API_URL = "https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec";

let currentNV = null;
let familyMates = [];

const elSearch = document.getElementById("search");
const elResult = document.getElementById("result");
const elAdult = document.getElementById("adult");
const elChild = document.getElementById("child");
const elMoney = document.getElementById("money");

const elFamilyMateSearch = document.getElementById("familyMateSearch");
const elFamilyMateResult = document.getElementById("familyMateResult");
const elSelectedFamilyMate = document.getElementById("selectedFamilyMate");

// --- SEARCH NV ---
elSearch.oninput = async function () {
  const q = this.value.trim();
  if (q.length < 2) return elResult.innerHTML = "";

  const res = await fetch(`${API_URL}?action=search&q=${q}`);
  const data = await res.json();

  elResult.innerHTML = data.map(n => `
    <div onclick='selectNV(${JSON.stringify(n)})'>
      ${n.ten} (${n.ma})
    </div>
  `).join("");
};

window.selectNV = function (n) {
  currentNV = n;
  elResult.innerHTML = `✅ ${n.ten}`;
  calculatePrice();
};

// --- SEARCH FAMILY ---
elFamilyMateSearch.oninput = async function () {
  const q = this.value.trim();
  if (q.length < 2) return;

  const res = await fetch(`${API_URL}?action=search&q=${q}`);
  const data = await res.json();

  elFamilyMateResult.innerHTML = data.map(n => `
    <div onclick='addFamily(${JSON.stringify(n)})'>
      ${n.ten} (${n.ma})
    </div>
  `).join("");
};

window.addFamily = function (n) {
  if (!currentNV) return alert("Chọn NV trước");
  if (familyMates.length >= 2) return alert("Tối đa 2 người");

  if (n.ma === currentNV.ma || familyMates.some(m => m.ma === n.ma)) {
    return alert("Trùng");
  }

  familyMates.push(n);
  renderFamily();
  calculatePrice();
};

function renderFamily() {
  elSelectedFamilyMate.innerHTML = familyMates.map((m, i) => `
    <div>
      ${m.ten} ❌
      <span onclick="removeFamily(${i})">X</span>
    </div>
  `).join("");
}

window.removeFamily = function (i) {
  familyMates.splice(i, 1);
  renderFamily();
  calculatePrice();
};

// --- PRICE ---
function calculatePrice() {
  if (!currentNV) return;

  let total = (currentNV.congdoan === "Có") ? 1100000 : 2100000;

  familyMates.forEach(m => {
    total += (m.congdoan === "Có") ? 1100000 : 2100000;
  });

  total += (Number(elAdult.value) || 0) * 3100000;
  total += (Number(elChild.value) || 0) * 1550000;

  elMoney.innerText = total.toLocaleString() + " đ";
  elMoney.dataset.value = total;
}

[elAdult, elChild].forEach(i => i.oninput = calculatePrice);

// --- REGISTER ---
window.register = async function () {
  if (!currentNV) return alert("Chọn NV");

  const params = new URLSearchParams({
    action: "register",
    ma: currentNV.ma,
    ten: currentNV.ten,
    gioitinh: currentNV.gioitinh,
    congdoan: currentNV.congdoan,
    adult: elAdult.value,
    child: elChild.value,
    total: elMoney.dataset.value,
    familyMate: JSON.stringify(familyMates)
  });

  const res = await fetch(`${API_URL}?${params}`);
  const text = await res.text();

  alert(text);
};
