const API_URL="https://script.google.com/macros/s/AKfycbydnC46ulhR_fPb6xYGNWZeHOUb3NKCX9JuxZA_jySRXF4dNvFKtA_t0qnDvksLat6XhA/exec"

const search = document.getElementById("search")
const adult = document.getElementById("adult")
const child = document.getElementById("child")
const family = document.getElementById("family")
const result = document.getElementById("result")
const money = document.getElementById("money")

let nv=null

search.oninput = async function(){

  const q = this.value
  if(q.length<2) return

  const q2 = q.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"")

  const res = await fetch(API_URL+"?action=search&q="+q2)
  const data = await res.json()

  let html=""

  data.slice(0,5).forEach(n=>{
    html += `
    <div class="item" data='${encodeURIComponent(JSON.stringify(n))}'>
      ${n.ten} (${n.ma})
    </div>`
  })

  result.innerHTML = html
}

result.onclick = function(e){
  const data = e.target.getAttribute("data")
  if(data){
    pick(JSON.parse(decodeURIComponent(data)))
  }
}

function pick(n){
  nv = n

  result.innerHTML = `
  <b>${n.ten}</b><br>
  ${n.bophan} - ${n.chucvu}
  `

  calc()
}

function calc(){

  if(!nv) return

  let a = +adult.value
  let c = +child.value
  let f = +family.value

  let price = 0

  if(nv.congdoan=="Có"){
    price += a*1100000
  }else{
    price += a*2100000
  }

  price += c*1550000
  price += f*3100000

  money.innerText = price.toLocaleString()+" đ"
  money.dataset.value = price
}

document.querySelectorAll("input").forEach(e=>{
  e.oninput = calc
})

async function register(){

  if(!nv){
    alert("Chọn nhân viên")
    return
  }

  const url = API_URL+"?action=register"+
  "&ma="+encodeURIComponent(nv.ma)+
  "&ten="+encodeURIComponent(nv.ten)+
  "&gioitinh="+encodeURIComponent(nv.gioitinh)+
  "&congdoan="+encodeURIComponent(nv.congdoan)+
  "&adult="+adult.value+
  "&child="+child.value+
  "&family="+family.value+
  "&total="+money.dataset.value

  const res = await fetch(url)
  const text = await res.text()

  if(text=="EXIST"){
    alert("Nhân viên đã đăng ký")
  }else if(text=="CLOSED"){
    alert("Đã hết hạn đăng ký")
  }else{
    alert("Đăng ký thành công")
  }
}
