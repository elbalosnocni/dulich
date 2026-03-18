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
         // dùng onclick JSON dễ vỡ khi tên có dấu → lỗi click / render   
            html += `<div class="item-search" onclick='pickNV(${JSON.stringify(n)})'>
        // đổi onclick JSON thành nhưng lỗi nên thôi   html += `<div class="item-search" data='${encodeURIComponent(JSON.stringify(n))}'>  
            ${n.ten} (${n.ma}) - ${n.bophan}
            </div>`;
        });
        elResult.innerHTML = html;

        // click handler
     elResult.onclick = function(e){
    const item = e.target.closest(".item-search");
    if(!item) return;

    const n = JSON.parse(decodeURIComponent(item.getAttribute("data")));
    pickNV(n);
};
        
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
// HIỆN / ẨN CHỌN NGƯỜI Ở CÙNG
const roomRadios = document.querySelectorAll("input[name=roomType]")
const mateBox = document.getElementById("mateBox")

roomRadios.forEach(r=>{
  r.onchange = ()=>{
    mateBox.style.display = (r.value=="manual" && r.checked) ? "block" : "none"
  }
})

// CHỌN NGƯỜI Ở CÙNG
let mates = []

const mateSearch = document.getElementById("mateSearch")
const mateResult = document.getElementById("mateResult")
const mateList = document.getElementById("mateList")

mateSearch.oninput = async function(){

  const q = this.value.trim()
  if(q.length<2) return

  const res = await fetch(API_URL+"?action=search&q="+encodeURIComponent(q))
  const data = await res.json()

  let html=""

  data.slice(0,5).forEach(n=>{
    html+=`<div class="item" data='${encodeURIComponent(JSON.stringify(n))}'>
      ${n.ten}
    </div>`
  })

  mateResult.innerHTML = html
}

mateResult.onclick = function(e){

  const item = e.target.closest(".item")
  if(!item) return

  if(mates.length>=2){
    alert("Tối đa 3 người/phòng")
    return
  }

  const n = JSON.parse(decodeURIComponent(item.getAttribute("data")))

  mates.push(n)

  renderMates()
}

function renderMates(){
  mateList.innerHTML = mates.map(m=>`<div>${m.ten}</div>`).join("")
}

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

    btn.innerText = "XÁC NHẬN ĐĂNG KÝ";
    btn.disabled = false;
};
