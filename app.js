const API_URL = "https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec"; // Thay link vào đây

let currentNV = null;
let mates = [];
let familyMates = [];

const elSearch = document.getElementById("search");
const elResult = document.getElementById("result");
const elMoney = document.getElementById("money");
const elAdult = document.getElementById("adult");
const elChild = document.getElementById("child");

// --- TÌM KIẾM NHÂN VIÊN CHÍNH ---
elSearch.oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { elResult.innerHTML = ""; return; }
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    elResult.innerHTML = data.map(n => `<div class="item-search" onclick='selectMainNV(${JSON.stringify(n)})'>${n.ten} (${n.ma}) - ${n.bophan}</div>`).join("");
};

window.selectMainNV = function(n) {
    currentNV = n;
    elSearch.value = ""; // Xóa text ô tìm kiếm
    elResult.innerHTML = ""; // XÓA DANH SÁCH GỢI Ý
    document.getElementById("selected-nv").innerHTML = `<div class="selected-badge">✅ ${n.ten} (${n.ma})</div>`;
    calculatePrice();
};

// --- CHẾ ĐỘ PHÒNG ---
document.querySelectorAll("input[name=roomType]").forEach(r => {
    r.onchange = () => {
        document.getElementById("mateBox").style.display = (r.value === "manual") ? "block" : "none";
        document.getElementById("familyFields").style.display = (r.value === "family") ? "block" : "none";
        if (r.value !== "family") { familyMates = []; elAdult.value = 0; elChild.value = 0; }
        calculatePrice();
    };
});

// --- TÌM NGƯỜI THÂN CÙNG CÔNG TY ---
document.getElementById("familyMateSearch").oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById("familyMateResult").innerHTML = ""; return; }
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    document.getElementById("familyMateResult").innerHTML = data.map(n => `<div class="item-family-mate" onclick='addFamilyMate(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
};

window.addFamilyMate = function(n) {
    if (familyMates.length >= 2) return alert("Tối đa chọn thêm 2 người thân cùng công ty!");
    if (currentNV && n.ma === currentNV.ma) return alert("Không thể chọn chính mình!");
    if (familyMates.some(m => m.ma === n.ma)) return alert("Người này đã được chọn!");
    
    familyMates.push(n);
    document.getElementById("familyMateSearch").value = ""; // Xóa text ô tìm kiếm
    document.getElementById("familyMateResult").innerHTML = ""; // XÓA DANH SÁCH GỢI Ý
    renderFamilyMates();
    calculatePrice();
};

function renderFamilyMates() {
    document.getElementById("selectedFamilyMate").innerHTML = familyMates.map((m, i) => 
        `<div class="family-badge">👤 ${m.ten} <span class="remove-btn" onclick="removeFamilyMate(${i})">×</span></div>`
    ).join("");
}

window.removeFamilyMate = function(i) {
    familyMates.splice(i, 1);
    renderFamilyMates();
    calculatePrice();
};

// --- TÍNH TIỀN ---
function calculatePrice() {
    if (!currentNV) return;
    let total = (currentNV.congdoan === "Có") ? 1100000 : 2100000;
    familyMates.forEach(m => {
        total += (m.congdoan === "Có") ? 1100000 : 2100000;
    });
    total += (parseInt(elAdult.value) || 0) * 3100000;
    total += (parseInt(elChild.value) || 0) * 1550000;
    elMoney.innerText = total.toLocaleString('vi-VN') + " đ";
    elMoney.dataset.value = total;
}

[elAdult, elChild].forEach(el => el.oninput = calculatePrice);

// --- ĐĂNG KÝ ---
window.register = async function() {
    if (!currentNV) return alert("Vui lòng chọn nhân viên chính!");
    const btn = document.querySelector(".btn-submit");
    btn.disabled = true; btn.innerText = "ĐANG GỬI...";

    const params = new URLSearchParams({
        action: "register",
        ma: currentNV.ma, ten: currentNV.ten, gioitinh: currentNV.gioitinh, congdoan: currentNV.congdoan,
        adult: elAdult.value, child: elChild.value, total: elMoney.dataset.value,
        roomType: document.querySelector("input[name=roomType]:checked").value,
        familyMate: JSON.stringify(familyMates),
        mates: JSON.stringify(mates)
    });

    try {
        const res = await fetch(`${API_URL}?${params.toString()}`);
        const result = await res.text();
        if (result === "SUCCESS") { alert("Chúc mừng! Bạn đã đăng ký thành công."); location.reload(); }
        else alert("Lỗi: " + result);
    } catch (e) { alert("Lỗi kết nối server!"); }
    btn.disabled = false; btn.innerText = "XÁC NHẬN ĐĂNG KÝ";
};
