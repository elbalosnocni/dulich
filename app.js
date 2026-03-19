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
// --- 2. TÌM ĐỒNG NGHIỆP Ở CHUNG (CHẾ ĐỘ MANUAL) ---
document.getElementById("mateSearch").oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById("mateResult").innerHTML = ""; return; }
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    document.getElementById("mateResult").innerHTML = data.map(n => `<div class="item-search" onclick='addMate(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
};

window.addMate = function(n) {
    if (mates.length >= 2) return alert("Phòng 3 người, bạn chỉ được chọn thêm 2 đồng nghiệp!");
    if (currentNV && n.ma === currentNV.ma) return alert("Không thể chọn chính mình!");
    if (mates.some(m => m.ma === n.ma)) return alert("Đồng nghiệp này đã được chọn!");
    
    mates.push(n);
    document.getElementById("mateSearch").value = "";
    document.getElementById("mateResult").innerHTML = "";
    renderMates();
};

function renderMates() {
    document.getElementById("mateList").innerHTML = mates.map((m, i) => 
        `<div class="family-badge">👤 ${m.ten} <span class="remove-btn" onclick="mates.splice(${i},1);renderMates();">×</span></div>`
    ).join("");
}

// --- TÌM NGƯỜI THÂN CÙNG CÔNG TY (CHẾ ĐỘ FAMILY) ---
document.getElementById("familyMateSearch").oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById("familyMateResult").innerHTML = ""; return; }
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    document.getElementById("familyMateResult").innerHTML = data.map(n => `<div class="item-family-mate" onclick='addFamilyMate(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
};

window.addFamilyMate = function(n) {
    // Chặn không cho chọn thêm đồng nghiệp nếu đã lỡ nhập Adult/Child trước đó
    const adultExt = parseInt(document.getElementById("adult").value) || 0;
    const childExt = parseInt(document.getElementById("child").value) || 0;
    if (familyMates.length >= 2) return alert("Tối đa chọn thêm 2 người thân cùng công ty!");
    if (currentNV && n.ma === currentNV.ma) return alert("Không thể chọn chính mình!");
    if (familyMates.some(m => m.ma === n.ma)) return alert("Người này đã được chọn!");
    if (1 + familyMates.length + adultExt + childExt >= 3) {
        alert("Phòng gia đình tối đa chỉ được 3 người (bao gồm cả trẻ em)!");
        return;
    }

    if (familyMates.some(m => m.ma === n.ma)) return alert("Đã chọn người này!");
    
    familyMates.push(n);
    document.getElementById("familyMateSearch").value = ""; // Xóa text ô tìm kiếm
    document.getElementById("familyMateResult").innerHTML = ""; // XÓA DANH SÁCH GỢI Ý
    renderFamilyMates();
    checkLimit(); // Khóa các ô nhập khác nếu cần
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
    checkLimit(); // Khóa các ô nhập khác nếu cần
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
function checkLimit() {
    const adultInput = document.getElementById("adult");
    const childInput = document.getElementById("child");
    
    // Tổng số nhân viên hiện tại = 1 (chính) + số lượng familyMates
    const currentStaffCount = 1 + familyMates.length;
    if (currentStaffCount >= 3) {
        // Nếu đã đủ 3 nhân viên, khóa các ô nhập người ngoài và trẻ em
        adultInput.value = 0;
        childInput.value = 0;
        adultInput.disabled = true;
        childInput.disabled = true;
        adultInput.placeholder = "Đã đủ 3 người (Tối đa)";
        childInput.placeholder = "Đã đủ 3 người (Tối đa)";
    } else {
        // Nếu chưa đủ 3 người, cho phép nhập bình thường
        adultInput.disabled = false;
        childInput.disabled = false;
        adultInput.placeholder = "";
        childInput.placeholder = "";
    }
}

// Gọi hàm checkLimit() này bên trong các hàm sau:
// 1. Bên trong window.addFamilyMate sau khi push vào mảng.
// 2. Bên trong window.removeFamilyMate sau khi splice mảng.
// 3. Bên trong sự kiện r.onchange khi chọn chế độ phòng.

//khi người dùng nhập số vào Adult/Child thì cũng phải kiểm tra xem có vượt quá tổng 3 người không
[elAdult, elChild].forEach(el => {
    el.oninput = function() {
        const adultVal = parseInt(document.getElementById("adult").value) || 0;
        const childVal = parseInt(document.getElementById("child").value) || 0;
        const staffCount = 1 + familyMates.length;

        if (staffCount + adultVal + childVal > 3) {
            alert("Tổng số người trong phòng không được quá 3!");
            this.value = 0; // Reset về 0 nếu nhập quá
        }
        calculatePrice();
    };
});

// --- ĐĂNG KÝ ---
window.register = async function() {
    if (!currentNV) return alert("Vui lòng chọn nhân viên chính!");

    // Kiểm tra nếu chọn manual mà chưa có bạn
    if (roomType === "manual" && mates.length === 0) {
    if (!confirm("Bạn chọn tự chọn người ở cùng nhưng chưa chọn ai. Hệ thống sẽ để trống phòng, bạn có muốn tiếp tục?")) return;
    }

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
        const text = await res.text();

        if (text === "EXIST") alert("Lỗi: Mã nhân viên này đã đăng ký trước đó!");
        else if (text === "CLOSED") alert("Hệ thống đã khóa đăng ký (hết hạn 27/03)!");
        else {
            alert("Chúc mừng! Bạn đã đăng ký thành công.");
            location.reload();
        }
    } catch (e) {
        alert("Lỗi kết nối server. Vui lòng thử lại!");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};
