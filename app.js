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
    document.getElementById("selected-nv").innerHTML = `<div class="selected-badge">✅ ${n.ten} (${n.ma}) - ${n.chucvu} ${n.bophan} - Công đoàn: ${n.congdoan}</div>`;
    calculatePrice();
};

// --- CHẾ ĐỘ PHÒNG ---
    const roomRadios = document.querySelectorAll("input[name=roomType]");

roomRadios.forEach(r => {
    r.onchange = () => {
        // Reset dữ liệu mảng
        mates = [];
        familyMates = [];

        // Reset hiển thị giao diện
        document.getElementById("mateList").innerHTML = "";
        document.getElementById("selectedFamilyMate").innerHTML = "";
        elAdult.value = 0;
        elChild.value = 0;

        // --- ĐIỀU KHIỂN ẨN HIỆN CÁC KHUNG TÌM KIẾM ---
        const mateBox = document.getElementById("mateBox");
        const familyFields = document.getElementById("familyFields");

        if (r.value === "manual") {
            mateBox.style.display = "block";
            familyFields.style.display = "none";
        } else if (r.value === "family") {
            mateBox.style.display = "none";
            familyFields.style.display = "block";
        } else {
            mateBox.style.display = "none";
            familyFields.style.display = "none";
        }

        checkLimit();
        calculatePrice();
    };
});

// --- . TÌM ĐỒNG NGHIỆP Ở CHUNG (CHẾ ĐỘ MANUAL) ---
document.getElementById("mateSearch").oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById("mateResult").innerHTML = ""; return; }
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    
    // Hiện danh sách tìm kiếm đồng nghiệp
    document.getElementById("mateResult").innerHTML = data.map(n => `<div class="item-search" onclick='addMate(${JSON.stringify(n)})'>${n.ten} (${n.ma})</div>`).join("");
};

window.addMate = function(n) {
    if (!currentNV) return alert("Vui lòng chọn nhân viên chính trước!");
    
    // --- KHỐI CHẶN GIỚI TÍNH ---
    if (n.gioitinh !== currentNV.gioitinh) {
        return alert(`Lỗi: Không thể chọn người khác giới tính! \n(Bạn là ${currentNV.gioitinh}, đồng nghiệp là ${n.gioitinh})`);
    }
    // ---------------------------
    
    if (mates.length >= 2) return alert("Phòng 3 người, bạn chỉ được chọn thêm 2 đồng nghiệp!");
    if (currentNV && n.ma === currentNV.ma) return alert("Không thể chọn chính mình!");
    if (mates.some(m => m.ma === n.ma)) return alert("Đồng nghiệp này đã được chọn!");
    
    mates.push(n);
    document.getElementById("mateSearch").value = "";
    document.getElementById("mateResult").innerHTML = "";
    renderMates();
};
//
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
    const roomType = document.querySelector("input[name=roomType]:checked").value;
    if (roomType === "manual" && mates.length === 0) {
    if (!confirm("Bạn chưa chọn bạn ở cùng, vẫn tiếp tục?")) return;
    }

    const btn = document.querySelector(".btn-submit");
    const originalText = btn.innerText;
    btn.disabled = true; btn.innerText = "ĐANG GỬI...";

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
        familyMate: JSON.stringify(familyMates),
        mates: JSON.stringify(mates)
    });

   try {
        const res = await fetch(`${API_URL}?${params.toString()}`);
        const text = await res.text();

        if (text === "EXIST") alert("Lỗi: Nhân viên đã đăng ký trước đó!");
        else if (text === "CLOSED") alert("Hệ thống đã khóa đăng ký (hết hạn 27/03)!");
        else if (text === "SUCCESS") {
            // --- THAY ĐỔI Ở ĐÂY ---
            showSuccessInfo(roomType);
        }
    } catch (e) {
        alert("Lỗi kết nối server!");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// Hàm hiển thị thông tin sau khi đăng ký thành công
function showSuccessInfo(roomType) {
    // Ẩn form đăng ký
    document.querySelector(".card.p-4").style.display = "none";
    
    // Hiển thị card thành công
    const successCard = document.getElementById("successCard");
    const summary = document.getElementById("summaryContent");
    successCard.style.display = "block";

    let roomText = roomType === "auto" ? "Ghép tự động" : (roomType === "manual" ? "Chọn người ở cùng" : "Ở với gia đình");
    
    let detailHTML = `
        <p><b>Mã nhân viên:</b> ${currentNV.ma}</p>
        <p><b>Họ tên:</b> ${currentNV.ten}</p>
        <p><b>Giới tính:</b> ${currentNV.gioitinh}</p>
        <p><b>Hình thức phòng:</b> ${roomText}</p>
    `;

    if (roomType === "manual" && mates.length > 0) {
        detailHTML += `<p><b>Bạn ở cùng:</b> ${mates.map(m => m.ten).join(", ")}</p>`;
    }

    if (roomType === "family") {
        if (familyMates.length > 0) detailHTML += `<p><b>Người thân (Cùng CT):</b> ${familyMates.map(m => m.ten).join(", ")}</p>`;
        if (elAdult.value > 0) detailHTML += `<p><b>Người lớn (Ngoài CT):</b> ${elAdult.value}</p>`;
        if (elChild.value > 0) detailHTML += `<p><b>Trẻ em:</b> ${elChild.value}</p>`;
    }

    detailHTML += `
        <hr>
        <h4 class="text-danger text-center">TỔNG TIỀN: ${elMoney.innerText}</h4>
        <p class="small text-center mt-2 italic">* Thời gian đăng ký: ${new Date().toLocaleString('vi-VN')}</p>
    `;

    summary.innerHTML = detailHTML;
}
