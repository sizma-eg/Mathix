const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  subject: "auto",
  lang: localStorage.getItem("mathixLang") || "en",
  theme: localStorage.getItem("mathixTheme") || "light",
  history: [],
  favorites: [],
  current: null,
  stream: null,
  imageData: null,
  imageObjectUrl: null,
  solving: false
};

let authToken = localStorage.getItem("mathixToken") || "";
let currentUser = null;
let authMode = "login";

const translations = {
  en: {
    navSolve:"Solve", navHistory:"History", navFavorites:"Favorites", navDashboard:"Dashboard", navSettings:"Settings",
    eyebrow:"AI STUDY ASSISTANT", heroTitle:"Your problem.<br><em>Solved.</em>",
    heroText:"Solve Math, Physics and Chemistry problems with clear, step-by-step explanations.",
    online:"Mathix AI is ready", auto:"Auto Detect", math:"Mathematics", physics:"Physics", chemistry:"Chemistry",
    inputPlaceholder:"Type your problem here...\n\nExample: Solve 2x + 5 = 17", upload:"Upload image", scan:"Scan with camera",
    solve:"Solve Problem", try:"Try:", back:"Back", solution:"SOLUTION", favorite:"Favorite", export:"Export",
    f1:"Scan anything", f1s:"Camera & image recognition", f2:"Step by step", f2s:"Understand, don't just copy",
    f3:"Arabic + English", f3s:"Switch language anytime", f4:"Export answers", f4s:"Save and share your work",
    historyTitle:"History", historyText:"Your recent solved problems appear here.",
    favoritesTitle:"Favorites", favoritesText:"Keep useful solutions close.", settingsTitle:"Settings",
    language:"Language", languageDesc:"Change the Mathix interface language.", theme:"Appearance",
    themeDesc:"Switch between light and dark mode.", cameraTitle:"Scan a problem",
    login:"Login", logout:"Logout", register:"Register", welcome:"Welcome back", createAccount:"Create account",
    dailyUsage:"Daily usage", dailyLimit:"Daily solving limit", account:"ACCOUNT", preferences:"PREFERENCES",
    typeOrImage:"Type a problem or upload an image", loginRequired:"Please login first to solve a problem.",
    cameraPermission:"Please allow camera access in your browser.", cameraUnavailable:"Camera is not available on this device/browser.",
    cameraReady:"Point the camera at the problem and capture it.", photoCaptured:"Photo captured — press Solve Problem",
    imageLoaded:"Image loaded — press Solve Problem", cameraNotReady:"Camera is not ready yet.",
    noHistory:"No solved problems yet", startFirst:"Solve your first problem to see it here.",
    noFavorites:"No favorites yet", saveUseful:"Save useful solutions from the result page.",
    passwords:"Passwords are securely hashed on the server.", name:"Name", email:"Email", password:"Password",
    namePlaceholder:"Your name", emailPlaceholder:"you@example.com", passwordPlaceholder:"At least 8 characters",
    invalidImage:"Please choose a valid image.", imageTooLarge:"This image is too large. Please choose a smaller image.",
    dailyLimitReached:"Daily limit reached. Please try again tomorrow.", solverError:"Something went wrong while solving.",
    added:"Added to favorites", removed:"Removed from favorites"
  },
  ar: {
    navSolve:"حل", navHistory:"السجل", navFavorites:"المفضلة", navDashboard:"لوحة التحكم", navSettings:"الإعدادات",
    eyebrow:"مساعد دراسة بالذكاء الاصطناعي", heroTitle:"مسألتك.<br><em>محلولة.</em>",
    heroText:"حل مسائل الرياضيات والفيزياء والكيمياء بشرح واضح خطوة بخطوة.",
    online:"Mathix AI جاهز", auto:"اكتشاف تلقائي", math:"رياضيات", physics:"فيزياء", chemistry:"كيمياء",
    inputPlaceholder:"اكتب المسألة هنا...\n\nمثال: حل 2x + 5 = 17", upload:"رفع صورة", scan:"التصوير بالكاميرا",
    solve:"حل المسألة", try:"جرب:", back:"رجوع", solution:"الحل", favorite:"المفضلة", export:"تصدير",
    f1:"صوّر أي مسألة", f1s:"كاميرا وقراءة الصور", f2:"خطوة بخطوة", f2s:"افهم الحل، مش مجرد الإجابة",
    f3:"عربي + English", f3s:"غيّر اللغة في أي وقت", f4:"تصدير الحل", f4s:"احفظ وشارك حلك",
    historyTitle:"السجل", historyText:"هتلاقي هنا المسائل اللي حليتها مؤخرًا.",
    favoritesTitle:"المفضلة", favoritesText:"احتفظ بالحلول المهمة.", settingsTitle:"الإعدادات",
    language:"اللغة", languageDesc:"غيّر لغة واجهة Mathix.", theme:"المظهر",
    themeDesc:"بدّل بين الوضع الفاتح والداكن.", cameraTitle:"صوّر المسألة",
    login:"تسجيل الدخول", logout:"تسجيل الخروج", register:"إنشاء حساب", welcome:"أهلًا بيك", createAccount:"إنشاء حساب جديد",
    dailyUsage:"الاستخدام اليومي", dailyLimit:"الحد اليومي للحل", account:"الحساب", preferences:"التفضيلات",
    typeOrImage:"اكتب المسألة أو ارفع صورة", loginRequired:"سجّل الدخول أولًا عشان تحل المسألة.",
    cameraPermission:"اسمح للمتصفح باستخدام الكاميرا.", cameraUnavailable:"الكاميرا غير متاحة على الجهاز أو المتصفح.",
    cameraReady:"وجّه الكاميرا للمسألة واضغط التصوير.", photoCaptured:"تم التقاط الصورة — اضغط حل المسألة",
    imageLoaded:"تم تحميل الصورة — اضغط حل المسألة", cameraNotReady:"الكاميرا لسه مش جاهزة.",
    noHistory:"لا توجد مسائل حتى الآن", startFirst:"ابدأ بحل أول مسألة.",
    noFavorites:"المفضلة فارغة", saveUseful:"احفظ أي حل مهم من صفحة النتيجة.",
    passwords:"كلمات المرور يتم تشفيرها بشكل آمن على السيرفر.", name:"الاسم", email:"البريد الإلكتروني", password:"كلمة المرور",
    namePlaceholder:"اسمك", emailPlaceholder:"you@example.com", passwordPlaceholder:"8 أحرف على الأقل",
    invalidImage:"من فضلك اختر صورة صحيحة.", imageTooLarge:"الصورة كبيرة جدًا. اختر صورة أصغر.",
    dailyLimitReached:"وصلت للحد اليومي. جرّب بكرة.", solverError:"حصل خطأ أثناء حل المسألة.",
    added:"تمت الإضافة للمفضلة", removed:"تمت الإزالة من المفضلة"
  }
};

const t = () => translations[state.lang];

function applyLanguage() {
  const tr = t();
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
  $$('[data-i18n]').forEach((el) => {
    const value = tr[el.dataset.i18n];
    if (value !== undefined) el.innerHTML = value;
  });
  $$('[data-i18n-placeholder]').forEach((el) => {
    const value = tr[el.dataset.i18nPlaceholder];
    if (value !== undefined) el.placeholder = value;
  });
  $("#langBtn").textContent = state.lang === "ar" ? "English" : "العربية";
  $("#settingsLang").textContent = state.lang === "ar" ? "English" : "العربية";
  applyAuthTexts();
  if (state.current) renderResult(state.current);
}

function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
  $("#themeBtn").textContent = state.theme === "dark" ? "☀" : "☾";
  $("#settingsTheme").textContent = state.theme === "dark" ? "☀" : "☾";
}

function showView(name) {
  if (name === "dashboard" && !currentUser) return authOpen("login");
  $$(".view").forEach((v) => v.classList.remove("active-view"));
  $("#" + name + "View")?.classList.add("active-view");
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  if (name === "history") renderHistory();
  if (name === "favorites") renderFavorites();
  if (name === "dashboard") loadDashboard();
  $(".sidebar")?.classList.remove("open");
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function normalizeSolution(raw) {
  const s = raw?.solution || raw;
  if (!s) return null;
  return {
    ...s,
    id: s.id,
    created: s.created || s.created_at || new Date().toISOString(),
    steps: Array.isArray(s.steps) ? s.steps.map((step) => Array.isArray(step) ? step : [step.title || "Step", step.explanation || "", step.formula || ""]) : [],
    favorite: Boolean(s.favorite),
    note: s.note || ""
  };
}

async function api(path, options = {}) {
  const headers = { ...(options.body ? {"Content-Type":"application/json"} : {}), ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      authToken = "";
      currentUser = null;
      localStorage.removeItem("mathixToken");
      authUI();
    }
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function authUI() {
  $("#authBtn").textContent = currentUser ? t().logout : t().login;
  $("#avatarBtn").textContent = currentUser ? (currentUser.name || "U").trim().charAt(0).toUpperCase() : "?";
}

function applyAuthTexts() {
  $("#loginTab").textContent = t().login;
  $("#registerTab").textContent = t().register;
  $("#authTitle").textContent = authMode === "login" ? t().welcome : t().createAccount;
  $("#authSubmit").textContent = authMode === "login" ? t().login : t().register;
  $("#nameInput").placeholder = t().namePlaceholder;
  $("#emailInput").placeholder = t().emailPlaceholder;
  $("#passwordInput").placeholder = t().passwordPlaceholder;
  $("#authNote").textContent = t().passwords;
  authUI();
}

function authOpen(mode = "login") {
  authMode = mode;
  $("#authModal").classList.remove("hidden");
  $("#nameField").classList.toggle("hidden", mode !== "register");
  $("#nameInput").required = mode === "register";
  $("#loginTab").classList.toggle("active", mode === "login");
  $("#registerTab").classList.toggle("active", mode === "register");
  applyAuthTexts();
  $("#emailInput").focus();
}

function authClose() { $("#authModal").classList.add("hidden"); }

async function refreshAccountData() {
  if (!authToken) return;
  try {
    currentUser = (await api("/api/me")).user;
    const data = await api("/api/history");
    state.history = (data.history || []).map(normalizeSolution);
    state.favorites = state.history.filter((x) => x.favorite);
    renderHistory();
    renderFavorites();
    authUI();
  } catch (error) {
    authToken = "";
    currentUser = null;
    localStorage.removeItem("mathixToken");
    authUI();
  }
}

async function loadDashboard() {
  if (!currentUser) return authOpen("login");
  try {
    const data = await api("/api/dashboard");
    const used = Number(data.usage?.used || 0);
    const limit = Number(data.usage?.limit || 1);
    const percent = Math.min(100, Math.round((used / limit) * 100));
    $("#dashboardContent").innerHTML = `
      <div class="plan-grid">
        <div class="dash-card">
          <h3>${escapeHtml(data.user.name)}</h3>
          <p>${escapeHtml(data.user.email)}</p>
          <div class="usage-row"><span>${t().dailyUsage}</span><strong>${used} / ${limit}</strong></div>
          <div class="usage-bar"><div class="usage-fill" style="width:${percent}%"></div></div>
          <small class="usage-note">${t().dailyLimit}</small>
        </div>
        <div class="dash-card">
          <h3>Mathix</h3>
          <div class="dash-stat-grid">
            <div class="dash-stat"><strong>${data.stats.totalSolved}</strong><span>Solved</span></div>
            <div class="dash-stat"><strong>${data.stats.favorites}</strong><span>Favorites</span></div>
            <div class="dash-stat"><strong>${data.stats.today}</strong><span>Today</span></div>
          </div>
        </div>
      </div>`;
  } catch (error) { toast(error.message); }
}

async function fileToDataUrl(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error(t().invalidImage);
  if (file.size > 8 * 1024 * 1024) throw new Error(t().imageTooLarge);
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return optimizeImage(source);
}

async function optimizeImage(dataUrl) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
  const max = 1800;
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function setPreview(dataUrl, name) {
  if (state.imageObjectUrl) {
    URL.revokeObjectURL(state.imageObjectUrl);
    state.imageObjectUrl = null;
  }
  state.imageData = dataUrl;
  $("#previewImg").src = dataUrl;
  $("#imageName").textContent = name;
  $("#imagePreview").classList.remove("hidden");
}

function clearImage() {
  state.imageData = null;
  $("#imageInput").value = "";
  $("#previewImg").removeAttribute("src");
  $("#imagePreview").classList.add("hidden");
  $("#imageName").textContent = "";
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    toast(t().cameraUnavailable);
    return;
  }
  $("#cameraModal").classList.remove("hidden");
  $("#cameraStatus").textContent = t().cameraReady;
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });
    const video = $("#cameraVideo");
    video.srcObject = state.stream;
    await video.play();
  } catch (error) {
    console.error(error);
    $("#cameraStatus").textContent = error?.name === "NotAllowedError" ? t().cameraPermission : t().cameraUnavailable;
  }
}

function closeCamera() {
  if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  const video = $("#cameraVideo");
  video.pause();
  video.srcObject = null;
  $("#cameraModal").classList.add("hidden");
}

async function captureCamera() {
  const video = $("#cameraVideo");
  const canvas = $("#cameraCanvas");
  if (!video.videoWidth || !video.videoHeight) {
    toast(t().cameraNotReady);
    return;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d", { alpha: false }).drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  try {
    setPreview(await optimizeImage(dataUrl), "camera-scan.jpg");
    closeCamera();
    toast(t().photoCaptured);
  } catch (error) {
    console.error(error);
    toast(t().solverError);
  }
}

async function solveProblem() {
  if (!currentUser) {
    authOpen("login");
    toast(t().loginRequired);
    return;
  }
  const problem = $("#problemInput").value.trim();
  if (!problem && !state.imageData) {
    toast(t().typeOrImage);
    return;
  }
  if (state.solving) return;

  state.solving = true;
  const button = $("#solveBtn");
  const old = button.innerHTML;
  button.disabled = true;
  button.innerHTML = state.lang === "ar" ? "⏳ جاري الحل..." : "⏳ Solving...";

  try {
    const data = await api("/api/solve", {
      method: "POST",
      body: JSON.stringify({ problem, subject: state.subject, language: state.lang, imageData: state.imageData || null })
    });
    state.current = normalizeSolution(data.solution);
    state.history = [state.current, ...state.history.filter((x) => String(x.id) !== String(state.current.id))].slice(0, 100);
    state.favorites = state.history.filter((x) => x.favorite);
    renderResult(state.current);
    showView("result");
    if (data.usage) toast(`${data.usage.used} / ${data.usage.limit} ${t().dailyUsage}`);
  } catch (error) {
    console.error(error);
    toast(error.message || t().solverError);
  } finally {
    state.solving = false;
    button.disabled = false;
    button.innerHTML = old;
  }
}

function renderResult(solution) {
  if (!solution) return;
  const labels = state.lang === "ar" ? {answer:"الإجابة النهائية",steps:"الحل خطوة بخطوة",check:"ملاحظة"} : {answer:"FINAL ANSWER",steps:"STEP-BY-STEP",check:"NOTE"};
  const steps = solution.steps || [];
  $("#resultTitle").textContent = solution.title || (state.lang === "ar" ? "الحل" : "Solution");
  $("#resultContent").innerHTML = `
    <div class="solution-card answer-card"><div class="answer-label">${labels.answer}</div><div class="final-answer">${escapeHtml(solution.answer)}</div></div>
    <div class="solution-card"><div class="answer-label">${labels.steps}</div>
      ${steps.map((s, i) => `<div class="step"><div class="step-num">${i + 1}</div><div><h4>${escapeHtml(s[0])}</h4><p>${escapeHtml(s[1])}</p><div class="formula">${escapeHtml(s[2])}</div></div></div>`).join("")}
    </div>
    <div class="solution-card"><div class="answer-label">${labels.check}</div><p style="margin:8px 0 0;color:var(--muted);font-size:13px;line-height:1.7">${escapeHtml(solution.note)}</p></div>`;
  $("#favoriteBtn").innerHTML = (solution.favorite ? "♥ " : "♡ ") + t().favorite;
}

async function toggleFavorite() {
  if (!state.current || !currentUser) return authOpen("login");
  try {
    const data = await api(`/api/solutions/${encodeURIComponent(state.current.id)}/favorite`, { method: "POST" });
    state.current.favorite = data.favorite;
    state.history = state.history.map((x) => String(x.id) === String(state.current.id) ? state.current : x);
    state.favorites = state.history.filter((x) => x.favorite);
    renderResult(state.current);
    toast(data.favorite ? t().added : t().removed);
  } catch (error) { toast(error.message); }
}

function renderHistory() {
  const box = $("#historyList");
  if (!state.history.length) {
    box.innerHTML = `<div class="history-item"><div class="hi-main"><strong>${t().noHistory}</strong><small>${t().startFirst}</small></div></div>`;
    return;
  }
  box.innerHTML = state.history.map((x) => `<button class="history-item" style="text-align:${state.lang === "ar" ? "right" : "left"};cursor:pointer;color:inherit" data-id="${escapeHtml(x.id)}"><div class="hi-main"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.subject)} · ${new Date(x.created).toLocaleString()}</small></div><span>→</span></button>`).join("");
  $$("#historyList [data-id]").forEach((button) => button.addEventListener("click", () => {
    state.current = state.history.find((x) => String(x.id) === button.dataset.id);
    renderResult(state.current);
    showView("result");
  }));
}

function renderFavorites() {
  const box = $("#favoritesList");
  if (!state.favorites.length) {
    box.innerHTML = `<div class="history-item"><div class="hi-main"><strong>${t().noFavorites}</strong><small>${t().saveUseful}</small></div></div>`;
    return;
  }
  box.innerHTML = state.favorites.map((x) => `<button class="history-item" style="text-align:${state.lang === "ar" ? "right" : "left"};cursor:pointer;color:inherit" data-id="${escapeHtml(x.id)}"><div class="hi-main"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.answer)}</small></div><span>♥</span></button>`).join("");
  $$("#favoritesList [data-id]").forEach((button) => button.addEventListener("click", () => {
    state.current = state.favorites.find((x) => String(x.id) === button.dataset.id);
    renderResult(state.current);
    showView("result");
  }));
}

async function submitAuth(event) {
  event.preventDefault();
  const body = { email: $("#emailInput").value.trim(), password: $("#passwordInput").value };
  if (authMode === "register") body.name = $("#nameInput").value.trim();
  const submit = $("#authSubmit");
  submit.disabled = true;
  try {
    const data = await api(authMode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify(body) });
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem("mathixToken", authToken);
    authClose();
    authUI();
    await refreshAccountData();
    toast(state.lang === "ar" ? "تم تسجيل الدخول" : "Logged in");
  } catch (error) {
    toast(error.message);
  } finally {
    submit.disabled = false;
  }
}

function logout() {
  if (state.stream) closeCamera();
  authToken = "";
  currentUser = null;
  state.history = [];
  state.favorites = [];
  localStorage.removeItem("mathixToken");
  authUI();
  showView("solver");
  toast(state.lang === "ar" ? "تم تسجيل الخروج" : "Logged out");
}

$$('.nav-item').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$("#mobileMenu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
$$('.subject').forEach((button) => button.addEventListener('click', () => {
  $$('.subject').forEach((x) => x.classList.remove('active'));
  button.classList.add('active');
  state.subject = button.dataset.subject;
}));
$$('.examples button').forEach((button) => button.addEventListener('click', () => { $("#problemInput").value = button.dataset.example; $("#problemInput").focus(); }));
$("#langBtn").addEventListener("click", () => { state.lang = state.lang === "en" ? "ar" : "en"; localStorage.setItem("mathixLang", state.lang); applyLanguage(); });
$("#settingsLang").addEventListener("click", () => { state.lang = state.lang === "en" ? "ar" : "en"; localStorage.setItem("mathixLang", state.lang); applyLanguage(); });
$("#themeBtn").addEventListener("click", () => { state.theme = state.theme === "light" ? "dark" : "light"; localStorage.setItem("mathixTheme", state.theme); applyTheme(); });
$("#settingsTheme").addEventListener("click", () => { state.theme = state.theme === "light" ? "dark" : "light"; localStorage.setItem("mathixTheme", state.theme); applyTheme(); });
$("#imageInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    setPreview(await fileToDataUrl(file), file.name);
    toast(t().imageLoaded);
  } catch (error) {
    clearImage();
    toast(error.message);
  }
});
$("#removeImage").addEventListener("click", clearImage);
$("#cameraBtn").addEventListener("click", openCamera);
$("#closeCamera").addEventListener("click", closeCamera);
$("#captureBtn").addEventListener("click", captureCamera);
$("#cameraModal").addEventListener("click", (event) => { if (event.target.id === "cameraModal") closeCamera(); });
$("#solveBtn").addEventListener("click", solveProblem);
$("#backBtn").addEventListener("click", () => showView("solver"));
$("#favoriteBtn").addEventListener("click", toggleFavorite);
$("#printBtn").addEventListener("click", () => window.print());
$("#authBtn").addEventListener("click", () => currentUser ? logout() : authOpen("login"));
$("#avatarBtn").addEventListener("click", () => currentUser ? showView("dashboard") : authOpen("login"));
$("#closeAuth").addEventListener("click", authClose);
$("#authModal").addEventListener("click", (event) => { if (event.target.id === "authModal") authClose(); });
$("#loginTab").addEventListener("click", () => authOpen("login"));
$("#registerTab").addEventListener("click", () => authOpen("register"));
$("#authForm").addEventListener("submit", submitAuth);

window.addEventListener("beforeunload", () => { if (state.stream) state.stream.getTracks().forEach((track) => track.stop()); });

aapply: {
  applyLanguage();
  applyTheme();
  applyAuthTexts();
  renderHistory();
  renderFavorites();
  refreshAccountData();
}
