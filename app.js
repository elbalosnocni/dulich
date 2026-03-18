const API_URL = "https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec";

const elSearch = document.getElementById("search");
const elResult = document.getElementById("result");
const elAdult = document.getElementById("adult");
const elChild = document.getElementById("child");
const elFamily = document.getElementById("family");
const elMoney = document.getElementById("money");

let currentNV = null;

// Tìm kiếm nhân viên
elSearch.oninput = async function() {
    const query = this.value.trim();
    if (query.length < 2) { elResult.innerHTML = ""; return; }

    try {
        const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.length === 0) {
            elResult.innerHTML = "<div style='padding:10px'>Không tìm thấy</div>";
            return;
        }
        let html = "";
        data.slice(0, 5).forEach(n => {
            html += `<div class="item-search" onclick='pickNV(${JSON.stringify(n)})'>
                ${n.ten} (${n.ma}) - ${n.bophan}
            </div>`;
        });
        elResult.innerHTML = html;
    } catch (e) { console.error("Lỗi:", e); }
};

// Chọn nhân viên
window.pickNV = function(n) {
    currentNV = n;
    elResult.innerHTML = `<div class="selected-box">
        <b>✅ Đã chọn: ${n.ten}</b><br>Mã: ${n.ma} | Công đoàn: ${n.congdoan} | BP: ${n.bophan} | VTri: ${n.chucvu}
    </div>`;
    calculatePrice();
};

// Tính tiền
function calculatePrice() {
    if (!currentNV) return;

    // Lấy giá trị từ các ô input
    let extraAdults = parseInt(elAdult.value) || 0;
    let children = parseInt(elChild.value) || 0;
    let otherFamily = parseInt(elFamily.value) || 0;

    // 1. Giá cho chính nhân viên (Suất gốc)
    let basePrice = (currentNV.congdoan === "Có") ? 1100000 : 2100000;

    // 2. Tổng tiền = Suất gốc + (Người lớn đi kèm * 3.1tr) + (Trẻ em * 1.55tr) + (Họ hàng * 3.1tr)
    // Lưu ý: Nếu "Người lớn đi kèm" và "Họ hàng" cùng mức giá 3.1tr, bạn có thể gộp lại.
    let total = basePrice 
                + (extraAdults * 3100000) 
                + (children * 1550000) 
                + (otherFamily * 3100000);

    // Hiển thị kết quả
    elMoney.innerText = total.toLocaleString('vi-VN');
    elMoney.dataset.value = total;
}

[elAdult, elChild, elFamily].forEach(input => input.oninput = calculatePrice);

// Gửi đăng ký
window.register = async function() {
    if (!currentNV) return alert("Vui lòng chọn nhân viên!");
    
    const btn = document.querySelector(".btn-submit");
    btn.innerText = "ĐANG GỬI...";
    btn.disabled = true;

    const params = new URLSearchParams({
        action: "register",
        ma: currentNV.ma,
        ten: currentNV.ten,
        gioitinh: currentNV.gioitinh,
        congdoan: currentNV.congdoan,
        adult: elAdult.value, 
        child: elChild.value,
        family: elFamily.value,
        total: elMoney.dataset.value
    });

    try {
        const res = await fetch(`${API_URL}?${params.toString()}`);
        const text = await res.text();
        if (text === "EXIST") alert("Nhân viên này đã đăng ký rồi!");
        else if (text === "CLOSED") alert("Hệ thống đã khóa ngày 27/03!");
        else { alert("Đăng ký thành công!"); location.reload(); }
    } catch (e) { alert("Lỗi kết nối!"); }
    finally { btn.innerText = "XÁC NHẬN ĐĂNG KÝ"; btn.disabled = false; }
};
