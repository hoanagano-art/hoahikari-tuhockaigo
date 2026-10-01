import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL,SUPABASE_ANON_KEY } from "../config.js";
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s);
let current="dashboard";
$("#loginBtn").onclick=async()=>{const {error}=await db.auth.signInWithPassword({email:$("#email").value,password:$("#password").value});if(error)$("#loginMsg").textContent=error.message;else boot()};
$("#logout").onclick=()=>db.auth.signOut().then(()=>location.reload());
async function boot(){const {data:{session}}=await db.auth.getSession();if(!session){$("#app").hidden=true;$("#login").hidden=false;return}$("#login").hidden=true;$("#app").hidden=false;render("dashboard")}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>render(b.dataset.tab));
async function count(t){const {count}=await db.from(t).select("*",{count:"exact",head:true});return count||0}
async function render(tab){
 current=tab;
 if(tab==="dashboard"){const [p,k,r,n]=await Promise.all([count("posts"),count("knowledge"),count("resources"),count("notices")]);$("#content").innerHTML=`<h1>Dashboard</h1><p class="muted">Quản lý nội dung HoaHikari.</p><div class="stats"><div class="stat">📝<b>${p}</b>Bài viết</div><div class="stat">📚<b>${k}</b>Kiến thức</div><div class="stat">🎥<b>${r}</b>Tài liệu/video</div><div class="stat">📢<b>${n}</b>Thông báo</div></div><div class="panel" style="margin-top:18px"><h2>Quy trình hàng ngày</h2><p>Thêm bài → chọn ngày → bật hiển thị → website tự lấy nội dung.</p></div>`;return}
 if(tab==="settings"){return settings()}
 return editor(tab)
}
const labels={posts:"Bài viết",knowledge:"Kiến thức",roadmap:"Roadmap",notices:"Thông báo",resources:"Tài liệu & video"};
async function editor(table){
 const {data}=await db.from(table).select("*").order("created_at",{ascending:false});
 $("#content").innerHTML=`<h1>${labels[table]}</h1><button class="primary" id="new">＋ Thêm mới</button><div id="form"></div><div class="list">${(data||[]).map(x=>`<div class="item"><div><b>${x.title||"(không có tiêu đề)"}</b><div class="muted">${x.published===false?"Ẩn":"Đang hiển thị"}</div></div><div class="actions"><button data-edit="${x.id}">Sửa</button><button class="danger" data-del="${x.id}">Xóa</button></div></div>`).join("")}</div>`;
 $("#new").onclick=()=>form();
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>form(data.find(x=>String(x.id)===b.dataset.edit)));
 document.querySelectorAll("[data-del]").forEach(b=>b.onclick=async()=>{if(confirm("Xóa nội dung này?")){await db.from(table).delete().eq("id",b.dataset.del);editor(table)}});
 function form(x={}){
   $("#form").innerHTML=`<div class="panel" style="margin:18px 0"><h2>${x.id?"Sửa":"Thêm"} ${labels[table]}</h2>
   <label>Tiêu đề</label><input id="fTitle" value="${esc(x.title||"")}">
   <label>Nội dung</label><textarea id="fBody">${esc(x.body||"")}</textarea>
   <label>Ảnh</label><input id="fFile" type="file" accept="image/*"><input id="fImg" value="${esc(x.image_url||"")}" placeholder="Hoặc dán URL ảnh">
   <label>Link (có thể bỏ trống)</label><input id="fUrl" value="${esc(x.url||"")}" placeholder="https://...">
   <label>Ngày hiển thị / đăng</label><input id="fDate" type="date" value="${x.publish_date||new Date().toISOString().slice(0,10)}">
   <label><input id="fPub" type="checkbox" ${x.published!==false?"checked":""} style="width:auto"> Hiển thị</label>
   <div class="actions"><button class="primary" id="save">Lưu</button><button id="cancel">Hủy</button></div></div>`;
   $("#cancel").onclick=()=>$("#form").innerHTML="";
   $("#save").onclick=async()=>{
   let imageUrl=$("#fImg").value||null;
   const file=$("#fFile").files[0];
   if(file){
     const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
     const path=`${Date.now()}-${safe}`;
     const up=await db.storage.from("hoahikari-images").upload(path,file,{upsert:false,contentType:file.type});
     if(up.error){alert(up.error.message);return}
     imageUrl=db.storage.from("hoahikari-images").getPublicUrl(path).data.publicUrl;
   }
   const obj={title:$("#fTitle").value,body:$("#fBody").value,image_url:imageUrl,url:$("#fUrl").value||null,publish_date:$("#fDate").value,published:$("#fPub").checked};
   let q=x.id?db.from(table).update(obj).eq("id",x.id):db.from(table).insert(obj);
   const {error}=await q;if(error)alert(error.message);else editor(table)
 }
 }
}
function settings(){
 $("#content").innerHTML=`<h1>⚙️ Cài đặt</h1><div class="panel"><label>Giới thiệu trang chủ</label><textarea id="hero"></textarea><label>Link app CCQG</label><input id="appurl"><button class="primary" id="saveSettings">Lưu cài đặt</button></div>`;
 db.from("site_settings").select("*").limit(1).maybeSingle().then(({data})=>{$("#hero").value=data?.hero_text||"";$("#appurl").value=data?.app_url||""});
 $("#saveSettings").onclick=async()=>{const {data}=await db.from("site_settings").select("id").limit(1).maybeSingle();const obj={hero_text:$("#hero").value,app_url:$("#appurl").value};const q=data?db.from("site_settings").update(obj).eq("id",data.id):db.from("site_settings").insert(obj);const {error}=await q;alert(error?error.message:"Đã lưu")};
}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
boot();