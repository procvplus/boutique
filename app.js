const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== Photo produit (servie par Marque Online, rendue en canvas) ===== */
function drawPhoto(cv, P, cssH){
  const img = new Image(); img.decoding = "async";
  img.onload = () => {
    let cr = P.crop || [0, 0, 1, 1]; if (Math.max(...cr) <= 1) cr = [cr[0] * img.naturalWidth, cr[1] * img.naturalHeight, cr[2] * img.naturalWidth, cr[3] * img.naturalHeight];
    const [x0, y0, x1, y1] = cr, w = x1 - x0, h = y1 - y0;
    const scale = Math.min(2.5, (cssH * Math.min(devicePixelRatio || 1, 2)) / h) || 1;
    cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
    cv.style.aspectRatio = w + " / " + h;
    const c = cv.getContext("2d"); c.imageSmoothingQuality = "high";
    c.filter = "contrast(1.05) saturate(1.07)";
    c.drawImage(img, x0, y0, w, h, 0, 0, cv.width, cv.height);
    c.filter = "none";
    if (P.patch) { /* efface un élément gênant en recopiant le fond du côté opposé */
      const [pw, ph, fx, fy] = P.patch, t = document.createElement("canvas");
      t.width = Math.round(pw * scale); t.height = Math.round(ph * scale);
      const tc = t.getContext("2d");
      tc.translate(t.width, 0); tc.scale(-1, 1);
      tc.filter = "contrast(1.05) saturate(1.07)";
      tc.drawImage(img, x1 - pw, y0, pw, ph, 0, 0, t.width, t.height);
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.filter = "none";
      tc.globalCompositeOperation = "destination-in";
      const gx = tc.createLinearGradient(0, 0, t.width, 0); gx.addColorStop(fx, "#000"); gx.addColorStop(1, "rgba(0,0,0,0)");
      tc.fillStyle = gx; tc.fillRect(0, 0, t.width, t.height);
      const gy = tc.createLinearGradient(0, 0, 0, t.height); gy.addColorStop(fy, "#000"); gy.addColorStop(1, "rgba(0,0,0,0)");
      tc.fillStyle = gy; tc.fillRect(0, 0, t.width, t.height);
      c.drawImage(t, 0, 0);
    }
    cv.closest(".photo-card, .pic")?.classList.add("ready");
  };
  img.src = P.src;
}
document.querySelectorAll("canvas[data-photo]").forEach(cv => drawPhoto(cv, PHOTO, cv.dataset.photo === "mini" ? 54 : 420));

(function(){
  const card = $("photoCard"), stage = $("stage"); if (!card || reduce) return;
  let t;
  stage.addEventListener("pointermove", e => { const r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    card.classList.add("live"); card.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 16}deg) translateY(-6px)`;
    clearTimeout(t); t = setTimeout(() => { card.style.transform = ""; card.classList.remove("live"); }, 1600); });
})();

/* ===== Avant / Après : densité des cheveux (illustration) ===== */
if (BA_MODE === "hair") (function(){
  const box = $("ba"), cb = $("baBefore"), ca = $("baAfter"), range = $("baRange");
  function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function draw(cv, before){
    const r = box.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    const W = Math.round(r.width), H = Math.round(r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const u = W / 400, cx = W / 2, cy = H * .52, rx = 175 * u, ry = 215 * u;
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#F3E7DF"); bg.addColorStop(1, "#E2CFC3");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    /* cuir chevelu */
    const sg = c.createRadialGradient(cx, cy - 40 * u, 10 * u, cx, cy, ry);
    sg.addColorStop(0, "#EBC3A6"); sg.addColorStop(1, "#C9977A");
    c.fillStyle = sg; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
    if (!before) { c.fillStyle = "#3B2416"; c.fillRect(0, 0, W, H); }
    const R = rng(before ? 7 : 11), N = before ? 230 : 900, part = before ? 9 * u : 3 * u;
    c.lineCap = "round";
    for (let i = 0; i < N; i++) {
      const side = i % 2 ? 1 : -1;
      const y = cy - ry + R() * ry * 2;
      const span = Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) * rx;
      const x0 = cx + side * (part + R() * 4 * u);
      const x1 = cx + side * (span + 20 * u);
      const y1 = y + (R() - .3) * 70 * u;
      const shade = before ? 40 + R() * 25 : 30 + R() * 35;
      c.strokeStyle = `hsla(22, 45%, ${shade}%, ${before ? .75 : .9})`;
      c.lineWidth = (before ? 1.1 : 2.1) * u;
      c.beginPath(); c.moveTo(x0, y);
      c.bezierCurveTo(x0 + side * 40 * u, y - 10 * u, x1 - side * 60 * u, y1 + 10 * u, x1, y1); c.stroke();
    }
    if (!before) { /* reflet brillant */
      c.globalCompositeOperation = "screen"; c.filter = `blur(${22 * u}px)`; c.fillStyle = "rgba(255,214,170,.28)";
      c.beginPath(); c.ellipse(cx - 60 * u, cy - 80 * u, 60 * u, 120 * u, -.4, 0, Math.PI * 2); c.fill();
      c.filter = "none"; c.globalCompositeOperation = "source-over";
    }
    c.restore();
  }
  function paint(){ draw(cb, true); draw(ca, false); }
  const setPos = v => box.style.setProperty("--pos", v + "%");
  range.addEventListener("input", () => setPos(range.value));
  paint(); setPos(50);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(paint, 150); });
  if (!reduce) {
    let shown = false; const h = box.querySelector(".handle");
    new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || shown) return; shown = true;
      const seq = [50, 25, 75, 50]; let i = 0;
      h.style.transition = "left .6s"; cb.style.transition = "clip-path .6s";
      const step = () => { if (i >= seq.length) { setTimeout(() => { h.style.transition = ""; cb.style.transition = ""; }, 700); return; } range.value = seq[i]; setPos(seq[i++]); setTimeout(step, 650); };
      setTimeout(step, 300);
    }, { threshold: .5 }).observe(box);
  }
})();

/* ===== cartes 3D inclinables ===== */
if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
  document.querySelectorAll(".card").forEach(c => {
    c.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`; });
    c.addEventListener("pointerleave", () => { c.style.transform = ""; });
  });
}

/* ===== formulaire → Marque Online (affilié 7644) ===== */
function normPhone(v){ let d = v.replace(/\D/g, ""); if (d.startsWith("212")) d = "0" + d.slice(3); return d; }
function setErr(id, msg){ const f = $(id); f.classList.toggle("bad", !!msg); f.querySelector(".hint").textContent = msg || ""; }
$("orderForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("name").value.trim(), phone = normPhone($("phone").value), city = $("city").value.trim(), address = $("address").value.trim();
  let ok = true;
  setErr("f-name", name.length >= 3 ? "" : (ok = false, "يرجى كتابة الاسم الكامل"));
  setErr("f-phone", /^0[5-7]\d{8}$/.test(phone) ? "" : (ok = false, "يجب أن يتكوّن الرقم من 10 أرقام ويبدأ بـ 06 أو 07"));
  setErr("f-city", city.length >= 2 ? "" : (ok = false, "يرجى كتابة المدينة"));
  setErr("f-address", address.length >= 5 ? "" : (ok = false, "يرجى كتابة العنوان الكامل"));
  if (!ok) { document.querySelector(".field.bad input").focus(); return; }
  const btn = $("submitBtn"); btn.disabled = true; btn.textContent = "جارٍ الإرسال…";
  const fd = new FormData();
  fd.append("Nom", name); fd.append("Téléphone", phone); fd.append("Ville", city); fd.append("Adresse", address);
  fd.append("slug", PRODUCT.slug); fd.append("aff_ref", PRODUCT.affRef);
  try { await fetch(ORDER_ENDPOINT, { method: "POST", mode: "no-cors", body: fd }); }
  catch (err) { btn.disabled = false; btn.textContent = BTN_LABEL; setErr("f-phone", "تعذّر إرسال الطلب، يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة"); return; }
  /* Meta Pixel (sur l'hébergement final) : if (window.fbq) fbq('track','Lead',{value:PRODUCT.price,currency:'MAD'}); */
  $("orderForm").hidden = true; $("thanksPhone").textContent = phone; $("thanks").hidden = false;
  $("thanks").scrollIntoView({ behavior: "smooth", block: "center" });
});
