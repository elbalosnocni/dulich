const API_URL = "URL_CỦA_BẠN_Ở_ĐÂY";

let currentNV = null;
let mates = [];
let familyMates = []; // Mảng chứa tối đa 2 người thân cùng CT

const elSearch = document.getElementById("search");
const elResult = document.getElementById("result");
const elMoney = document.getElementById("money");
const elAdult = document.getElementById("adult");
const elChild = document.getElementById("child");

// Tìm kiếm NV chính
elSearch.oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) return;
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    elResult.innerHTML = data.map(n => `<div class="item-search" onclick='selectMainNV(${JSON.stringify(n)})'>${n.ten} (${n.ma}) - ${n.bophan}</div>`).join("");
};

window.selectMainNV = function(n) {
    currentNV = n;
    elSearch.value = n.ten;
    elResult.innerHTML = "";
    document.getElementById("selected-nv").innerHTML = `<div class="badge bg-primary p-2">Đã chọn: ${n.ten} (${n.ma})</div>`;
    calculatePrice();
};

// Chuyển đổi chế độ phòng
document.querySelectorAll("input[name=roomType]").forEach(r => {
    r.onchange = () => {
        document.getElementById("mateBox").style.display = (r.value === "manual") ? "block" : "none";
        document.getElementById("familyFields").style.display = (r.value === "family") ? "block" : "none";
        if (r.value !== "family") { familyMates = []; elAdult.value = 0; elChild.value = 0; }
        calculatePrice();
    };
});

// Tìm người thân cùng CT
document.getElementById("familyMateSearch").oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) return;
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    document.getElementById("familyMateResult").innerHTML = data.map(n => `<div class="item-family-mate" onclick='addFamilyMate(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
};

window.addFamilyMate = function(n) {
    if (familyMates.length >= 2) return alert("Tối đa 2 người thân cùng công ty!");
    if (currentNV && n.ma === currentNV.ma) return alert("Không thể chọn chính mình!");
    if (familyMates.some(m => m.ma === n.ma)) return alert("Đã chọn người này!");
    
    familyMates.push(n);
    renderFamilyMates();
    calculatePrice();
};

function renderFamilyMates() {
    document.getElementById("selectedFamilyMate").innerHTML = familyMates.map((m, i) => 
        `<div class="badge bg-success m-1 p-2">${m.ten} <span style="cursor:pointer" onclick="familyMates.splice(${i},1);renderFamilyMates();calculatePrice();">×</span></div>`
    ).join("");
    document.getElementById("familyMateResult").innerHTML = "";
}

// Tính tiền tự động
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

// Gửi đăng ký
window.register = async function() {
    if (!currentNV) return alert("Vui lòng chọn nhân viên!");
    const btn = document.querySelector(".btn-submit");
    btn.disabled = true;
    btn.innerText = "ĐANG GỬI...";

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
        if (result === "SUCCESS") { alert("Đăng ký thành công!"); location.reload(); }
        else alert("Lỗi: " + result);
    } catch (e) { alert("Lỗi kết nối server!"); }
    btn.disabled = false;
};
