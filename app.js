const API="https://script.google.com/macros/s/AKfycby5CGenVOjF4TJpQj2JLXJKcnxPSJZUF_5cGWomEhou0J0TXnWdn3lJS668LDywxLv2/exec"

let nv=null

const search=document.getElementById("search")
const result=document.getElementById("result")
const adult=document.getElementById("adult")
const child=document.getElementById("child")
const family=document.getElementById("family")
const money=document.getElementById("money")

search.oninput=async function(){

const q=this.value.trim()

if(q.length<2){
result.innerHTML=""
return
}

try{
const res=await fetch(API+"?action=search&q="+encodeURIComponent(q))
const data=await res.json()

let html=""

data.slice(0,5).forEach(n=>{
html+=`<div onclick='pick(${JSON.stringify(n)})'>${n.ten}</div>`
})

result.innerHTML=html

}catch(e){
result.innerHTML="Lỗi API"
}

}

function pick(n){
nv=n
result.innerHTML=n.ten
calc()
}

function calc(){

if(!nv) return

let a=+adult.value
let c=+child.value
let f=+family.value

let price=0

price+= (nv.congdoan=="Có"?1100000:2100000)*a
price+= c*1550000
price+= f*3100000

money.innerText=price.toLocaleString()+" đ"
}

document.querySelectorAll("input").forEach(e=>e.oninput=calc)

async function register(){

if(!nv){
alert("Chọn nhân viên")
return
}

const url=API+
"?action=register"+
"&ma="+nv.ma+
"&ten="+encodeURIComponent(nv.ten)+
"&gioitinh="+nv.gioitinh+
"&congdoan="+nv.congdoan+
"&adult="+adult.value+
"&child="+child.value+
"&family="+family.value+
"&total="+money.innerText

const res=await fetch(url)
const text=await res.text()

if(text=="EXIST") alert("Đã đăng ký")
else if(text=="CLOSED") alert("Hết hạn")
else alert("Thành công")

}
