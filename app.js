const API_URL="https://script.google.com/macros/s/AKfycbyQ2OS-y2wSEK1WeULo8PUHmC2oDk_YZsSNjRP3umxc7Y3EPQS600AN4s2r_KMo5On3mQ/exec"

let nv=null

search.oninput=async function(){

const q=this.value

if(q.length<2) return

const res=await fetch(API_URL+"?action=search&q="+q)

const data=await res.json()

let html=""

data.slice(0,5).forEach(n=>{

html+=`
<div onclick='pick(${JSON.stringify(n)})'>
${n.ten} (${n.ma})
</div>`

})

result.innerHTML=html

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

let adult=+adult.value
let child=+child.value
let family=+family.value

let price=0

if(nv.congdoan=="Có"){

price+=adult*1100000

}else{

price+=adult*2100000

}

price+=child*1550000
price+=family*3100000

money.innerText=price.toLocaleString()+" đ"

}

document.querySelectorAll("input").forEach(e=>{
e.oninput=calc
})

async function register(){

if(!nv){
alert("Chọn nhân viên")
return
}

const url=API_URL+"?action=register"+
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

if(text=="EXIST"){
alert("Nhân viên đã đăng ký")
}else if(text=="CLOSED"){
alert("Đã hết hạn đăng ký")
}else{
alert("Đăng ký thành công")
}

}
