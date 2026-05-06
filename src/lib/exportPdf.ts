import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Renders a DOM element into a multi-page A4 PDF and triggers a download.
 * Designed for mobile devices where window.print() is unreliable.
 */
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  el.classList.add("pdf-export-mode");
  // Allow layout to flush
  await new Promise((r) => setTimeout(r, 50));
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: el.scrollWidth,
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
