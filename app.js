const API="https://script.google.com/macros/s/AKfycbyJJBXhju6ggvKTaOhdYI1GI8gEGKSZ-rVPgCAIo543q2iQsFLluodSart5H0Y7ZgOf/exec"

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

let html=""

data.slice(0,5).forEach(n=>{

html+=`
<div onclick='pick(${JSON.stringify(n)})'>
${n.ten} (${n.ma})
</div>
`

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

}



document.querySelectorAll("input").forEach(e=>{
e.oninput=calc
})



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

if(text=="EXIST"){
alert("Nhân viên đã đăng ký")
}
else if(text=="CLOSED"){
alert("Đã hết hạn đăng ký")
}
else{
alert("Đăng ký thành công")
}

}
