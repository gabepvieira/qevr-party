const QA_SESSION_KEY = "qevr.qa.enabled";
const QA_DB_NAME = "qevr.qa.feedback.v1";
const QA_STORE_NAME = "entries";

export function shouldEnableQa(search, sessionValue) {
  const mode = new URLSearchParams(search || "").get("qa");
  if (mode === "0") return false;
  if (mode === "1") return true;
  return sessionValue === "1";
}

export function createEntry(input) {
  const number = Math.max(1, Number(input.number) || 1);
  return {
    id: `GP-${String(number).padStart(2, "0")}`,
    number,
    kind: input.kind || "broken",
    saw: String(input.saw || "").trim(),
    want: String(input.want || "").trim(),
    page: input.page || "/",
    url: input.url || "",
    point: input.point || null,
    element: input.element || null,
    environment: input.environment || {},
    screenshot: input.screenshot || null,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function kindLabel(kind) {
  return String(kind || "note").replace(/-/g, " ").toUpperCase();
}

export function buildMarkdown(entries) {
  const lines = [
    `# QIQI QA REPORT — ${entries.length} ITEM${entries.length === 1 ? "" : "S"}`,
    "",
  ];
  for (const entry of entries) {
    lines.push(`## ${entry.id} — ${kindLabel(entry.kind)}`);
    lines.push(`- Page: ${entry.page}`);
    if (entry.url) lines.push(`- URL: ${entry.url}`);
    if (entry.element) {
      lines.push(`- Component: ${entry.element.selector || entry.element.tag || "unknown"}`);
      if (entry.element.text) lines.push(`- Component text: ${entry.element.text}`);
    }
    if (entry.point) {
      lines.push(`- Point: viewport ${entry.point.x},${entry.point.y} · document ${entry.point.docX},${entry.point.docY}`);
    }
    const env = entry.environment || {};
    lines.push(
      `- Environment: viewport ${env.viewport || "unknown"} · visual viewport ${env.visualViewport || "unknown"} · DPR ${env.dpr || "unknown"}`,
    );
    if (env.browser) lines.push(`- Browser: ${env.browser}`);
    if (env.userAgent) lines.push(`- User agent: ${env.userAgent}`);
    if (entry.saw) lines.push(`- Saw: ${entry.saw}`);
    if (entry.want) lines.push(`- Want: ${entry.want}`);
    if (entry.screenshot) lines.push(`- Screenshot: ${entry.screenshot.name}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function buildReportFile(entries, meta = {}) {
  return JSON.stringify(
    {
      schema: "qevr-qa-report/v1",
      createdAt: new Date().toISOString(),
      ...meta,
      markdown: buildMarkdown(entries),
      entries,
    },
    null,
    2,
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trimSnippet(value, max = 90) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function cssEscape(value) {
  if (globalThis.CSS?.escape) return globalThis.CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function selectorFor(element) {
  if (!element || element.nodeType !== 1) return "unknown";
  if (element.id) return `#${cssEscape(element.id)}`;
  const testId = element.getAttribute("data-testid");
  if (testId) return `[data-testid="${cssEscape(testId)}"]`;
  const aria = element.getAttribute("aria-label");
  if (aria) return `${element.tagName.toLowerCase()}[aria-label="${cssEscape(aria)}"]`;

  const parts = [];
  let node = element;
  while (node && node.nodeType === 1 && parts.length < 4) {
    let part = node.tagName.toLowerCase();
    const classes = Array.from(node.classList || []).slice(0, 2);
    if (classes.length) part += `.${classes.map(cssEscape).join(".")}`;
    if (node.parentElement) {
      const same = Array.from(node.parentElement.children).filter((child) => child.tagName === node.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

function captureElement(element) {
  if (!element || element.nodeType !== 1) return null;
  const rect = element.getBoundingClientRect();
  const data = {};
  for (const attribute of Array.from(element.attributes || [])) {
    if (attribute.name.startsWith("data-") && attribute.value) data[attribute.name] = trimSnippet(attribute.value, 50);
  }
  return {
    selector: selectorFor(element),
    tag: element.tagName,
    id: element.id || null,
    classes: Array.from(element.classList || []),
    ariaLabel: element.getAttribute("aria-label"),
    text: trimSnippet(element.textContent),
    data,
    rect: {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  };
}

function browserLabel() {
  const ua = navigator.userAgent || "";
  if (/CriOS/i.test(ua)) return "Chrome on iOS";
  if (/FxiOS/i.test(ua)) return "Firefox on iOS";
  if (/EdgiOS/i.test(ua)) return "Edge on iOS";
  if (/iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua)) return "Safari on iOS";
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Safari/i.test(ua)) return "Safari";
  if (/Firefox/i.test(ua)) return "Firefox";
  return "Unknown browser";
}

function environmentSnapshot() {
  const visual = window.visualViewport;
  return {
    viewport: `${Math.round(window.innerWidth)}×${Math.round(window.innerHeight)}`,
    visualViewport: visual ? `${Math.round(visual.width)}×${Math.round(visual.height)}` : "unavailable",
    screen: `${Math.round(window.screen.width)}×${Math.round(window.screen.height)}`,
    dpr: window.devicePixelRatio || 1,
    orientation: screen.orientation?.type || (innerWidth > innerHeight ? "landscape" : "portrait"),
    browser: browserLabel(),
    platform: navigator.platform || "unknown",
    language: document.documentElement.lang || navigator.language || "unknown",
    userAgent: navigator.userAgent || "unknown",
  };
}

function currentPage() {
  return `${location.pathname}${location.hash || ""}`;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QA_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(QA_STORE_NAME)) {
        request.result.createObjectStore(QA_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbRequest(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QA_STORE_NAME, mode);
    const request = action(tx.objectStore(QA_STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function loadEntries() {
  const entries = await dbRequest("readonly", (store) => store.getAll());
  return entries.sort((a, b) => a.number - b.number);
}

function saveEntry(entry) {
  return dbRequest("readwrite", (store) => store.put(entry));
}

function deleteEntry(id) {
  return dbRequest("readwrite", (store) => store.delete(id));
}

function clearEntries() {
  return dbRequest("readwrite", (store) => store.clear());
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function compressScreenshot(file) {
  const original = await readAsDataUrl(file);
  try {
    const image = new Image();
    image.src = original;
    await image.decode();
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      name: file.name || `qiqi-context-${Date.now()}.jpg`,
      type: "image/jpeg",
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL("image/jpeg", 0.78),
    };
  } catch {
    return { name: file.name || "context-image", type: file.type || "image/*", dataUrl: original };
  }
}

function qaStyles() {
  return `
    :host{all:initial;position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:"Space Mono",ui-monospace,monospace;color:#fff}
    *{box-sizing:border-box;border-radius:0!important}
    button,textarea,input{font:inherit}
    button{cursor:pointer;min-height:44px}
    .dock{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));display:flex;gap:6px;align-items:stretch;pointer-events:auto;filter:drop-shadow(4px 4px 0 #09090B)}
    .dock button{border:2px solid #CCFF00;background:#09090B;color:#CCFF00;padding:9px 12px;font-size:11px;font-weight:700;letter-spacing:.08em}
    .dock button.primary{background:#CCFF00;color:#09090B}
    .dock button.on{border-color:#FF007F;background:#FF007F;color:#fff}
    .capture{position:fixed;inset:0;display:none;pointer-events:auto;cursor:crosshair;background:rgba(204,255,0,.055)}
    .capture.open{display:block}
    .capture-banner{position:fixed;top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);max-width:calc(100vw - 24px);background:#09090B;border:2px solid #CCFF00;color:#CCFF00;padding:10px 14px;font-size:11px;font-weight:700;text-align:center;white-space:nowrap}
    .pin{position:fixed;width:28px;height:28px;display:grid;place-items:center;background:#FF007F;border:2px solid #fff;color:#fff;font-size:10px;font-weight:700;pointer-events:none;transform:translate(-50%,-50%);box-shadow:3px 3px 0 #09090B}
    .modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom));background:rgba(9,9,11,.94);pointer-events:auto}
    .modal.open{display:flex}
    .panel{width:min(620px,100%);max-height:100%;overflow:auto;background:#09090B;border:2px solid #CCFF00;box-shadow:6px 6px 0 #CCFF00;padding:16px}
    .panel.wide{width:min(920px,100%)}
    h2{margin:0 0 8px;color:#CCFF00;font-size:16px;letter-spacing:.08em}
    .sub{color:#9A9AA5;font-size:10px;line-height:1.55;overflow-wrap:anywhere}
    .selected{margin:12px 0;padding:9px;border-left:4px solid #FF007F;background:#141416;color:#fff;font-size:10px;line-height:1.5;overflow-wrap:anywhere}
    .kinds{display:grid;grid-template-columns:repeat(3,1fr);margin:12px 0}
    .kinds button{border:1px solid #27272A;background:#09090B;color:#9A9AA5;padding:8px;font-size:10px;font-weight:700}
    .kinds button.active{background:#FF007F;border-color:#FF007F;color:#fff}
    label.field{display:block;margin-top:12px;color:#CCFF00;font-size:10px;font-weight:700;letter-spacing:.08em}
    textarea{display:block;width:100%;min-height:82px;margin-top:6px;padding:10px;border:1px solid #27272A;background:#141416;color:#fff;font-size:14px;line-height:1.45;resize:vertical}
    .shot{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px}
    .shot-label{position:relative;display:grid;place-items:center;min-height:48px;border:1px dashed #FF007F;color:#FF007F;font-size:10px;font-weight:700;cursor:pointer}
    .shot-label input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
    .shot-preview{display:none;grid-template-columns:90px 1fr;gap:10px;align-items:center;padding:8px;border:1px solid #27272A}
    .shot-preview.on{display:grid}
    .shot-preview img{width:90px;height:68px;object-fit:cover;border:1px solid #FF007F}
    .shot-preview span{font-size:10px;overflow-wrap:anywhere}
    .actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:14px}
    .actions button{border:1px solid #525252;background:#09090B;color:#fff;padding:9px 12px;font-size:10px;font-weight:700}
    .actions button.save{border-color:#CCFF00;background:#CCFF00;color:#09090B}
    .actions button.pink{border-color:#FF007F;background:#FF007F;color:#fff}
    .entries{display:grid;gap:10px;margin-top:14px}
    .empty{padding:30px 10px;text-align:center;color:#9A9AA5;font-size:12px}
    .entry{display:grid;grid-template-columns:1fr auto;gap:10px;border:1px solid #27272A;padding:12px;background:#111114}
    .entry h3{margin:0 0 6px;color:#CCFF00;font-size:12px}
    .entry p{margin:4px 0;color:#fff;font-size:11px;line-height:1.55;text-transform:none}
    .entry .meta{color:#9A9AA5;font-size:9px;overflow-wrap:anywhere}
    .entry img{display:block;max-width:180px;max-height:150px;margin-top:8px;border:1px solid #FF007F}
    .entry .remove{align-self:start;min-height:36px;border:1px solid #FF007F;background:transparent;color:#FF007F;padding:6px 9px}
    .toast{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);display:none;max-width:calc(100vw - 24px);background:#CCFF00;color:#09090B;padding:10px 14px;font-size:10px;font-weight:700;pointer-events:none}
    .toast.on{display:block}
    @media(max-width:560px){.dock{left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));display:grid;grid-template-columns:1fr 1fr 1fr}.dock button{padding:8px 5px}.kinds{grid-template-columns:1fr}.panel{padding:13px}.actions{display:grid;grid-template-columns:1fr 1fr}.actions button{width:100%}.entry{grid-template-columns:1fr auto}}
  `;
}

async function bootQa() {
  let sessionValue = null;
  try {
    sessionValue = sessionStorage.getItem(QA_SESSION_KEY);
  } catch {}
  const params = new URLSearchParams(location.search);
  if (params.get("qa") === "0") {
    try { sessionStorage.removeItem(QA_SESSION_KEY); } catch {}
    return;
  }
  if (!shouldEnableQa(location.search, sessionValue)) return;
  try { sessionStorage.setItem(QA_SESSION_KEY, "1"); } catch {}

  const host = document.createElement("div");
  host.id = "qevr-qa-host";
  host.setAttribute("data-qevr-qa", "true");
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>${qaStyles()}</style>
    <div class="pins" id="pins"></div>
    <div class="capture" id="capture"><div class="capture-banner">TAP A COMPONENT · ESC TO CANCEL</div></div>
    <div class="dock" id="dock"></div>
    <div class="modal" id="modal"><div class="panel" id="panel"></div></div>
    <div class="toast" id="toast"></div>
  `;

  const $ = (selector) => root.querySelector(selector);
  const captureLayer = $("#capture");
  const dock = $("#dock");
  const modal = $("#modal");
  const panel = $("#panel");
  const pins = $("#pins");
  const toast = $("#toast");
  let entries = [];
  let picking = false;
  let toastTimer = 0;

  try {
    entries = await loadEntries();
  } catch {
    entries = [];
  }

  function flash(message) {
    toast.textContent = message;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("on"), 1800);
  }

  function nextNumber() {
    return entries.reduce((max, entry) => Math.max(max, entry.number || 0), 0) + 1;
  }

  function closeModal() {
    modal.classList.remove("open");
    panel.classList.remove("wide");
    panel.innerHTML = "";
    renderDock();
  }

  function stopPicking() {
    picking = false;
    captureLayer.classList.remove("open");
    renderDock();
  }

  function renderDock() {
    dock.innerHTML = `
      <button type="button" data-action="pick" class="${picking ? "on" : ""}">${picking ? "CANCEL" : "PICK"}</button>
      <button type="button" data-action="note">NOTE</button>
      <button type="button" data-action="list" class="primary">QA ${entries.length}</button>
    `;
    dock.querySelector('[data-action="pick"]').addEventListener("click", () => {
      picking = !picking;
      captureLayer.classList.toggle("open", picking);
      renderDock();
    });
    dock.querySelector('[data-action="note"]').addEventListener("click", () => openEditor(null, null));
    dock.querySelector('[data-action="list"]').addEventListener("click", openList);
  }

  function renderPins() {
    const page = currentPage();
    pins.innerHTML = entries
      .filter((entry) => entry.page === page && entry.point)
      .map((entry) => {
        const left = entry.point.docX - window.scrollX;
        const top = entry.point.docY - window.scrollY;
        return `<div class="pin" style="left:${left}px;top:${top}px">${escapeHtml(entry.number)}</div>`;
      })
      .join("");
  }

  async function storeEntry(entry) {
    entries.push(entry);
    entries.sort((a, b) => a.number - b.number);
    try { await saveEntry(entry); } catch { flash("SAVED FOR THIS OPEN PAGE ONLY"); }
    renderDock();
    renderPins();
  }

  function openEditor(element, point) {
    stopPicking();
    const captured = captureElement(element);
    let kind = "broken";
    let screenshot = null;
    panel.innerHTML = `
      <h2>${captured ? "LOG THIS COMPONENT" : "ADD AN OPEN LOOP"}</h2>
      <div class="sub">${escapeHtml(currentPage())} · ${escapeHtml(environmentSnapshot().browser)} · ${escapeHtml(environmentSnapshot().viewport)}</div>
      <div class="selected">${captured ? escapeHtml(`${captured.selector}${captured.text ? ` · ${captured.text}` : ""}`) : "NO COMPONENT SELECTED · PAGE-LEVEL NOTE"}</div>
      <div class="kinds">
        <button type="button" data-kind="broken" class="active">BROKEN</button>
        <button type="button" data-kind="seventh-mismatch">7TH MISMATCH</button>
        <button type="button" data-kind="new-idea">NEW IDEA</button>
      </div>
      <label class="field">WHAT I SAW / OPEN LOOP<textarea id="qaSaw" autofocus placeholder="Tell me what happened"></textarea></label>
      <label class="field">WHAT I WANT<textarea id="qaWant" placeholder="Tell me what should happen instead"></textarea></label>
      <div class="shot">
        <label class="shot-label"><input id="qaShot" type="file" accept="image/*">ADD SCREENSHOT FROM PHOTOS</label>
        <div class="shot-preview" id="qaShotPreview"><img alt="SCREENSHOT PREVIEW"><span></span></div>
      </div>
      <div class="actions"><button type="button" data-action="cancel">CANCEL</button><button type="button" data-action="save" class="save">SAVE GP-${String(nextNumber()).padStart(2, "0")}</button></div>
    `;
    modal.classList.add("open");
    panel.querySelectorAll("[data-kind]").forEach((button) => {
      button.addEventListener("click", () => {
        kind = button.dataset.kind;
        panel.querySelectorAll("[data-kind]").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      });
    });
    panel.querySelector('[data-action="cancel"]').addEventListener("click", closeModal);
    panel.querySelector("#qaShot").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const preview = panel.querySelector("#qaShotPreview");
      preview.querySelector("span").textContent = "PREPARING SCREENSHOT...";
      preview.classList.add("on");
      screenshot = await compressScreenshot(file);
      preview.querySelector("img").src = screenshot.dataUrl;
      preview.querySelector("span").textContent = `${screenshot.name}${screenshot.width ? ` · ${screenshot.width}×${screenshot.height}` : ""}`;
    });
    panel.querySelector('[data-action="save"]').addEventListener("click", async () => {
      const saw = panel.querySelector("#qaSaw").value.trim();
      const want = panel.querySelector("#qaWant").value.trim();
      if (!saw && !want) {
        panel.querySelector("#qaSaw").focus();
        flash("WRITE ONE LINE FIRST");
        return;
      }
      const entry = createEntry({
        number: nextNumber(),
        kind,
        saw,
        want,
        page: currentPage(),
        url: location.href,
        point,
        element: captured,
        environment: environmentSnapshot(),
        screenshot,
      });
      await storeEntry(entry);
      closeModal();
      flash(`${entry.id} SAVED`);
    });
    setTimeout(() => panel.querySelector("#qaSaw")?.focus(), 0);
  }

  function reportName() {
    return `qevr-qa-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  }

  function reportContents() {
    return buildReportFile(entries, {
      source: location.origin,
      exportedFrom: location.href,
    });
  }

  function makeReportFile() {
    return new File([reportContents()], reportName(), { type: "application/json" });
  }

  function downloadReport() {
    const file = makeReportFile();
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    flash("REPORT DOWNLOADED");
  }

  async function shareReport() {
    const file = makeReportFile();
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({ title: "QIQI QA REPORT", files: [file] });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    downloadReport();
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildMarkdown(entries));
      flash("TEXT COPIED");
    } catch {
      flash("COPY FAILED · DOWNLOAD THE REPORT");
    }
  }

  function openList() {
    panel.classList.add("wide");
    panel.innerHTML = `
      <h2>QIQI QA · ${entries.length}</h2>
      <div class="sub">PICK A COMPONENT OR ADD A PAGE NOTE. THE REPORT KEEPS THE DEVICE DATA AND THE ACTUAL SCREENSHOTS.</div>
      <div class="entries">${
        entries.length
          ? entries.map((entry) => `
            <article class="entry">
              <div>
                <h3>${escapeHtml(entry.id)} · ${escapeHtml(kindLabel(entry.kind))}</h3>
                <div class="meta">${escapeHtml(entry.page)} · ${escapeHtml(entry.environment?.browser || "unknown")} · ${escapeHtml(entry.environment?.viewport || "unknown")}</div>
                ${entry.element ? `<div class="meta">${escapeHtml(entry.element.selector)}</div>` : ""}
                ${entry.saw ? `<p><b>SAW</b> ${escapeHtml(entry.saw)}</p>` : ""}
                ${entry.want ? `<p><b>WANT</b> ${escapeHtml(entry.want)}</p>` : ""}
                ${entry.screenshot ? `<img src="${entry.screenshot.dataUrl}" alt="${escapeHtml(entry.screenshot.name)}"><div class="meta">${escapeHtml(entry.screenshot.name)}</div>` : ""}
              </div>
              <button type="button" class="remove" data-remove="${escapeHtml(entry.id)}">REMOVE</button>
            </article>`).join("")
          : `<div class="empty">NO NOTES YET · CLOSE THIS, TAP PICK, THEN TAP THE THING</div>`
      }</div>
      <div class="actions">
        <button type="button" data-action="close">CLOSE</button>
        <button type="button" data-action="copy">COPY TEXT</button>
        <button type="button" data-action="download">DOWNLOAD REPORT</button>
        <button type="button" data-action="share" class="save">SHARE REPORT</button>
        <button type="button" data-action="clear" class="pink">CLEAR ALL</button>
        <button type="button" data-action="stop">STOP QA</button>
      </div>
    `;
    modal.classList.add("open");
    panel.querySelector('[data-action="close"]').addEventListener("click", closeModal);
    panel.querySelector('[data-action="copy"]').addEventListener("click", copyText);
    panel.querySelector('[data-action="download"]').addEventListener("click", downloadReport);
    panel.querySelector('[data-action="share"]').addEventListener("click", shareReport);
    panel.querySelector('[data-action="clear"]').addEventListener("click", async () => {
      if (!confirm("CLEAR EVERY QA NOTE?")) return;
      entries = [];
      try { await clearEntries(); } catch {}
      renderPins();
      renderDock();
      openList();
    });
    panel.querySelector('[data-action="stop"]').addEventListener("click", () => {
      try { sessionStorage.removeItem(QA_SESSION_KEY); } catch {}
      const url = new URL(location.href);
      url.searchParams.delete("qa");
      history.replaceState(null, "", url);
      host.remove();
    });
    panel.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.remove;
        entries = entries.filter((entry) => entry.id !== id);
        try { await deleteEntry(id); } catch {}
        renderPins();
        renderDock();
        openList();
      });
    });
  }

  captureLayer.addEventListener("click", (event) => {
    if (!picking) return;
    captureLayer.style.pointerEvents = "none";
    const element = document.elementFromPoint(event.clientX, event.clientY);
    captureLayer.style.pointerEvents = "";
    const point = {
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      docX: Math.round(event.clientX + window.scrollX),
      docY: Math.round(event.clientY + window.scrollY),
    };
    openEditor(element, point);
  });

  window.addEventListener("scroll", renderPins, { passive: true });
  window.addEventListener("resize", renderPins);
  window.visualViewport?.addEventListener("resize", renderPins);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modal.classList.contains("open")) closeModal();
      else if (picking) stopPicking();
    }
  });

  renderDock();
  renderPins();
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  bootQa().catch((error) => console.error("[QIQI QA] failed", error));
}
