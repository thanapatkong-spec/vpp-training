/** ทำงานทีละ `size` รายการพร้อมกัน (เช่น ส่งอีเมลหลายฉบับโดยไม่ยิงพร้อมกันทั้งหมด) */
export async function inBatches<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}
