export const handlePrintHtmlToPDF = (html: string = "") => {
  // Create a full-screen overlay with an iframe for print preview
  const overlay = document.createElement("div");
  overlay.style.cssText = [
    "position:fixed", "inset:0", "z-index:99999",
    "display:flex", "flex-direction:column",
    "background:rgba(0,0,0,0.7)",
  ].join(";");

  // Toolbar
  const toolbar = document.createElement("div");
  toolbar.style.cssText = [
    "display:flex", "align-items:center", "justify-content:flex-end",
    "gap:8px", "padding:8px 16px",
    "background:#1e293b", "color:#f8fafc",
    "flex-shrink:0",
  ].join(";");

  const printBtn = document.createElement("button");
  printBtn.textContent = "🖨 Print / Save PDF";
  printBtn.style.cssText = [
    "padding:6px 14px", "border-radius:6px",
    "background:#3b82f6", "color:#fff",
    "border:none", "cursor:pointer", "font-size:13px",
  ].join(";");

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕ Close";
  closeBtn.style.cssText = [
    "padding:6px 14px", "border-radius:6px",
    "background:#475569", "color:#fff",
    "border:none", "cursor:pointer", "font-size:13px",
  ].join(";");

  toolbar.appendChild(printBtn);
  toolbar.appendChild(closeBtn);

  // iframe
  const iframe = document.createElement("iframe");
  iframe.style.cssText = [
    "flex:1", "border:none", "background:#fff",
    "width:100%",
  ].join(";");
  iframe.srcdoc = html;

  overlay.appendChild(toolbar);
  overlay.appendChild(iframe);
  document.body.appendChild(overlay);

  const close = () => {
    if (document.body.contains(overlay)) document.body.removeChild(overlay);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };

  closeBtn.addEventListener("click", close, { once: true });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); }, { once: true });
  printBtn.addEventListener("click", () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  });
  document.addEventListener("keydown", onKeyDown);
  // Clean up keydown listener when overlay is removed
  const observer = new MutationObserver(() => {
    if (!document.body.contains(overlay)) {
      document.removeEventListener("keydown", onKeyDown);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true });
}