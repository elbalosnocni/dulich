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
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    elResult.innerHTML = data.map(n => `<div class="item-search" onclick='selectMainNV(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
};

window.selectMainNV = function(n) {
    currentNV = n;
    elSearch.value = ""; elResult.innerHTML = "";
    document.getElementById("selected-nv").innerHTML = `<div class="selected-badge">✅ ${n.ten} (${n.ma}) - CĐ: ${n.congdoan}</div>`;
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

// --- CHỌN BẠN/NGƯỜI THÂN ---
document.getElementById("mateSearch").oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById("mateResult").innerHTML = ""; return; }
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    document.getElementById("mateResult").innerHTML = data.map(n => `<div class="item-search" onclick='addMate(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
};

window.addMate = function(n) {
    if (!currentNV) return alert("Chọn NV chính trước!");
    if (n.gioitinh !== currentNV.gioitinh) return alert("Phải cùng giới tính!");
    if (mates.length >= 2) return alert("Tối đa 2 bạn!");
    if (mates.some(m => m.ma === n.ma) || n.ma === currentNV.ma) return alert("NV này đã có!");
    mates.push(n);
    document.getElementById("mateResult").innerHTML = "";
    document.getElementById("mateList").innerHTML = mates.map((m,i) => `<div class="family-badge">${m.ten} <span onclick="mates.splice(${i},1);addMate()">×</span></div>`).join("");
};

// --- TÍNH TIỀN ---
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
        action: "register", ma: currentNV.ma, ten: currentNV.ten,
        adult: elAdult.value, child: elChild.value, total: elMoney.dataset.value,
        roomType: roomType, mates: JSON.stringify(mates), familyMate: JSON.stringify(familyMates)
    });

    try {
        const res = await fetch(`${API_URL}?${params.toString()}`);
        const text = await res.text();
        if (text === "SUCCESS") showSuccessInfo(roomType);
        else alert("Lỗi: " + text);
    } catch (e) {
        alert("Lỗi kết nối!");
    } finally {
        btn.disabled = false; btn.innerText = "XÁC NHẬN ĐĂNG KÝ";
    }
};

function showSuccessInfo(roomType) {
    const content = document.getElementById("main-content");
    const money = elMoney.innerText;
    let rText = roomType === "auto" ? "Ghép tự động" : (roomType === "manual" ? "Chọn bạn" : "Gia đình");

    content.innerHTML = `
        <div class="text-center" style="animation: fadeIn 0.6s ease-in-out;">
            <h2 class="text-success fw-bold">✅ THÀNH CÔNG!</h2>
            <p>Vui lòng chụp màn hình biên lai này</p>
            <div class="text-start p-3 bg-light border rounded" style="border-style:dashed!important; border-color:#28a745!important;">
                <p><b>NV chính:</b> ${currentNV.ten} (${currentNV.ma})</p>
                <p><b>Hình thức:</b> ${rText}</p>
                ${mates.length > 0 ? `<p><b>Bạn cùng phòng:</b> ${mates.map(m=>m.ten).join(", ")}</p>` : ""}
                <hr>
                <h4 class="text-danger text-center">TỔNG: ${money}</h4>
            </div>
            <button class="btn btn-secondary w-100 mt-4" onclick="location.reload()">ĐĂNG KÝ MỚI</button>
        </div>
    `;
}
