/**
 * Opens the print-area content in a new window and triggers the native print dialog.
 * Works on iOS (Share → Print/Save to Files), Android (Print → Save as PDF), and desktop.
 */
export function printElement(el: HTMLElement, title: string) {
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) {
    // Fallback: append a temporary print container into the current document and call window.print()
    fallbackInPagePrint(el);
    return;
  }

  // Collect existing stylesheets from the host document (Tailwind, Inter font, etc.)
  const headStyles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((node) => node.outerHTML)
    .join("\n");

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
${headStyles}
<style>
  @page { size: A4; margin: 12mm; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body { padding: 16px; }
  .print-doc, .print-doc * {
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
    visibility: visible !important;
  }
  .print-doc { display: block !important; }
  .print-doc h1 { font-size: 18pt; font-weight: 700; margin: 0 0 6px; }
  .print-doc h2 { font-size: 14pt; font-weight: 700; margin: 12px 0 6px; }
  .print-doc p  { margin: 2px 0; font-size: 11pt; }
  .print-doc table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 9.5pt;
    line-height: 1.35;
    margin-bottom: 12px;
  }
  .print-doc th {
    text-align: left;
    font-weight: 700;
    font-size: 9pt;
    padding: 4px 8px;
    border-bottom: 1px solid #000;
    white-space: nowrap;
  }
  .print-doc td {
    padding: 4px 8px;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: break-word;
    border-bottom: 1px solid #ddd;
  }
  .print-doc th:first-child, .print-doc td:first-child { padding-left: 0; }
  .print-doc th:last-child,  .print-doc td:last-child  { padding-right: 0; }
  .print-doc .nowrap, .print-doc td.nowrap, .print-doc th.nowrap { white-space: nowrap; }
  .print-doc .text-right { text-align: right; }
  .print-doc .text-center { text-align: center; }
  .print-doc .font-bold, .print-doc strong { font-weight: 700; }
  .print-doc .border-b { border-bottom: 1px solid #888; }
  .print-doc .border-t-2 { border-top: 2px solid #000; }
  .print-doc .border { border: 1px solid #888; }
  .print-doc .mb-6 { margin-bottom: 18px; }
  .print-doc .mb-4 { margin-bottom: 12px; }
  .print-doc .mb-2 { margin-bottom: 6px; }
  .print-doc .pb-4 { padding-bottom: 12px; }
  .print-doc .pb-3 { padding-bottom: 9px; }
  .print-doc .mt-1 { margin-top: 3px; }
  .print-doc .text-xs { font-size: 8.5pt; }
  .print-doc .text-sm { font-size: 10pt; }
  .print-doc .text-lg { font-size: 13pt; }
  .print-doc .text-xl { font-size: 15pt; }
  .print-doc .text-2xl { font-size: 18pt; }
  .print-doc .italic { font-style: italic; }
  .print-doc .flex { display: flex; }
  .print-doc .justify-end { justify-content: flex-end; }
  .print-doc .space-y-6 > * + * { margin-top: 12px; }
  .print-actions {
    position: fixed;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 8px;
    z-index: 9999;
  }
  .print-actions button {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .print-actions .primary { background: #dc2626; color: white; }
  .print-actions .secondary { background: #e5e7eb; color: #111; }
  @media print {
    .print-actions { display: none !important; }
    body { padding: 0; }
  }
</style>
</head>
<body>
<div class="print-actions">
  <button class="primary" onclick="window.print()">Drucken / Als PDF</button>
  <button class="secondary" onclick="window.close()">Schließen</button>
</div>
<div class="print-doc">${el.innerHTML}</div>
<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      try { window.focus(); window.print(); } catch (e) {}
    }, 400);
  });
</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

function fallbackInPagePrint(el: HTMLElement) {
  el.classList.add("pdf-fallback-visible");
  const cleanup = () => {
    el.classList.remove("pdf-fallback-visible");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => window.print(), 100);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]!));
}

export const isMobileDevice = () =>
  typeof window !== "undefined" && window.innerWidth < 768;

// Backward-compat export (no longer used, but keep signature so callers compile)
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  printElement(el, filename.replace(/\.pdf$/i, ""));
}
