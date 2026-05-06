/**
 * Renders a DOM element into a multi-page A4 PDF and triggers a download.
 * jsPDF and html2canvas are dynamically imported so they're only loaded on demand.
 */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const [{ jsPDF }, html2canvasMod] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasMod.default;

  el.classList.add("pdf-export-mode");
  await new Promise((r) => setTimeout(r, 50));
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: 794,
      height: el.scrollHeight,
      windowWidth: 794,
    });
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const img = canvas.toDataURL("image/png");

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(img, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(img, "PNG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(filename);
  } finally {
    el.classList.remove("pdf-export-mode");
  }
}

export const isMobileDevice = () =>
  typeof window !== "undefined" && window.innerWidth < 768;
