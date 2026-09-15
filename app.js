const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let state = {
  subject: "auto",
  lang: localStorage.getItem("mathixLang") || "en",
  theme: localStorage.getItem("mathixTheme") || "light",
  history: JSON.parse(localStorage.getItem("mathixHistory") || "[]"),
  favorites: JSON.parse(localStorage.getItem("mathixFavorites") || "[]"),
  current: null,
  stream: null
};

const translations = {
  en: {
    navSolve:"Solve",navHistory:"History",navFavorites:"Favorites",navSettings:"Settings",
        eyebrow:"AI STUDY ASSISTANT",heroTitle:"Your problem.<br><em>Solved.</em>",
    heroText:"Solve Math, Physics and Chemistry problems with clear, step-by-step explanations.",
    online:"Mathix AI is ready",auto:"Auto Detect",math:"Mathematics",physics:"Physics",chemistry:"Chemistry",
    inputPlaceholder:"Type your problem here...\n\nExample: Solve 2x + 5 = 17",upload:"Upload image",scan:"Scan with camera",
    solve:"Solve Problem",try:"Try:",back:"Back",solution:"SOLUTION",favorite:"Favorite",export:"Export",
    f1:"Scan anything",f1s:"Camera & image recognition",f2:"Step by step",f2s:"Understand, don't just copy",
    f3:"Arabic + English",f3s:"Switch language anytime",f4:"Export answers",f4s:"Save and share your work",
    historyTitle:"History",historyText:"Your recent solved problems appear here.",
    favoritesTitle:"Favorites",favoritesText:"Keep useful solutions close.",settingsTitle:"Settings",
    language:"Language",languageDesc:"Change the Mathix interface language.",theme:"Appearance",
    themeDesc:"Switch between light and dark mode.",cameraTitle:"Scan a problem"
  },
  ar: {
    navSolve:"حل",navHistory:"السجل",navFavorites:"المفضلة",navSettings:"الإعدادات",
        eyebrow:"مساعد دراسة بالذكاء الاصطناعي",heroTitle:"مسألتك.<br><em>محلولة.</em>",
    heroText:"حل مسائل الرياضيات والفيزياء والكيمياء بشرح واضح خطوة بخطوة.",
    online:"Mathix AI جاهز",auto:"اكتشاف تلقائي",math:"رياضيات",physics:"فيزياء",chemistry:"كيمياء",
    inputPlaceholder:"اكتب المسألة هنا...\n\nمثال: حل 2x + 5 = 17",upload:"رفع صورة",scan:"التصوير بالكاميرا",
    solve:"حل المسألة",try:"جرب:",back:"رجوع",solution:"الحل",favorite:"المفضلة",export:"تصدير",
    f1:"صوّر أي مسألة",f1s:"كاميرا وقراءة الصور",f2:"خطوة بخطوة",f2s:"افهم الحل، مش مجرد الإجابة",
    f3:"عربي + English",f3s:"غيّر اللغة في أي وقت",f4:"تصدير الحل",f4s:"احفظ وشارك حلك",
    historyTitle:"السجل",historyText:"هتلاقي هنا المسائل اللي حليتها مؤخرًا.",
    favoritesTitle:"المفضلة",favoritesText:"احتفظ بالحلول المهمة.",settingsTitle:"الإعدادات",
    language:"اللغة",languageDesc:"غيّر لغة واجهة Mathix.",theme:"المظهر",
    themeDesc:"بدّل بين الوضع الفاتح والداكن.",cameraTitle:"صوّر المسألة"
  }
};

function applyLanguage(){
  const t=translations[state.lang];
  document.documentElement.lang=state.lang;
  document.documentElement.dir=state.lang==="ar"?"rtl":"ltr";
  $$("[data-i18n]").forEach(el=>{ if(t[el.dataset.i18n]!==undefined) el.innerHTML=t[el.dataset.i18n]; });
  $$("[data-i18n-placeholder]").forEach(el=>{el.placeholder=t[el.dataset.i18nPlaceholder]});
  $("#langBtn").textContent=state.lang==="ar"?"English":"العربية";
  $("#settingsLang").textContent=state.lang==="ar"?"English":"العربية";
}
function applyTheme(){document.body.classList.toggle("dark",state.theme==="dark");$("#themeBtn").textContent=state.theme==="dark"?"☀":"☾";$("#settingsTheme").textContent=state.theme==="dark"?"☀":"☾";}

function showView(name){
  $$(".view").forEach(v=>v.classList.remove("active-view"));
  const el=$("#"+name+"View"); if(el) el.classList.add("active-view");
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  if(name==="history") renderHistory();
  if(name==="favorites") renderFavorites();
  $(".sidebar")?.classList.remove("open");
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}

$$(".nav-item").forEach(btn=>btn.addEventListener("click",()=>showView(btn.dataset.view)));
$("#mobileMenu").addEventListener("click",()=>$(".sidebar").classList.toggle("open"));

$$(".subject").forEach(btn=>btn.addEventListener("click",()=>{
  $$(".subject").forEach(x=>x.classList.remove("active"));btn.classList.add("active");state.subject=btn.dataset.subject;
}));

$$(".examples button").forEach(btn=>btn.addEventListener("click",()=>{$("#problemInput").value=btn.dataset.example;$("#problemInput").focus()}));

$("#langBtn").addEventListener("click",toggleLang);
$("#settingsLang").addEventListener("click",toggleLang);
function toggleLang(){state.lang=state.lang==="en"?"ar":"en";localStorage.setItem("mathixLang",state.lang);applyLanguage()}
$("#themeBtn").addEventListener("click",toggleTheme);
$("#settingsTheme").addEventListener("click",toggleTheme);
function toggleTheme(){state.theme=state.theme==="light"?"dark":"light";localStorage.setItem("mathixTheme",state.theme);applyTheme()}

$("#imageInput").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{
    const dataUrl=await imageToDataURL(file);
    $("#previewImg").src=dataUrl;
    $("#imageName").textContent=file.name;
    $("#imagePreview").classList.remove("hidden");
    toast(state.lang==="ar"?"تم تحميل الصورة — اضغط حل المسألة":"Image loaded — press Solve Problem");
  }catch(err){ toast(state.lang==="ar"?"تعذر قراءة الصورة":"Could not read the image"); }
});
$("#removeImage").addEventListener("click",()=>{$("#imageInput").value="";$("#imagePreview").classList.add("hidden")});

$("#cameraBtn").addEventListener("click",openCamera);
$("#closeCamera").addEventListener("click",closeCamera);
async function openCamera(){
  $("#cameraModal").classList.remove("hidden");
  try{
    state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
    $("#cameraVideo").srcObject=state.stream; $("#cameraStatus").textContent="";
  }catch(e){$("#cameraStatus").textContent=state.lang==="ar"?"اسمح للمتصفح باستخدام الكاميرا.":"Please allow camera access in your browser."}
}
function closeCamera(){if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;$("#cameraModal").classList.add("hidden")}
$("#captureBtn").addEventListener("click",()=>{
  const v=$("#cameraVideo"), c=$("#cameraCanvas");
  if(!v.videoWidth){toast(state.lang==="ar"?"الكاميرا لسه بتجهز":"Camera not ready");return}
  const max=1600, scale=Math.min(1,max/v.videoWidth);
  c.width=Math.round(v.videoWidth*scale); c.height=Math.round(v.videoHeight*scale);
  const ctx=c.getContext("2d",{alpha:false});
  ctx.drawImage(v,0,0,c.width,c.height);
  const dataUrl=c.toDataURL("image/jpeg",.88);
  $("#previewImg").src=dataUrl;
  $("#imageName").textContent="camera-scan.jpg";
  $("#imagePreview").classList.remove("hidden");
  closeCamera();
  toast(state.lang==="ar"?"تم التقاط الصورة":"Photo captured");
});

function imageToDataURL(file){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith("image/")) return reject(new Error("Invalid image"));
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const max=1600, scale=Math.min(1,max/img.width);
        const c=document.createElement("canvas");
        c.width=Math.max(1,Math.round(img.width*scale));
        c.height=Math.max(1,Math.round(img.height*scale));
        const ctx=c.getContext("2d",{alpha:false});
        ctx.drawImage(img,0,0,c.width,c.height);
        resolve(c.toDataURL("image/jpeg",.88));
      };
      img.onerror=reject; img.src=reader.result;
    };
    reader.onerror=reject; reader.readAsDataURL(file);
  });
}

async function solveProblem(){
  const text=$("#problemInput").value.trim();
  const image = $("#previewImg").src && !$("#imagePreview").classList.contains("hidden")
    ? $("#previewImg").src : null;

  if(!text && !image){
    toast(state.lang==="ar"?"اكتب المسألة أو ارفع صورة":"Type a problem or upload an image");
    return;
  }

  const btn=$("#solveBtn");
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=state.lang==="ar"?"⏳ جاري الحل...":"⏳ Solving...";

  try{
    if(location.protocol === "file:"){
      throw new Error(state.lang==="ar"?"شغّل Mathix من سيرفر يدعم الـAPI — GitHub Pages لا يشغّل الـBackend.":"Run Mathix with an API backend — GitHub Pages cannot run the backend.");
    }
    const response=await fetch("/api/solve",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        problem:text,
        subject:state.subject,
        language:state.lang,
        imageData:image && image.startsWith("data:") ? image : null
      })
    });

    const data=await response.json();
    if(!response.ok) throw new Error(data.error || "Solver error");

    state.current={
      ...data,
      id:Date.now(),
      created:new Date().toISOString(),
      favorite:false
    };
    state.history.unshift(state.current);
    state.history=state.history.slice(0,50);
    save();
    renderResult(state.current);
    showView("result");
    $("#resultTitle").textContent=state.current.title || (state.lang==="ar"?"الحل":"Solution");
  }catch(err){
    console.error(err);
    toast(err.message || (state.lang==="ar"?"حدث خطأ أثناء الحل":"Something went wrong"));
  }finally{
    btn.disabled=false;
    btn.innerHTML=old;
  }
}

$("#solveBtn").addEventListener("click",solveProblem);

function renderResult(d){
  const labels=state.lang==="ar"?{answer:"الإجابة النهائية",steps:"الحل خطوة بخطوة",check:"ملاحظة"}:{answer:"FINAL ANSWER",steps:"STEP-BY-STEP",check:"NOTE"};
  $("#resultContent").innerHTML=`
    <div class="solution-card answer-card"><div class="answer-label">${labels.answer}</div><div class="final-answer">${escapeHtml(d.answer)}</div></div>
    <div class="solution-card"><div class="answer-label">${labels.steps}</div>
      ${d.steps.map((s,i)=>`<div class="step"><div class="step-num">${i+1}</div><div><h4>${escapeHtml(s[0])}</h4><p>${escapeHtml(s[1])}</p><div class="formula">${escapeHtml(s[2])}</div></div></div>`).join("")}
    </div>
    <div class="solution-card"><div class="answer-label">${labels.check}</div><p style="margin:8px 0 0;color:var(--muted);font-size:13px;line-height:1.7">${escapeHtml(d.note)}</p></div>`;
  $("#favoriteBtn").innerHTML=(d.favorite?"♥ ":"♡ ")+(state.lang==="ar"?"المفضلة":"Favorite");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function save(){localStorage.setItem("mathixHistory",JSON.stringify(state.history));localStorage.setItem("mathixFavorites",JSON.stringify(state.favorites))}

$("#backBtn").addEventListener("click",()=>showView("solver"));
$("#favoriteBtn").addEventListener("click",()=>{
  if(!state.current)return;state.current.favorite=!state.current.favorite;
  state.history=state.history.map(x=>x.id===state.current.id?state.current:x);
  if(state.current.favorite)state.favorites.unshift(state.current);else state.favorites=state.favorites.filter(x=>x.id!==state.current.id);
  save();renderResult(state.current);toast(state.current.favorite?(state.lang==="ar"?"تمت الإضافة للمفضلة":"Added to favorites"):(state.lang==="ar"?"تمت الإزالة":"Removed"));
});
$("#printBtn").addEventListener("click",()=>window.print());

function renderHistory(){
  const box=$("#historyList");
  if(!state.history.length){box.innerHTML=`<div class="history-item"><div class="hi-main"><strong>${state.lang==="ar"?"لا توجد مسائل حتى الآن":"No solved problems yet"}</strong><small>${state.lang==="ar"?"ابدأ بحل أول مسألة.":"Solve your first problem to see it here."}</small></div></div>`;return}
  box.innerHTML=state.history.map(x=>`<button class="history-item" style="text-align:${state.lang==="ar"?"right":"left"};cursor:pointer;color:inherit" data-id="${x.id}"><div class="hi-main"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.subject)} · ${new Date(x.created).toLocaleString()}</small></div><span>→</span></button>`).join("");
  $$("#historyList [data-id]").forEach(b=>b.onclick=()=>{state.current=state.history.find(x=>String(x.id)===b.dataset.id);renderResult(state.current);showView("result")});
}
function renderFavorites(){
  const box=$("#favoritesList");
  if(!state.favorites.length){box.innerHTML=`<div class="history-item"><div class="hi-main"><strong>${state.lang==="ar"?"المفضلة فارغة":"No favorites yet"}</strong><small>${state.lang==="ar"?"احفظ أي حل مهم من صفحة النتيجة.":"Save useful solutions from the result page."}</small></div></div>`;return}
  box.innerHTML=state.favorites.map(x=>`<button class="history-item" style="text-align:${state.lang==="ar"?"right":"left"};cursor:pointer;color:inherit" data-id="${x.id}"><div class="hi-main"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.answer)}</small></div><span>♥</span></button>`).join("");
  $$("#favoritesList [data-id]").forEach(b=>b.onclick=()=>{state.current=state.favorites.find(x=>String(x.id)===b.dataset.id);renderResult(state.current);showView("result")});
}

applyLanguage();applyTheme();renderHistory();renderFavorites();

// Mathix account layer