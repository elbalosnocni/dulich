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

        // Render kết quả an toàn bằng cách dùng encodeURIComponent
        let html = data.slice(0, 5).map(n => {
            const safeData = encodeURIComponent(JSON.stringify(n));
            return `<div class="item-search" data-nv="${safeData}">
                ${n.ten} (${n.ma}) - ${n.bophan}
            </div>`;
        }).join("");
        
        elResult.innerHTML = html;
    } catch (e) { console.error("Lỗi:", e); }
};

// Xử lý sự kiện click chọn nhân viên (Event Delegation)
elResult.onclick = function(e) {
    const item = e.target.closest(".item-search");
    if (!item) return;

    // Giải mã dữ liệu an toàn
    const n = JSON.parse(decodeURIComponent(item.getAttribute("data-nv")));
    pickNV(n);
};
// Chọn nhân viên
window.pickNV = function(n) {
    currentNV = n;
    elResult.innerHTML = `
        <div class="selected-box" style="background:#e3f2fd; padding:10px; border-radius:5px; border:1px solid #2196f3">
            <b>✅ Đã chọn: ${n.ten}</b><br>
            <small>Mã: ${n.ma} | Giới tính: ${n.gioitinh} | Công đoàn: ${n.congdoan}</small>
        </div>`;
    calculatePrice();
};

// HIỆN / ẨN CHỌN NGƯỜI Ở CÙNG
const roomRadios = document.querySelectorAll("input[name=roomType]")
const mateBox = document.getElementById("mateBox")

roomRadios.forEach(r=>{
  r.onchange = ()=>{
    mateBox.style.display = (r.value=="manual" && r.checked) ? "block" : "none"
  }
})

// --- QUẢN LÝ CHỌN NGƯỜI Ở CÙNG ---
let mates = [];
const mateSearch = document.getElementById("mateSearch"); // Ô nhập tên đồng nghiệp
const mateResult = document.getElementById("mateResult"); // Khu vực hiện danh sách gợi ý
const mateList = document.getElementById("mateList");     // Khu vực hiện các tên đã chọn

// Tìm kiếm đồng nghiệp để ghép phòng
mateSearch.oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { mateResult.innerHTML = ""; return; }

    try {
        const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        
        // Render danh sách gợi ý an toàn
        mateResult.innerHTML = data.slice(0, 5).map(n => `
            <div class="item-mate" data-nv="${encodeURIComponent(JSON.stringify(n))}" 
                 style="padding:8px; border-bottom:1px solid #eee; cursor:pointer;">
                ${n.ten} (${n.ma})
            </div>
        `).join("");
    } catch (e) { console.error("Lỗi tìm bạn:", e); }
};

// Xử lý khi click chọn một người bạn
mateResult.onclick = function(e) {
    const item = e.target.closest(".item-mate");
    if (!item) return;

    if (mates.length >= 2) {
        alert("Một phòng tối đa 3 nhân viên (bao gồm bạn)!");
        return;
    }

    const n = JSON.parse(decodeURIComponent(item.getAttribute("data-nv")));
    
    // Kiểm tra không cho chọn trùng chính mình hoặc trùng người đã chọn
    if (n.ma === currentNV.ma || mates.some(m => m.ma === n.ma)) {
        alert("Nhân viên này đã có trong danh sách!");
        return;
    }

    mates.push(n);
    renderMates();
    mateSearch.value = "";
    mateResult.innerHTML = "";
};

// Lấy thẻ bao ngoài của phần nhập số người (giả sử bạn đặt class là group-family)
const familyInputGroup = document.getElementById("familyInputGroup"); 

roomRadios.forEach(r => {
  r.onchange = () => {
    // Hiện ô chọn bạn khi chọn "manual"
    mateBox.style.display = (r.value == "manual" && r.checked) ? "block" : "none";
    
    // HIỆN ô nhập người thân CHỈ KHI chọn "family"
    // Bạn hãy bao các ô input người lớn/trẻ em vào 1 div có id là familyInputGroup
    familyInputGroup.style.display = (r.value == "family" && r.checked) ? "block" : "none";
    
    // Nếu không phải ở với gia đình, reset các giá trị về 0 để tính tiền đúng
    if (r.value !== "family") {
        elAdult.value = 0;
        elChild.value = 0;
        elFamily.value = 0;
        calculatePrice();
    }
  }
});

function renderMates() {
    mateList.innerHTML = mates.map((m, index) => `
        <div style="background:#f1f3f4; padding:5px 10px; margin:5px 0; border-radius:15px; display:flex; justify-content:space-between;">
            <span>👤 ${m.ten}</span>
            <span onclick="removeMate(${index})" style="color:red; cursor:pointer; font-weight:bold;">×</span>
        </div>
    `).join("");
}

window.removeMate = function(index) {
    mates.splice(index, 1);
    renderMates();
};

// --- LOGIC TÍNH TIỀN THEO GIAO DIỆN ---
function calculatePrice() {
    if (!currentNV) return;

    const adult = parseInt(elAdult.value) || 0;
    const child = parseInt(elChild.value) || 0;
    const family = parseInt(elFamily.value) || 0;

    // Suất gốc của nhân viên
    let basePrice = (currentNV.congdoan === "Có") ? 1100000 : 2100000;
    
    // Tổng = Suất gốc + (Người lớn * 3.1tr) + (Trẻ em * 1.55tr) + (Người thân gia đình * 3.1tr)
    let total = basePrice + (adult * 3100000) + (child * 1550000) + (family * 3100000);

    elMoney.innerText = total.toLocaleString('vi-VN') + " đ";
    elMoney.dataset.value = total;
}

[elAdult, elChild, elFamily].forEach(input => input.oninput = calculatePrice);

// Gửi đăng ký
window.register = async function() {

    if (!currentNV) return alert("Vui lòng chọn nhân viên!");

    const btn = document.querySelector(".btn-submit");
    btn.innerText = "ĐANG GỬI...";
    btn.disabled = true;

    const roomType = document.querySelector("input[name=roomType]:checked").value;

    const params = new URLSearchParams({
        action:"register",
        ma: currentNV.ma,
        ten: currentNV.ten,
        gioitinh: currentNV.gioitinh,
        congdoan: currentNV.congdoan,
        adult: elAdult.value,
        child: elChild.value,
        family: elFamily.value,
        total: elMoney.dataset.value,
        roomType: roomType,
        mates: JSON.stringify(mates)
    });

    try {
        const res = await fetch(`${API_URL}?${params.toString()}`);
        const text = await res.text();

        if (text === "EXIST") alert("Nhân viên đã đăng ký!");
        else if (text === "CLOSED") alert("Đã khóa!");
        else {
            alert("Đăng ký thành công!");
            location.reload();
        }

    } catch (e) {
        alert("Lỗi kết nối!");
    }
    if (roomType === "manual" && mates.length === 0) {
    if (!confirm("Bạn chọn tự chọn người ở cùng nhưng chưa chọn ai. Hệ thống sẽ để trống phòng, bạn có muốn tiếp tục?")) return;
}
    btn.innerText = "XÁC NHẬN ĐĂNG KÝ";
    btn.disabled = false;
};
