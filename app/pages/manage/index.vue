<script setup lang="ts">
import { Paperclip } from "lucide-vue-next";
useHead({ title: "ระบบแอดมิน · VPP" });
const auth = useAuthClient();
const asset = useAsset();
const sessionState = auth.useSession(); // Ref<{ data, isPending, error }>
const session = computed(() => sessionState.value.data);
const isPending = computed(() => sessionState.value.isPending);

type Row = { id: string; fullName: string; cohort: string; completedOn: string | null; note: string | null; status: "pending" | "approved" | "rejected"; adminNote: string | null; createdAt: string; email: string; accountName: string };
const rows = ref<Row[]>([]);
const forbidden = ref(false);
const loaded = ref(false);

// รหัสแอดมินพิเศษ (เก็บในแท็บนี้เท่านั้น ปิดแท็บแล้วหาย)
const adminKey = ref("");
const keyInput = ref("");
const authHeaders = () => (adminKey.value ? { "x-admin-key": adminKey.value } : undefined);
const openFile = useAuthedOpen(authHeaders);
onMounted(() => {
  try { adminKey.value = sessionStorage.getItem("vpp-admin-key") || ""; } catch {}
});
async function submitKey() {
  adminKey.value = keyInput.value.trim();
  try { sessionStorage.setItem("vpp-admin-key", adminKey.value); } catch {}
  forbidden.value = false;
  await load();
}

type Member = { id: string; name: string; email: string; emailVerified: boolean; phone: string | null; cohort: string | null; imported: boolean; activated: boolean; placeholder: boolean; certCount: number; admin: boolean };
type Cert = { id: string; title: string; certNo: string | null; issuedOn: string | null };
const tab = ref<string>("applications");
const openId = ref("");
const certs = ref<Cert[]>([]);
const cf = reactive<{ file?: File; title: string; certNo: string; issuedOn: string; busy: boolean; err: string; ok: string }>({ title: "", certNo: "", issuedOn: "", busy: false, err: "", ok: "" });
const pf = reactive({ name: "", email: "", phone: "", cohort: "", busy: false, msg: "", ok: false });
const link = ref<{ url: string; expiresAt: string } | null>(null);
const linkMsg = ref("");
async function toggleCerts(m: Member) {
  if (openId.value === m.id) return (openId.value = "");
  openId.value = m.id;
  Object.assign(cf, { file: undefined, title: "", certNo: "", issuedOn: "", err: "", ok: "" });
  Object.assign(pf, { name: m.name, email: m.placeholder ? "" : m.email, phone: m.phone || "", cohort: m.cohort || "", msg: "", ok: false });
  link.value = null;
  linkMsg.value = "";
  saveMsg.value = null;
  certs.value = [];
  await loadCerts(m.id);
}
function onPickAttach(f: File) {
  saveMsg.value = null;
  if (!cf.title.trim()) cf.title = f.name.replace(/\.[^.]+$/, ""); // เติมชื่อไฟล์ให้ก่อน แก้ได้
}
async function makeLink(m: Member) {
  linkMsg.value = "";
  try {
    link.value = await $fetch(`/api/manage/members/${m.id}/activation-link`, { method: "POST", headers: authHeaders() });
  } catch (e: any) {
    linkMsg.value = e?.data?.message || "สร้างลิงก์ไม่สำเร็จ";
  }
}
// ส่งลิงก์เปิดใช้งานไปที่อีเมลในช่อง "อีเมล" (บันทึกอีเมลใหม่ให้ก่อนถ้าแก้ไว้)
const sendingLink = ref(false);
async function sendLink(m: Member) {
  linkMsg.value = "";
  const email = pf.email.trim();
  if (!email) return (linkMsg.value = "กรุณาใส่อีเมลของสมาชิกก่อน");
  const saved = m.placeholder ? "" : m.email;
  if (email.toLowerCase() !== saved.toLowerCase() && !confirm(`บันทึกอีเมล ${email} เป็นอีเมลเข้าสู่ระบบของ ${m.name} แล้วส่งลิงก์?`)) return;
  sendingLink.value = true;
  try {
    if (email.toLowerCase() !== saved.toLowerCase()) {
      await $fetch(`/api/manage/members/${m.id}`, { method: "PATCH", body: { name: pf.name, email, phone: pf.phone, cohort: pf.cohort }, headers: authHeaders() });
      await loadMembers();
    }
    const r = await $fetch<{ url: string; expiresAt: string; sentTo: string | null }>(`/api/manage/members/${m.id}/activation-link`, { method: "POST", body: { send: true }, headers: authHeaders() });
    link.value = r;
    linkMsg.value = `ส่งลิงก์ไปที่ ${r.sentTo} แล้ว (ลิงก์เก่าที่ยังไม่ใช้ถูกยกเลิก)`;
  } catch (e: any) {
    if (e?.data?.data?.url) link.value = { url: e.data.data.url } as any;
    linkMsg.value = e?.data?.message || "ส่งไม่สำเร็จ";
  } finally {
    sendingLink.value = false;
  }
}
async function copyLink() {
  if (!link.value) return;
  try { await navigator.clipboard.writeText(link.value.url); linkMsg.value = "คัดลอกแล้ว"; } catch { linkMsg.value = "คัดลอกไม่ได้ ให้เลือกข้อความแล้วคัดลอกเอง"; }
}
const csvCell = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
async function bulkSend() {
  const label = cohortFilter.value || "ทุกรุ่น";
  if (!confirm(`ส่งอีเมลลิงก์เปิดใช้งานให้สมาชิกที่ยังไม่เปิดใช้งานและมีอีเมล (${label}) ?\nลิงก์เก่าที่ยังไม่ได้ใช้จะถูกยกเลิก`)) return;
  bulkBusy.value = true;
  try {
    const rows = await $fetch<{ name: string; cohort: string | null; phone: string | null; email: string; url: string; sent: boolean }[]>("/api/manage/members/activation-links", { method: "POST", body: { cohort: cohortFilter.value || undefined, send: true }, headers: authHeaders() });
    if (!rows.length) return alert("ไม่มีสมาชิกที่ยังไม่เปิดใช้งาน");
    const sent = rows.filter((r) => r.sent).length;
    const rest = rows.filter((r) => !r.sent);
    if (!rest.length) return alert(`ส่งอีเมลแล้ว ${sent} คน`);
    if (confirm(`ส่งอีเมลแล้ว ${sent} คน\nส่งไม่ได้ ${rest.length} คน (ไม่มีอีเมล หรือส่งไม่สำเร็จ)\n\nดาวน์โหลดลิงก์ของคนที่ส่งไม่ได้ (CSV) ไว้ส่งทาง LINE?`)) downloadLinks(rest, `${label}-ส่งไม่ได้`);
  } catch (e: any) {
    alert(e?.data?.message || "ส่งไม่สำเร็จ");
  } finally {
    bulkBusy.value = false;
  }
}
const bulkBusy = ref(false);
function downloadLinks(rows: { name: string; cohort: string | null; phone: string | null; email: string; url: string }[], label: string) {
  const csv = "\ufeffชื่อ-สกุล,รุ่น,เบอร์โทร,อีเมล,ลิงก์เปิดใช้งาน\n" + rows.map((r) => [r.name, r.cohort || "", r.phone || "", r.email, r.url].map(csvCell).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `activation-links-${label}.csv`;
  a.click();
}
async function bulkLinks() {
  const label = cohortFilter.value || "ทุกรุ่น";
  if (!confirm(`สร้างลิงก์เปิดใช้งานให้สมาชิกที่นำเข้าและยังไม่เปิดใช้งาน (${label}) ?\nลิงก์เก่าที่ยังไม่ได้ใช้จะถูกยกเลิก`)) return;
  try {
    const rows = await $fetch<{ name: string; cohort: string | null; phone: string | null; email: string; url: string }[]>("/api/manage/members/activation-links", { method: "POST", body: { cohort: cohortFilter.value || undefined }, headers: authHeaders() });
    if (!rows.length) return alert("ไม่มีสมาชิกที่ยังไม่เปิดใช้งาน");
    const csv = "\ufeffชื่อ-สกุล,รุ่น,เบอร์โทร,อีเมล,ลิงก์เปิดใช้งาน\n" + rows.map((r) => [r.name, r.cohort || "", r.phone || "", r.email, r.url].map(csvCell).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `activation-links-${label}.csv`;
    a.click();
  } catch (e: any) {
    alert(e?.data?.message || "สร้างลิงก์ไม่สำเร็จ");
  }
}
async function loadCerts(id: string) {
  try {
    certs.value = await $fetch<Cert[]>(`/api/manage/members/${id}/certificates`, { headers: authHeaders() });
  } catch {}
}
// บันทึกทั้งกล่อง: โปรไฟล์ (ถ้ามีการแก้) + ไฟล์แนบใหม่ (ถ้าเลือกไว้)
const saving = ref(false);
const saveMsg = ref<{ ok: boolean; text: string } | null>(null);
async function saveAll(m: Member) {
  saveMsg.value = null;
  if (!pf.name.trim()) return (saveMsg.value = { ok: false, text: "กรุณาใส่ชื่อ-สกุล" });
  if (cf.file && !cf.title.trim()) return (saveMsg.value = { ok: false, text: "กรุณาใส่ชื่อไฟล์ที่แสดงของไฟล์ที่แนบ" });
  const profileChanged = pf.name !== m.name || pf.email !== (m.placeholder ? "" : m.email) || pf.phone !== (m.phone || "") || pf.cohort !== (m.cohort || "");
  if (!profileChanged && !cf.file) return (saveMsg.value = { ok: true, text: "ไม่มีอะไรเปลี่ยน" });
  saving.value = true;
  const done: string[] = [];
  try {
    if (profileChanged) {
      await $fetch(`/api/manage/members/${m.id}`, { method: "PATCH", body: { name: pf.name, email: pf.email || undefined, phone: pf.phone, cohort: pf.cohort }, headers: authHeaders() });
      done.push("โปรไฟล์");
    }
    if (cf.file) {
      const fd = new FormData();
      fd.append("file", cf.file);
      fd.append("title", cf.title.trim());
      if (cf.certNo) fd.append("certNo", cf.certNo);
      if (cf.issuedOn) fd.append("issuedOn", cf.issuedOn);
      try {
        await $fetch(`/api/manage/members/${m.id}/certificates`, { method: "POST", body: fd, headers: authHeaders() });
      } catch (e: any) {
        throw new Error(`${done.length ? "บันทึกโปรไฟล์แล้ว แต่" : ""}${uploadError(e, "แนบไฟล์ไม่สำเร็จ")}`);
      }
      Object.assign(cf, { file: undefined, title: "", certNo: "", issuedOn: "" });
      done.push("ไฟล์แนบ");
    }
    saveMsg.value = { ok: true, text: `บันทึก${done.join(" และ ")}แล้ว` };
    await Promise.all([loadCerts(m.id), loadMembers()]);
  } catch (e: any) {
    saveMsg.value = { ok: false, text: e?.data?.message || e?.message || "บันทึกไม่สำเร็จ" };
    if (done.length) loadMembers();
  } finally {
    saving.value = false;
  }
}
function cancelEdit() {
  openId.value = "";
  saveMsg.value = null;
  Object.assign(cf, { file: undefined, title: "", certNo: "", issuedOn: "" });
}
async function removeCert(m: Member, c: Cert) {
  if (!confirm(`ลบไฟล์ "${c.title}" ของ ${m.name} ?`)) return;
  try {
    await $fetch(`/api/manage/certificates/${c.id}`, { method: "DELETE", headers: authHeaders() });
    await Promise.all([loadCerts(m.id), loadMembers()]);
  } catch (e: any) {
    alert(e?.data?.message || "ลบไม่สำเร็จ");
  }
}
const members = ref<Member[]>([]);
const q = ref("");
const cohortFilter = ref("");
const cohorts = computed(() => [...new Set(members.value.map((m) => m.cohort).filter(Boolean))].sort() as string[]);
const shown = computed(() => {
  const k = q.value.trim().toLowerCase();
  return members.value.filter(
    (m) => (!cohortFilter.value || m.cohort === cohortFilter.value) && (!k || [m.name, m.email, m.phone || ""].some((v) => v.toLowerCase().includes(k))),
  );
});
async function loadMembers() {
  try {
    members.value = await $fetch<Member[]>("/api/manage/members", { headers: authHeaders() });
  } catch {}
}
async function removeMember(m: Member) {
  if (!confirm(`ลบสมาชิก ${m.name} (${m.email}) ?`)) return;
  try {
    await $fetch(`/api/manage/members/${m.id}`, { method: "DELETE", headers: authHeaders() });
    members.value = members.value.filter((x) => x.id !== m.id);
  } catch (e: any) {
    alert(e?.data?.message || "ลบไม่สำเร็จ");
  }
}

// โหลดรายชื่อสมาชิกเมื่อเปิดแท็บสมาชิกครั้งแรก (ไม่โหลดทุกอย่างตั้งแต่เข้าเพจ)
let membersLoaded = false;
watch(tab, (t) => {
  if (t === "members" && !membersLoaded && !forbidden.value) {
    membersLoaded = true;
    loadMembers();
  }
});
async function load() {
  if (tab.value === "members") {
    membersLoaded = true;
    loadMembers();
  }
  try {
    rows.value = await $fetch<Row[]>("/api/manage/claims", { headers: authHeaders() });
  } catch (e: any) {
    rows.value = [];
    if (e?.status === 403 || e?.statusCode === 403) forbidden.value = true;
  }
  loaded.value = true;
}
// โหลดครั้งเดียวต่อผู้ใช้ (session ถูกดึงใหม่ทุกครั้งที่สลับกลับมาที่แท็บเบราว์เซอร์ — ไม่ต้องโหลดข้อมูลซ้ำ)
let loadedFor = "";
watchEffect(() => {
  if (isPending.value) return;
  if (!session.value) return navigateTo("/login");
  if (loadedFor === session.value.user.id) return;
  loadedFor = session.value.user.id;
  load();
});

const files = reactive<Record<string, File | undefined>>({});
const certNo = reactive<Record<string, string>>({});
const issuedOn = reactive<Record<string, string>>({});
const note = reactive<Record<string, string>>({});
const busy = ref("");
const error = ref<Record<string, string>>({});

async function approve(id: string) {
  error.value[id] = "";
  const file = files[id];
  if (!file) return (error.value[id] = "กรุณากดปุ่ม \"แนบไฟล์\" แล้วเลือกไฟล์ใบประกาศก่อน");
  busy.value = id;
  const fd = new FormData();
  fd.append("file", file);
  if (certNo[id]) fd.append("certNo", certNo[id]);
  if (issuedOn[id]) fd.append("issuedOn", issuedOn[id]);
  if (note[id]) fd.append("adminNote", note[id]);
  try {
    await $fetch(`/api/manage/claims/${id}/approve`, { method: "POST", body: fd, headers: authHeaders() });
    await load();
  } catch (e: any) {
    error.value[id] = uploadError(e, "อนุมัติไม่สำเร็จ");
  } finally {
    busy.value = "";
  }
}

async function reject(id: string) {
  error.value[id] = "";
  busy.value = id;
  try {
    await $fetch(`/api/manage/claims/${id}/reject`, { method: "POST", body: { adminNote: note[id] }, headers: authHeaders() });
    await load();
  } catch (e: any) {
    error.value[id] = e?.data?.message || "ดำเนินการไม่สำเร็จ";
  } finally {
    busy.value = "";
  }
}

// ---- นำเข้าสมาชิกจากไฟล์ Excel (อ่านในเบราว์เซอร์ ไฟล์ไม่ถูกอัปโหลดทั้งไฟล์) ----
type Imp = { name: string; email: string; phone?: string; cohort: string };
const impRows = ref<Imp[]>([]);
const impMsg = ref("");
const impResult = ref<{ dryRun: boolean; create: number; noEmail?: number; invited?: number; skipped: { name: string; reason: string }[] } | null>(null);
const impInvite = ref(false);
const impBusy = ref(false);

async function pickExcel(e: Event) {
  impResult.value = null;
  impMsg.value = "";
  impRows.value = [];
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  if (!f) return;
  try {
    const { default: readExcel } = await import("read-excel-file/browser");
    const sheets = (await readExcel(f)) as unknown as { sheet: string; data: unknown[][] }[];
    const out: Imp[] = [];
    for (const sh of sheets) {
      const m = /^VPP\s*(\d+)$/i.exec(sh.sheet.trim());
      if (!m) continue; // เอาเฉพาะชีต "VPP 1", "VPP 2", ...
      const head = (sh.data[0] || []).map((c) => String(c ?? "").trim());
      const iName = head.indexOf("ชื่อ-สกุล"), iTel = head.indexOf("เบอร์โทรศัพท์"), iMail = head.indexOf("อีเมล");
      if (iName < 0) continue;
      for (const r of sh.data.slice(1)) {
        const name = String(r[iName] ?? "").replace(/\s+/g, " ").trim();
        if (!name) continue;
        out.push({ name, email: String(r[iMail] ?? "").trim(), phone: String(r[iTel] ?? "").trim() || undefined, cohort: `รุ่นที่ ${m[1]}` });
      }
    }
    impRows.value = out;
    impMsg.value = out.length ? `อ่านได้ ${out.length} รายการ` : "ไม่พบชีตชื่อ VPP 1, VPP 2, ... ในไฟล์";
  } catch {
    impMsg.value = "อ่านไฟล์ไม่ได้ (ต้องเป็น .xlsx)";
  } finally {
    input.value = ""; // เลือกไฟล์เดิมซ้ำได้
  }
}
// เพิ่มสมาชิกทีละคน (ใช้ระบบเดียวกับนำเข้า Excel: ข้ามถ้ามีบัญชี/ชื่อซ้ำ)
const one = reactive({ name: "", email: "", phone: "", cohort: "", invite: true });
const oneBusy = ref(false);
const oneMsg = ref<{ ok: boolean; text: string } | null>(null);
async function addOne() {
  oneMsg.value = null;
  if (!one.name.trim()) return (oneMsg.value = { ok: false, text: "กรุณากรอกชื่อ-สกุล" });
  oneBusy.value = true;
  try {
    const { invite, ...row } = one;
    const r = await $fetch<{ create: number; invited: number; skipped: { reason: string }[] }>("/api/manage/members/import", { method: "POST", body: { dryRun: false, rows: [row], invite }, headers: authHeaders() });
    if (r.create) {
      const extra = !one.email.trim() ? " (ยังไม่มีอีเมล เติมทีหลังได้ในรายชื่อด้านล่าง)" : r.invited ? ` และส่งอีเมลเปิดใช้งานไปที่ ${one.email.trim()} แล้ว` : invite ? " (ส่งอีเมลไม่สำเร็จ สร้างลิงก์ส่งเองได้ในรายชื่อด้านล่าง)" : "";
      oneMsg.value = { ok: true, text: `เพิ่ม ${one.name.trim()} แล้ว${extra}` };
      Object.assign(one, { name: "", email: "", phone: "" });
      loadMembers();
    } else oneMsg.value = { ok: false, text: `ไม่ได้เพิ่ม: ${r.skipped[0]?.reason || "ข้อมูลไม่ถูกต้อง"}` };
  } catch (e: any) {
    oneMsg.value = { ok: false, text: e?.data?.message || "เพิ่มไม่สำเร็จ" };
  } finally {
    oneBusy.value = false;
  }
}
async function runImport(dryRun: boolean) {
  impBusy.value = true;
  try {
    impResult.value = await $fetch("/api/manage/members/import", { method: "POST", body: { dryRun, rows: impRows.value, invite: impInvite.value }, headers: authHeaders() });
    if (!dryRun) {
      impRows.value = [];
      loadMembers();
    }
  } catch (e: any) {
    impMsg.value = e?.data?.message || "นำเข้าไม่สำเร็จ";
  } finally {
    impBusy.value = false;
  }
}

const uploadError = (e: any, fallback: string) =>
  e?.status === 413 || e?.statusCode === 413 ? "ไฟล์ใหญ่เกินที่ระบบรับได้ (ไม่เกิน 4MB) กรุณาย่อขนาดไฟล์" : e?.data?.message || `${fallback} (${e?.status || e?.statusCode || "เชื่อมต่อไม่ได้"})`;

const status = { pending: ["รอตรวจสอบ", "bg-amber-100 text-amber-800"], approved: ["อนุมัติแล้ว", "bg-green-100 text-green-800"], rejected: ["ไม่อนุมัติ", "bg-red-100 text-red-700"] } as const;
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-");
</script>

<template>
  <SiteHeader />
  <main class="mx-auto w-full max-w-4xl px-5 py-12">
    <h1 class="text-3xl font-bold text-navy-800">ระบบแอดมิน VPP</h1>
    <div v-if="forbidden" class="mt-6 rounded-2xl bg-red-50 px-4 py-4 text-sm text-red-700">
      <p>หน้านี้สำหรับแอดมินเท่านั้น: อีเมลต้องอยู่ในรายชื่อแอดมิน และยืนยันอีเมลแล้ว หรือกรอกรหัสแอดมินด้านล่าง</p>
      <form class="mt-3 flex flex-wrap gap-2" @submit.prevent="submitKey">
        <PasswordInput v-model="keyInput" autocomplete="off" wrap-class="w-full max-w-xs" placeholder="รหัสแอดมิน (ADMIN_KEY)" />
        <button class="btn-brand px-5 py-2 text-sm">เข้าใช้งาน</button>
      </form>
    </div>
    <nav v-if="!forbidden" class="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
      <button v-for="t in ([['applications', 'ใบสมัคร'], ['payments', 'ตรวจการชำระเงิน'], ['members', 'สมาชิกและใบประกาศ'], ...(rows.length ? [['claims', `คำขอเดิมจากสมาชิก${rows.some((r) => r.status === 'pending') ? ` (${rows.filter((r) => r.status === 'pending').length})` : ''}`]] : []), ['content', 'เนื้อหาเว็บ']] as const)" :key="t[0]"
        class="rounded-full px-5 py-2" :class="tab === t[0] ? 'bg-navy-800 text-white' : 'bg-white text-navy-800 shadow-sm'" @click="tab = t[0]">{{ t[1] }}</button>
    </nav>

    <ApplicationsAdmin v-if="!forbidden && tab === 'applications'" :auth-headers="authHeaders" />
    <PaymentsAdmin v-if="!forbidden && tab === 'payments'" :auth-headers="authHeaders" />
    <CmsEditor v-if="!forbidden && tab === 'content'" :auth-headers="authHeaders" />
    <p v-if="!forbidden && tab === 'content'" class="mt-6 text-xs text-slate-500">ต้องตั้งค่า <code>GITHUB_TOKEN</code> บน Vercel ก่อนใช้งาน (ดู docs/members-setup.md) · หน้าจัดการแบบเดิม (สำรอง): <a :href="asset('/admin/')" target="_blank" class="underline">/admin/</a></p>

    <p v-if="!forbidden && tab === 'claims' && loaded && !rows.length" class="mt-6 text-sm text-slate-500">ยังไม่มีคำขอ</p>
    <ul v-if="tab === 'claims'" class="mt-6 space-y-4">
      <li v-for="r in rows" :key="r.id" class="rounded-3xl bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="font-bold text-navy-800">{{ r.fullName }} · {{ r.cohort }}</div>
          <span class="rounded-full px-3 py-0.5 text-xs font-semibold" :class="status[r.status][1]">{{ status[r.status][0] }}</span>
        </div>
        <div class="mt-1 text-sm text-slate-600">บัญชี: {{ r.accountName }} ({{ r.email }}) · เรียนจบ: {{ fmt(r.completedOn) }} · ยื่นเมื่อ {{ fmt(r.createdAt) }}</div>
        <p v-if="r.note" class="mt-1 text-sm text-slate-600">หมายเหตุผู้ยื่น: {{ r.note }}</p>
        <p v-if="r.adminNote" class="mt-1 text-sm text-slate-600">หมายเหตุแอดมิน: {{ r.adminNote }}</p>

        <div v-if="r.status === 'pending'" class="mt-4 grid gap-3 border-t border-sky-card pt-4 md:grid-cols-2">
          <div class="text-xs text-slate-600 md:col-span-2">ไฟล์ใบประกาศ (PDF / JPG / PNG ไม่เกิน 4MB) *
            <FilePickButton v-model="files[r.id]" class="mt-1" />
          </div>
          <input v-model="certNo[r.id]" class="field" placeholder="เลขที่ใบประกาศ (ถ้ามี)" />
          <label class="text-xs text-slate-600">วันที่ออกใบ
            <input v-model="issuedOn[r.id]" type="date" class="field mt-1" />
          </label>
          <input v-model="note[r.id]" class="field self-end" placeholder="หมายเหตุถึงผู้เรียน (ถ้ามี)" />
          <p v-if="error[r.id]" class="text-sm text-red-700 md:col-span-2">{{ error[r.id] }}</p>
          <div class="flex gap-2 md:col-span-2">
            <button :disabled="busy === r.id" class="btn-brand px-5 py-2 text-sm disabled:opacity-60" @click="approve(r.id)">อนุมัติและส่งใบประกาศ</button>
            <button :disabled="busy === r.id" class="rounded-full border border-red-300 px-5 py-2 text-sm text-red-700 disabled:opacity-60" @click="reject(r.id)">ไม่อนุมัติ</button>
          </div>
        </div>
      </li>
    </ul>

    <section v-if="!forbidden && tab === 'members'" class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-navy-800">เพิ่มสมาชิกทีละคน</h2>
      <p class="mt-1 text-sm text-slate-600">สร้างบัญชีที่ยังไม่มีรหัสผ่าน แล้วส่ง "ลิงก์เปิดใช้งาน" ให้สมาชิก (ปุ่มจัดการในรายชื่อด้านล่าง) หรือให้เข้าด้วย Google อีเมลเดียวกัน</p>
      <form class="mt-4 grid gap-3 md:grid-cols-4" @submit.prevent="addOne">
        <input v-model="one.name" class="field" placeholder="ชื่อ-สกุล *" />
        <input v-model="one.email" type="email" class="field" placeholder="อีเมล (ไม่บังคับ)" />
        <input v-model="one.phone" inputmode="tel" class="field" placeholder="เบอร์โทร" />
        <input v-model="one.cohort" class="field" list="member-cohorts" placeholder="รุ่น เช่น VPP 1" />
        <datalist id="member-cohorts"><option v-for="c in cohorts" :key="c" :value="c" /></datalist>
        <div class="flex flex-wrap items-center gap-3 md:col-span-4">
          <button :disabled="oneBusy" class="btn-brand px-6 py-2.5 text-sm disabled:opacity-60">{{ oneBusy ? "กำลังเพิ่ม..." : "+ เพิ่มสมาชิก" }}</button>
          <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="one.invite" type="checkbox" class="size-4" />ส่งอีเมลลิงก์เปิดใช้งานทันที (ถ้าใส่อีเมล)</label>
          <span v-if="oneMsg" class="text-sm" :class="oneMsg.ok ? 'text-green-700' : 'text-red-700'">{{ oneMsg.text }}</span>
        </div>
      </form>
    </section>

    <section v-if="!forbidden && tab === 'members'" class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-navy-800">นำเข้าสมาชิกจากรายชื่อ (Excel)</h2>
      <p class="mt-1 text-sm text-slate-600">เลือกไฟล์ .xlsx ที่มีชีต "VPP 1", "VPP 2", ... คอลัมน์ ชื่อ-สกุล / เบอร์โทรศัพท์ / อีเมล ระบบจะสร้างบัญชีสมาชิกที่ยังไม่มีรหัสผ่าน (คนที่ไม่มีอีเมลจะถูกสร้างไว้โดยยังไม่มีอีเมล แล้วเติมทีหลังได้ ข้ามคนที่มีบัญชี/ชื่อซ้ำอยู่แล้ว) ให้สมาชิกเปิดใช้งานบัญชีผ่าน "ลิงก์เปิดใช้งาน" (สร้างได้ในรายชื่อสมาชิกด้านล่าง) หรือเข้าด้วย Google อีเมลเดียวกัน</p>
      <label class="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-navy-800 bg-white px-5 py-2 text-sm font-semibold text-navy-800 hover:bg-navy-800 hover:text-white">
        <Paperclip class="size-4" />เลือกไฟล์ Excel (.xlsx)
        <input type="file" accept=".xlsx" class="hidden" @change="pickExcel" />
      </label>
      <a :href="asset('/downloads/vpp-members-template.xlsx')" download class="ml-3 text-sm text-navy-800 underline">ดาวน์โหลดแบบฟอร์ม Excel</a>
      <p v-if="impMsg" class="mt-2 text-sm text-slate-600">{{ impMsg }}</p>
      <div v-if="impRows.length" class="mt-3 flex gap-2">
        <button :disabled="impBusy" class="rounded-full border border-navy-800 px-5 py-2 text-sm text-navy-800 disabled:opacity-60" @click="runImport(true)">ตรวจสอบก่อน (ยังไม่สร้าง)</button>
        <button :disabled="impBusy || !impResult || !impResult.dryRun || !impResult.create" class="btn-brand px-5 py-2 text-sm disabled:opacity-50" @click="runImport(false)">ยืนยันนำเข้า</button>
        <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="impInvite" type="checkbox" class="size-4" />ส่งอีเมลลิงก์เปิดใช้งานให้ทุกคนที่มีอีเมลทันที</label>
      </div>
      <div v-if="impResult" class="mt-3 text-sm">
        <p class="font-semibold text-navy-800">{{ impResult.dryRun ? "ผลตรวจสอบ: จะสร้างสมาชิกใหม่" : "สร้างสมาชิกแล้ว" }} {{ impResult.create }} คน{{ impResult.noEmail ? ` (ไม่มีอีเมล ${impResult.noEmail} คน)` : "" }}{{ !impResult.dryRun && impResult.invited ? ` · ส่งอีเมลเปิดใช้งานแล้ว ${impResult.invited} คน` : "" }} · ข้าม {{ impResult.skipped.length }} คน</p>
        <ul class="mt-1 list-disc pl-5 text-slate-600">
          <li v-for="(k, i) in impResult.skipped" :key="i">{{ k.name }}: {{ k.reason }}</li>
        </ul>
      </div>
    </section>

    <section v-if="!forbidden && tab === 'members'" class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-navy-800">สมาชิกทั้งหมด <span class="text-base font-normal text-slate-500">({{ shown.length }}/{{ members.length }} คน)</span></h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <input v-model="q" class="field max-w-xs" placeholder="ค้นหาชื่อ / อีเมล / เบอร์" />
        <select v-model="cohortFilter" class="field max-w-[10rem]">
          <option value="">ทุกรุ่น</option>
          <option v-for="c in cohorts" :key="c" :value="c">{{ c }}</option>
        </select>
        <button :disabled="bulkBusy" class="rounded-full bg-navy-800 px-4 py-2 text-xs text-white disabled:opacity-60" @click="bulkSend">{{ bulkBusy ? "กำลังส่ง..." : `ส่งอีเมลลิงก์เปิดใช้งาน${cohortFilter ? ` · ${cohortFilter}` : " (ทุกรุ่น)"}` }}</button>
        <button class="rounded-full border border-navy-800 px-4 py-2 text-xs text-navy-800 hover:bg-navy-800 hover:text-white" @click="bulkLinks">ดาวน์โหลดลิงก์เปิดใช้งาน (CSV){{ cohortFilter ? ` · ${cohortFilter}` : "" }}</button>
      </div>
      <p v-if="!members.length" class="mt-4 text-sm text-slate-500">ยังไม่มีสมาชิก</p>
      <div v-else class="mt-4 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs text-slate-500">
            <tr><th class="py-2 pr-3">ชื่อ-สกุล</th><th class="pr-3">อีเมล</th><th class="pr-3">เบอร์โทร</th><th class="pr-3">รุ่น</th><th /></tr>
          </thead>
          <tbody>
            <template v-for="m in shown" :key="m.id">
              <tr class="border-t border-sky-card align-top">
                <td class="py-2 pr-3 font-medium text-navy-800">{{ m.name }}
                  <span v-if="m.admin" class="ml-1 rounded-full bg-navy-800 px-2 py-0.5 text-[10px] text-white">แอดมิน</span>
                  <span v-else-if="!m.imported" class="ml-1 rounded-full bg-sky-card px-2 py-0.5 text-[10px] text-navy-800">สมัครเอง</span>
                  <span v-else-if="!m.activated" class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">ยังไม่เปิดใช้งาน</span>
                </td>
                <td class="pr-3">{{ m.placeholder ? "(ยังไม่มีอีเมล)" : m.email }}</td>
                <td class="pr-3">{{ m.phone || "-" }}</td>
                <td class="pr-3">{{ m.cohort || "-" }}</td>
                <td class="whitespace-nowrap text-right">
                  <button class="mr-3 rounded-full border border-navy-800 px-3 py-1 text-xs text-navy-800 hover:bg-navy-800 hover:text-white" @click="toggleCerts(m)">จัดการ · ไฟล์ ({{ m.certCount }})</button>
                  <button v-if="m.imported && !m.admin" class="text-xs text-red-600 hover:underline" @click="removeMember(m)">ลบ</button>
                </td>
              </tr>
              <tr v-if="openId === m.id" class="bg-sky-soft">
                <td colspan="5" class="space-y-6 px-4 py-4">
                  <div>
                    <p class="font-semibold text-navy-800">โปรไฟล์</p>
                    <div class="mt-2 grid gap-2 md:grid-cols-2">
                      <input v-model="pf.name" class="field" placeholder="ชื่อ-สกุล *" />
                      <input v-model="pf.email" type="email" class="field" :placeholder="m.placeholder ? 'อีเมล (ยังไม่มี)' : 'อีเมล'" :disabled="m.admin" />
                      <input v-model="pf.phone" class="field" placeholder="เบอร์โทรศัพท์" />
                      <input v-model="pf.cohort" class="field" placeholder="รุ่น เช่น รุ่นที่ 3" />
                    </div>
                  </div>

                  <div v-if="!m.admin">
                    <p class="font-semibold text-navy-800">เปิดใช้งานบัญชี <span class="text-xs font-normal text-slate-500">({{ m.activated ? "เปิดใช้งานแล้ว สร้างลิงก์ใหม่ได้ถ้าสมาชิกลืมรหัสผ่าน" : "ส่งลิงก์นี้ให้เจ้าของบัญชีเพื่อตั้งรหัสผ่านเอง" }})</span></p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <button :disabled="sendingLink" class="rounded-full bg-navy-800 px-4 py-1.5 text-xs text-white disabled:opacity-60" @click="sendLink(m)">{{ sendingLink ? "กำลังส่ง..." : `ส่งลิงก์ทางอีเมล${pf.email.trim() ? ` → ${pf.email.trim()}` : ""}` }}</button>
                      <button class="rounded-full border border-navy-800 px-4 py-1.5 text-xs text-navy-800 hover:bg-navy-800 hover:text-white" @click="makeLink(m)">สร้างลิงก์ (คัดลอกส่งเอง)</button>
                    </div>
                    <p class="mt-1 text-xs text-slate-500">ลิงก์อายุ 14 วัน ใช้ได้ครั้งเดียว</p>
                    <div v-if="link" class="mt-2 flex flex-wrap items-center gap-2">
                      <input :value="link.url" readonly class="field max-w-xl flex-1 text-xs" @focus="($event.target as HTMLInputElement).select()" />
                      <button class="rounded-full bg-navy-800 px-4 py-1.5 text-xs text-white" @click="copyLink">คัดลอก</button>
                    </div>
                    <p v-if="linkMsg" class="mt-1 text-xs text-slate-600">{{ linkMsg }}</p>
                  </div>

                  <div>
                    <p class="font-semibold text-navy-800">ไฟล์และใบประกาศของ {{ m.name }}</p>
                    <ul v-if="certs.length" class="mt-2 space-y-1">
                      <li v-for="c in certs" :key="c.id" class="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                        <span>{{ c.title }}<span v-if="c.certNo" class="text-slate-500"> · เลขที่ {{ c.certNo }}</span><span v-if="c.issuedOn" class="text-slate-500"> · {{ c.issuedOn }}</span></span>
                        <span class="whitespace-nowrap">
                          <button type="button" class="mr-3 text-xs text-navy-800 hover:underline" @click="openFile(`/api/certificates/${c.id}/file`)">เปิดไฟล์</button>
                          <button class="text-xs text-red-600 hover:underline" @click="removeCert(m, c)">ลบ</button>
                        </span>
                      </li>
                    </ul>
                    <p v-else class="mt-1 text-xs text-slate-500">ยังไม่มีไฟล์</p>
                    <div class="mt-3 grid gap-2 md:grid-cols-2">
                      <div class="text-xs text-slate-600">แนบไฟล์ใหม่ (PDF / JPG / PNG ไม่เกิน 4MB) · ไม่บังคับ
                        <FilePickButton v-model="cf.file" class="mt-1" @picked="onPickAttach" />
                      </div>
                      <label class="text-xs text-slate-600">ชื่อไฟล์ที่แสดง (ต้องใส่เมื่อแนบไฟล์)
                        <input v-model="cf.title" class="field mt-1" placeholder="เช่น ประกาศนียบัตร VPP รุ่นที่ 3" />
                      </label>
                      <input v-model="cf.certNo" class="field" placeholder="เลขที่ (ถ้ามี)" />
                      <label class="text-xs text-slate-600">วันที่ออก <input v-model="cf.issuedOn" type="date" class="field mt-1" /></label>
                    </div>
                  </div>

                  <div class="sticky bottom-0 -mx-4 -mb-4 flex flex-wrap items-center gap-3 border-t border-sky-card bg-sky-soft/95 px-4 py-3 backdrop-blur">
                    <button :disabled="saving" class="btn-brand px-6 py-2.5 text-sm disabled:opacity-60" @click="saveAll(m)">{{ saving ? "กำลังบันทึก..." : "บันทึก" }}</button>
                    <button :disabled="saving" class="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm text-navy-800 disabled:opacity-60" @click="cancelEdit">ยกเลิก</button>
                    <p v-if="saveMsg" class="text-sm" :class="saveMsg.ok ? 'text-green-700' : 'text-red-700'">{{ saveMsg.text }}</p>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
  </main>
  <SiteFooter />
</template>
