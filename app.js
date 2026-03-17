const API = "https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec";

const searchInput = document.getElementById("search");
const resultDiv = document.getElementById("result");
const adultInput = document.getElementById("adult");
const childInput = document.getElementById("child");
const familyInput = document.getElementById("family");
const moneyDisplay = document.getElementById("money");

let nv = null;

// 1. Tìm kiếm nhân viên
searchInput.oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { resultDiv.innerHTML = ""; return; }

    const res = await fetch(API + "?action=search&q=" + encodeURIComponent(q));
    const data = await res.json();

    if (data.length == 0) {
        resultDiv.innerHTML = "<div>Không tìm thấy</div>";
        return;
    }

    let html = "";
    data.slice(0, 5).forEach(n => {
        html += `<div class="item" onclick='pick(${JSON.stringify(n)})' style="cursor:pointer; padding:10px; border-bottom:1px solid #eee;">
            ${n.ten} (${n.ma}) - ${n.bophan}
        </div>`;
    });
    resultDiv.innerHTML = html;
};

// 2. Chọn nhân viên
function pick(n) {
    nv = n;
    resultDiv.innerHTML = `<div style="background:#e3f2fd; padding:10px; border-radius:5px;">
        <b>Đã chọn: ${n.ten}</b><br>Mã: ${n.ma} - CD: ${n.congdoan}
    </div>`;
    calc();
}

// 3. Tính tiền tự động
function calc() {
    if (!nv) return;
    let a = +adultInput.value || 0;
    let c = +childInput.value || 0;
    let f = +familyInput.value || 0;

    let price = (nv.congdoan === "Có") ? 1100000 : 2100000; // Giá cho bản thân NV
    // Nếu có thêm người lớn đi kèm (adult > 1)
    if (a > 1) {
        price += (a - 1) * 3100000;
    }
    price += c * 1550000;
    price += f * 3100000;

    moneyDisplay.innerText = price.toLocaleString();
    moneyDisplay.dataset.value = price;
}

// Cập nhật giá khi thay đổi số lượng
[adultInput, childInput, familyInput].forEach(el => el.oninput = calc);

// 4. Gửi đăng ký
async function register() {
    if (!nv) { alert("Vui lòng chọn nhân viên trước!"); return; }
    
    const url = API + "?action=register" +
        "&ma=" + encodeURIComponent(nv.ma) +
        "&ten=" + encodeURIComponent(nv.ten) +
        "&gioitinh=" + encodeURIComponent(nv.gioitinh) +
        "&congdoan=" + encodeURIComponent(nv.congdoan) +
        "&adult=" + adultInput.value +
        "&child=" + childInput.value +
        "&family=" + familyInput.value +
        "&total=" + moneyDisplay.dataset.value;

    const res = await fetch(url);
    const text = await res.text();

    if (text == "EXIST") alert("Lỗi: Nhân viên này đã đăng ký rồi!");
    else if (text == "CLOSED") alert("Hệ thống đã khóa (quá hạn 27/03)!");
    else {
        alert("Chúc mừng! Đăng ký thành công.");
        location.reload();
    }
}
