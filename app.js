const API_URL = "https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec";

let currentNV = null;
let mates = [];
let familyMates = [];

const elSearch = document.getElementById("search");
const elResult = document.getElementById("result");
const elMoney = document.getElementById("money");
const elAdult = document.getElementById("adult");
const elChild = document.getElementById("child");

// --- TÌM KIẾM ---
elSearch.oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { elResult.innerHTML = ""; return; }
    try {
        const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        elResult.innerHTML = data.map(n => `<div class="item-search" onclick='selectMainNV(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
    } catch(e) { console.error("Lỗi tìm kiếm"); }
};

window.selectMainNV = function(n) {
    currentNV = n;
    elSearch.value = ""; elResult.innerHTML = "";
    document.getElementById("selected-nv").innerHTML = `<div class="selected-badge">✅ ${n.ten} (${n.ma}) - CĐ: ${n.congdoan}</div>`;
    calculatePrice();
};

// --- CHỌN BẠN / NGƯỜI THÂN ---
async function searchSub(idInput, idResult, callbackName) {
    const q = document.getElementById(idInput).value.trim();
    if (q.length < 2) { document.getElementById(idResult).innerHTML = ""; return; }
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    document.getElementById(idResult).innerHTML = data.map(n => `<div class="item-search" onclick='${callbackName}(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
}

document.getElementById("mateSearch").oninput = () => searchSub("mateSearch", "mateResult", "addMate");
document.getElementById("familyMateSearch").oninput = () => searchSub("familyMateSearch", "familyMateResult", "addFamilyMate");

window.addMate = function(n) {
    if (mates.length >= 2 || n.ma === currentNV?.ma) return;
    mates.push(n);
    document.getElementById("mateResult").innerHTML = "";
    document.getElementById("mateList").innerHTML = mates.map((m,i) => `<div class="family-badge">${m.ten} <span class="remove-btn" onclick="mates.splice(${i},1);addMate()">×</span></div>`).join("");
};

window.addFamilyMate = function(n) {
    if (familyMates.length >= 2 || n.ma === currentNV?.ma) return;
    familyMates.push(n);
    document.getElementById("familyMateResult").innerHTML = "";
    document.getElementById("selectedFamilyMate").innerHTML = familyMates.map((m,i) => `<div class="family-badge">${m.ten} <span class="remove-btn" onclick="familyMates.splice(${i},1);addFamilyMate()">×</span></div>`).join("");
    calculatePrice();
};

// --- CHẾ ĐỘ PHÒNG ---
document.querySelectorAll("input[name=roomType]").forEach(r => {
    r.onchange = () => {
        mates = []; familyMates = [];
        document.getElementById("mateList").innerHTML = "";
        document.getElementById("selectedFamilyMate").innerHTML = "";
        elAdult.value = 0; elChild.value = 0;
        document.getElementById("mateBox").style.display = r.value === "manual" ? "block" : "none";
        document.getElementById("familyFields").style.display = r.value === "family" ? "block" : "none";
        calculatePrice();
    };
});

function calculatePrice() {
    if (!currentNV) return;
    let total = (currentNV.congdoan === "Có") ? 1100000 : 2100000;
    familyMates.forEach(m => total += (m.congdoan === "Có" ? 1100000 : 2100000));
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

    const roomType = document.querySelector("input[name=roomType]:checked").value;
    
    const params = new URLSearchParams({
        action: "register",
        ma: currentNV.ma,
        ten: currentNV.ten,
        gioitinh: currentNV.gioitinh,
        congdoan: currentNV.congdoan,
        adult: elAdult.value,
        child: elChild.value,
        total: elMoney.dataset.value,
        roomType: roomType,
        mates: JSON.stringify(mates),
        familyMate: JSON.stringify(familyMates)
    });

    try {
        const res = await fetch(`${API_URL}?${params.toString()}`);
        const text = await res.text();
        if (text === "SUCCESS") showSuccessInfo();
        else if (text === "EXIST") alert("Nhân viên này đã đăng ký rồi!");
        else alert("Lỗi: " + text);
    } catch (e) {
        alert("Lỗi kết nối mạng!");
    } finally {
        btn.disabled = false; btn.innerText = "XÁC NHẬN ĐĂNG KÝ";
    }
};

function showSuccessInfo() {
    document.getElementById("main-content").innerHTML = `
        <div class="text-center">
            <h2 class="text-success fw-bold">✅ ĐĂNG KÝ XONG!</h2>
            <div class="text-start p-3 bg-light border rounded mt-3">
                <p><b>Họ tên:</b> ${currentNV.ten}</p>
                <p><b>Mã NV:</b> ${currentNV.ma}</p>
                <p><b>Tổng tiền:</b> <span class="text-danger">${elMoney.innerText}</span></p>
            </div>
            <button class="btn btn-primary w-100 mt-4" onclick="location.reload()">ĐĂNG KÝ MỚI</button>
        </div>`;
}
