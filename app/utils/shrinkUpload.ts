// ย่อไฟล์ก่อนอัปโหลด (ผู้ใช้ไม่ต้องย่อเอง): รูปย่อขนาด/คุณภาพ, PDF ใหญ่แปลงหน้าเป็นภาพแล้วรวมเป็น PDF ใหม่
const TARGET = 1.5 * 1024 * 1024; // เป้าหมายต่อไฟล์ (ให้ไฟล์รวมผ่านขีดจำกัดของเซิร์ฟเวอร์)

const canvasToJpeg = (c: HTMLCanvasElement, q: number) => new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", q));

async function drawScaled(src: CanvasImageSource, w: number, h: number, maxSide: number) {
  const s = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * s);
  c.height = Math.round(h * s);
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export async function shrinkImage(file: File, target = TARGET): Promise<File> {
  if (file.size <= target && file.type === "image/jpeg") return file;
  const img = await createImageBitmap(file);
  for (const side of [2200, 1800, 1500, 1200, 1000]) {
    const c = await drawScaled(img, img.width, img.height, side);
    for (const q of [0.85, 0.75, 0.65]) {
      const b = await canvasToJpeg(c, q);
      if (b.size <= target || (side === 1000 && q === 0.65)) return new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
  }
  return file;
}

export async function shrinkPdf(file: File, target = TARGET): Promise<File> {
  if (file.size <= target) return file;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const { PDFDocument } = await import("pdf-lib");
  const src = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(src.numPages, 10);
  for (const [side, q] of [[1800, 0.75], [1400, 0.65], [1100, 0.55]] as const) {
    const out = await PDFDocument.create();
    for (let i = 1; i <= pages; i++) {
      const page = await src.getPage(i);
      const v = page.getViewport({ scale: 1 });
      const scale = side / Math.max(v.width, v.height);
      const vp = page.getViewport({ scale });
      const c = document.createElement("canvas");
      c.width = Math.round(vp.width);
      c.height = Math.round(vp.height);
      await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
      const jpg = await out.embedJpg(new Uint8Array(await (await canvasToJpeg(c, q)).arrayBuffer()));
      const pg = out.addPage([v.width, v.height]);
      pg.drawImage(jpg, { x: 0, y: 0, width: v.width, height: v.height });
    }
    const bytes = await out.save();
    if (bytes.length <= target || side === 1100) return new File([bytes], file.name, { type: "application/pdf" });
  }
  return file;
}

export async function shrinkForUpload(file: File, target = TARGET) {
  try {
    if (/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return await shrinkImage(file, target);
    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return await shrinkPdf(file, target);
  } catch (e) {
    console.warn("shrink failed", e);
  }
  return file;
}
