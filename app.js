const API="https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec"

const search=document.getElementById("search")
const result=document.getElementById("result")

const adult=document.getElementById("adult")
const child=document.getElementById("child")
const family=document.getElementById("family")
const money=document.getElementById("money")

let nv=null


search.oninput=async function(){

  const q=this.value.trim()

  if(q.length<2){
    result.innerHTML=""
    return
  }

  const res=await fetch(API+"?action=search&q="+encodeURIComponent(q))
  const data=await res.json()

  if(data.length==0){
    result.innerHTML="<div>Không tìm thấy</div>"
    return
  }

  let html=""

  data.slice(0,5).forEach(n=>{
    html+=`
    <div class="item" data='${encodeURIComponent(JSON.stringify(n))}'>
      ${n.ten} (${n.ma})
    </div>`
  })

  result.innerHTML=html
}


result.onclick=function(e){

  const item=e.target.closest(".item")
  if(!item) return

  const data=item.getAttribute("data")

  pick(JSON.parse(decodeURIComponent(data)))
}


function pick(n){

  nv=n

  result.innerHTML=`
  <b>${n.ten}</b><br>
  ${n.bophan} - ${n.chucvu}
  `

  calc()
}


function calc(){

  if(!nv) return

  let a=+adult.value
  let c=+child.value
  let f=+family.value

  let price=0

  if(nv.congdoan=="Có"){
    price+=a*1100000
  }else{
    price+=a*2100000
  }

  price+=c*1550000
  price+=f*3100000

  money.innerText=price.toLocaleString()+" đ"
  money.dataset.value=price
}


document.querySelectorAll("input").forEach(e=>{
  e.oninput=calc
})


async function register(){

  if(!nv){
    alert("Chọn nhân viên")
    return
  }

  const url=API+"?action=register"+
  "&ma="+encodeURIComponent(nv.ma)+
  "&ten="+encodeURIComponent(nv.ten)+
  "&gioitinh="+encodeURIComponent(nv.gioitinh)+
  "&congdoan="+encodeURIComponent(nv.congdoan)+
  "&adult="+adult.value+
  "&child="+child.value+
  "&family="+family.value+
  "&total="+money.dataset.value

  const res=await fetch(url)
  const text=await res.text()

  if(text=="EXIST"){
    alert("Nhân viên đã đăng ký")
  }
  else if(text=="CLOSED"){
    alert("Đã hết hạn đăng ký")
  }
  else{
    alert("Đăng ký thành công")
    location.reload()
  }
}
let selectedNV = null;

async function search() {
    let q = document.getElementById('search').value;
    if (q.length < 2) return;
    
    let res = await fetch(`${API}?action=search&q=${q}`);
    let data = await res.json();
    
    let html = data.map(nv => `
        <div class="item" onclick='selectNV(${JSON.stringify(nv)})'>
            ${nv.ten} - ${nv.ma} (${nv.bophan})
        </div>
    `).join('');
    document.getElementById('result-list').innerHTML = html;
}

function selectNV(nv) {
    selectedNV = nv;
    document.getElementById('info-card').classList.remove('hidden');
    document.getElementById('display-name').innerText = nv.ten;
    document.getElementById('display-detail').innerText = `${nv.ma} | ${nv.nhamay} | ${nv.chucvu}`;
    
    // Tự động chọn mức giá theo công đoàn
    if (nv.congdoan === "Có") {
        document.getElementById('reg-type').value = "1100000";
        document.getElementById('opt-kcd').disabled = true;
    } else {
        document.getElementById('reg-type').value = "2100000";
        document.getElementById('opt-cd').disabled = true;
    }
    calculate();
}

function calculate() {
    let base = parseInt(document.getElementById('reg-type').value);
    let childPrice = document.getElementById('child').value * 1550000;
    let adultPrice = document.getElementById('adult').value * 3100000;
    
    let total = base + childPrice + adultPrice;
    document.getElementById('total-price').innerText = total.toLocaleString();
}
