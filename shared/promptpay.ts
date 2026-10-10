// สร้างข้อมูล QR พร้อมเพย์ (มาตรฐาน EMVCo / Thai QR) พร้อมยอดเงิน
const f = (id: string, v: string) => id + String(v.length).padStart(2, "0") + v;

function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** target: เบอร์มือถือ 10 หลัก / เลขบัตรประชาชนหรือเลขผู้เสียภาษี 13 หลัก / e-wallet 15 หลัก */
export function promptPayPayload(target: string, amount?: number) {
  const t = target.replace(/\D/g, "");
  const acct = t.length >= 15 ? f("03", t) : t.length >= 13 ? f("02", t) : f("01", ("0000000000000" + t.replace(/^0/, "66")).slice(-13));
  let p = f("00", "01") + f("01", amount ? "12" : "11") + f("29", f("00", "A000000677010111") + acct) + f("58", "TH") + f("53", "764");
  if (amount) p += f("54", amount.toFixed(2));
  p += "6304";
  return p + crc16(p);
}
