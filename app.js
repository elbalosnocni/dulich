const API_URL = "https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec";

const elSearch = document.getElementById("search");
const elResult = document.getElementById("result");
const elAdult = document.getElementById("adult");
const elChild = document.getElementById("child");
const elFamily = document.getElementById("family");
const elMoney = document.getElementById("money");
const mateBox = document.getElementById("mateBox");
const familyInputGroup = document.getElementById("familyFields"); // Đảm bảo ID này khớp với HTML
const elFamilyMateSearch = document.getElementById("familyMateSearch"); //thêm các biến để điều khiển ô tìm kiếm người thân
const elFamilyMateResult = document.getElementById("familyMateResult");
const elSelectedFamilyMate = document.getElementById("selectedFamilyMate");

let currentNV = null;
let mates = [];
let familyMate = null; // Lưu thông tin người thân cùng công ty

// --- 1. TÌM KIẾM & CHỌN NHÂN VIÊN ---
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
        elResult.innerHTML = data.slice(0, 5).map(n => `
            <div class="item-search" data-nv="${encodeURIComponent(JSON.stringify(n))}">
                ${n.ten} (${n.ma}) - ${n.bophan}
            </div>`).join("");
    } catch (e) { console.error("Lỗi tìm kiếm:", e); }
};

elResult.onclick = function(e) {
    const item = e.target.closest(".item-search");
    if (!item) return;
    const n = JSON.parse(decodeURIComponent(item.getAttribute("data-nv")));
    currentNV = n;
    elResult.innerHTML = `
        <div class="selected-box" style="background:#e3f2fd; padding:10px; border-radius:5px; border:1px solid #2196f3">
            <b>✅ Đã chọn: ${n.ten}</b><br>
            <small>Mã: ${n.ma} | GT: ${n.gioitinh} | Công đoàn: ${n.congdoan} | BP: ${n.bophan}</small>
        </div>`;
    calculatePrice();
};

// --- 2. ẨN/HIỆN PHẦN NHẬP LIỆU THEO RADIO ---
const roomRadios = document.querySelectorAll("input[name=roomType]");
roomRadios.forEach(r => {
    r.onchange = () => {
        // Hiện box chọn bạn nếu chọn "manual"
        mateBox.style.display = (r.value === "manual") ? "block" : "none";
        
        // Hiện box người thân nếu chọn "family"
        familyInputGroup.style.display = (r.value === "family") ? "block" : "none";

        // Reset giá trị về 0 nếu không phải chọn gia đình để tính tiền chuẩn
        if (r.value !== "family") {
            elAdult.value = 0;
            elChild.value = 0;
            familyMate = null; // Lưu thông tin người thân cùng công ty
            elSelectedFamilyMate.innerHTML = "";
        }
        calculatePrice();
    };
});

// --- 3. QUẢN LÝ CHỌN BẠN Ở CÙNG (MATES) ---
const mateSearch = document.getElementById("mateSearch");
const mateResult = document.getElementById("mateResult");
const mateList = document.getElementById("mateList");

mateSearch.oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { mateResult.innerHTML = ""; return; }
    try {
        const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        mateResult.innerHTML = data.slice(0, 5).map(n => `
            <div class="item-mate" data-nv="${encodeURIComponent(JSON.stringify(n))}" style="padding:8px; border-bottom:1px solid #eee; cursor:pointer;">
                ${n.ten} (${n.ma})
            </div>`).join("");
    } catch (e) { console.error("Lỗi tìm bạn:", e); }
};

mateResult.onclick = function(e) {
    const item = e.target.closest(".item-mate");
    if (!item) return;
    if (!currentNV) { alert("Vui lòng chọn nhân viên chính trước!"); return; }
    if (mates.length >= 2) { alert("Tối đa 3 người/phòng!"); return; }

    const n = JSON.parse(decodeURIComponent(item.getAttribute("data-nv")));
    if (n.ma === currentNV.ma || mates.some(m => m.ma === n.ma)) {
        alert("Nhân viên này đã có trong danh sách!"); return;
    }

    mates.push(n);
    renderMates();
    mateSearch.value = "";
    mateResult.innerHTML = "";
};

function renderMates() {
    mateList.innerHTML = mates.map((m, i) => `
        <div style="background:#f1f3f4; padding:5px 10px; margin:5px 0; border-radius:15px; display:flex; justify-content:space-between;">
            <span>👤 ${m.ten}</span>
            <span onclick="removeMate(${i})" style="color:red; cursor:pointer; font-weight:bold;">×</span>
        </div>`).join("");
}

window.removeMate = function(index) {
    mates.splice(index, 1);
    renderMates();
};

// --- 4. TÌM KIẾM NGƯỜI THÂN CÙNG CÔNG TY ---
elFamilyMateSearch.oninput = async function() {
    const q = this.value.trim();
    if (q.length < 2) { elFamilyMateResult.innerHTML = ""; return; }
    try {
        const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        elFamilyMateResult.innerHTML = data.slice(0, 5).map(n => `
            <div class="item-family-mate" data-nv="${encodeURIComponent(JSON.stringify(n))}" style="padding:8px; border-bottom:1px solid #eee; cursor:pointer;">
                ${n.ten} (${n.ma}) - ${n.bophan}
            </div>`).join("");
    } catch (e) { console.error("Lỗi tìm người thân:", e); }
};

// Khi click chọn người thân từ danh sách gợi ý
elFamilyMateResult.onclick = function(e) {
    const item = e.target.closest(".item-family-mate");
    if (!item) return;
    
    const n = JSON.parse(decodeURIComponent(item.getAttribute("data-nv")));
    
    // Kiểm tra không được chọn chính mình làm người thân
    if (currentNV && n.ma === currentNV.ma) {
        alert("Không thể chọn chính mình làm người thân!");
        return;
    }

    familyMate = n; // Gán vào biến global đã khai báo
    
    // Hiển thị người đã chọn lên giao diện
    elSelectedFamilyMate.innerHTML = `
        <div style="background:#f1f8e9; padding:5px 10px; margin:5px 0; border-radius:5px; display:flex; justify-content:space-between; border:1px solid #8bc34a">
            <span>👤 ${n.ten} (${n.ma})</span>
            <span onclick="removeFamilyMate()" style="color:red; cursor:pointer; font-weight:bold;">× Gỡ bỏ</span>
        </div>`;
    
    elFamilyMateSearch.value = "";
    elFamilyMateResult.innerHTML = "";
    calculatePrice(); // Tính lại tiền ngay lập tức
};

// Hàm gỡ bỏ người thân đã chọn
window.removeFamilyMate = function() {
    familyMate = null;
    elSelectedFamilyMate.innerHTML = "";
    calculatePrice();
};

// --- 5. TÍNH TIỀN ---
//  Biến lưu trữ danh sách người thân cùng công ty
let familyMates = [];
// Hàm tính tiền cập nhật
function calculatePrice() {
    if (!currentNV) return;

    // 5.1. Suất của nhân viên chính
    let total = (currentNV.congdoan === "Có") ? 1100000 : 2100000;

    // 5.2. Nếu có người thân cùng công ty Cộng tiền từng người thân cùng công ty (1.1tr hoặc 2.1tr)
    familyMates.forEach(m => {
        total += (m.congdoan === "Có") ? 1100000 : 2100000;
    });

    // 5.3. Người thân ngoài công ty & trẻ em
    // Người thân ngoài và trẻ em
    const adultCount = parseInt(elAdult.value) || 0;
    const childCount = parseInt(elChild.value) || 0;
    total += (adultCount * 3100000) + (childCount * 1550000);

    elMoney.innerText = total.toLocaleString('vi-VN') + " đ";
    elMoney.dataset.value = total;
}

// Logic khi chọn người thân trong mục Gia đình
// (Tương tự như phần tìm kiếm đồng nghiệp bạn đã viết, nhưng gán vào biến familyMate)
[elAdult, elChild].forEach(input => input.oninput = calculatePrice);

// --- 6. GỬI ĐĂNG KÝ ---
window.register = async function() {
    if (!currentNV) return alert("Vui lòng chọn nhân viên!");
    const roomType = document.querySelector("input[name=roomType]:checked").value;

    // Kiểm tra nếu chọn manual mà chưa có bạn
    if (roomType === "manual" && mates.length === 0) {
        if (!confirm("Bạn chọn tự chọn người ở cùng nhưng chưa chọn ai. Hệ thống sẽ để trống phòng, bạn có muốn tiếp tục?")) return;
    }

    const btn = document.querySelector(".btn-submit");
    const originalText = btn.innerText;
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
        total: elMoney.dataset.value,
        roomType: roomType,
        // Gửi thông tin familyMate để Code.gs biết có người thân trong cty
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
