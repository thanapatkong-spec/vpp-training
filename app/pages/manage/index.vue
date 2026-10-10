<script setup lang="ts">
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
onMounted(() => {
  try { adminKey.value = sessionStorage.getItem("vpp-admin-key") || ""; } catch {}
});
async function submitKey() {
  adminKey.value = keyInput.value.trim();
  try { sessionStorage.setItem("vpp-admin-key", adminKey.value); } catch {}
  forbidden.value = false;
  await load();
}

type Member = { id: string; name: string; email: string; emailVerified: boolean; phone: string | null; cohort: string | null; imported: boolean; certCount: number; admin: boolean };
type Cert = { id: string; title: string; certNo: string | null; issuedOn: string | null };
const tab = ref<"members" | "claims" | "content">("members");
const openId = ref("");
const certs = ref<Cert[]>([]);
const cf = reactive<{ file?: File; title: string; certNo: string; issuedOn: string; busy: boolean; err: string; ok: string }>({ title: "", certNo: "", issuedOn: "", busy: false, err: "", ok: "" });
async function toggleCerts(m: Member) {
  if (openId.value === m.id) return (openId.value = "");
  openId.value = m.id;
  Object.assign(cf, { file: undefined, title: "", certNo: "", issuedOn: "", err: "", ok: "" });
  certs.value = [];
  await loadCerts(m.id);
}
async function loadCerts(id: string) {
  try {
    certs.value = await $fetch<Cert[]>(`/api/manage/members/${id}/certificates`, { headers: authHeaders() });
  } catch {}
}
async function issueCert(m: Member) {
  cf.err = cf.ok = "";
  if (!cf.file) return (cf.err = "กรุณาเลือกไฟล์ PDF ใบประกาศ");
  const fd = new FormData();
  fd.append("file", cf.file);
  if (cf.title) fd.append("title", cf.title);
  if (cf.certNo) fd.append("certNo", cf.certNo);
  if (cf.issuedOn) fd.append("issuedOn", cf.issuedOn);
  cf.busy = true;
  try {
    await $fetch(`/api/manage/members/${m.id}/certificates`, { method: "POST", body: fd, headers: authHeaders() });
    cf.ok = "ออกใบประกาศให้สมาชิกแล้ว สมาชิกดาวน์โหลดได้ที่หน้าบัญชีของฉัน";
    Object.assign(cf, { file: undefined, title: "", certNo: "", issuedOn: "" });
    await Promise.all([loadCerts(m.id), loadMembers()]);
  } catch (e: any) {
    cf.err = e?.data?.message || "ออกใบประกาศไม่สำเร็จ";
  } finally {
    cf.busy = false;
  }
}
async function removeCert(m: Member, c: Cert) {
  if (!confirm(`ลบใบประกาศ "${c.title}" ของ ${m.name} ?`)) return;
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

async function load() {
  loadMembers();
  try {
    rows.value = await $fetch<Row[]>("/api/manage/claims", { headers: authHeaders() });
  } catch (e: any) {
    rows.value = [];
    if (e?.status === 403 || e?.statusCode === 403) forbidden.value = true;
  }
  loaded.value = true;
}
watchEffect(() => {
  if (isPending.value) return;
  if (!session.value) navigateTo("/login");
  else load();
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
  if (!file) return (error.value[id] = "กรุณาเลือกไฟล์ PDF ใบประกาศ");
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
    error.value[id] = e?.data?.message || "อนุมัติไม่สำเร็จ";
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
const impResult = ref<{ dryRun: boolean; create: number; skipped: { name: string; reason: string }[] } | null>(null);
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
async function runImport(dryRun: boolean) {
  impBusy.value = true;
  try {
    impResult.value = await $fetch("/api/manage/members/import", { method: "POST", body: { dryRun, rows: impRows.value }, headers: authHeaders() });
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
        <input v-model="keyInput" type="password" autocomplete="off" class="field max-w-xs" placeholder="รหัสแอดมิน (ADMIN_KEY)" />
        <button class="btn-brand px-5 py-2 text-sm">เข้าใช้งาน</button>
      </form>
    </div>
    <nav v-if="!forbidden" class="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
      <button v-for="t in ([['members', 'สมาชิกและใบประกาศ'], ['claims', `คำขอใบประกาศ${rows.some((r) => r.status === 'pending') ? ` (${rows.filter((r) => r.status === 'pending').length})` : ''}`], ['content', 'เนื้อหาเว็บ']] as const)" :key="t[0]"
        class="rounded-full px-5 py-2" :class="tab === t[0] ? 'bg-navy-800 text-white' : 'bg-white text-navy-800 shadow-sm'" @click="tab = t[0]">{{ t[1] }}</button>
    </nav>

    <section v-if="!forbidden && tab === 'content'" class="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-navy-800">จัดการเนื้อหาเว็บ</h2>
      <p class="mt-1 text-sm text-slate-600">แก้ไขบทความ คำถามที่พบบ่อย เอกสารแนบ หน้าเกี่ยวกับ/ความร่วมมือ และอัลบั้มรูป (เข้าสู่ระบบด้วย GitHub Token เดิม เมื่อบันทึกแล้วเว็บจะอัปเดตเอง)</p>
      <a :href="asset('/admin/')" target="_blank" class="btn-brand mt-4 inline-block px-6 py-3 text-sm">เปิดหน้าจัดการเนื้อหา</a>
    </section>

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
          <label class="text-xs text-slate-600">ไฟล์ PDF ใบประกาศ (ไม่เกิน 4MB) *
            <input type="file" accept="application/pdf" class="mt-1 block w-full text-sm" @change="files[r.id] = ($event.target as HTMLInputElement).files?.[0]" />
          </label>
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
      <h2 class="text-xl font-bold text-navy-800">นำเข้าสมาชิกจากรายชื่อ (Excel)</h2>
      <p class="mt-1 text-sm text-slate-600">เลือกไฟล์ .xlsx ที่มีชีต "VPP 1", "VPP 2", ... คอลัมน์ ชื่อ-สกุล / เบอร์โทรศัพท์ / อีเมล ระบบจะสร้างบัญชีสมาชิกที่ยังไม่มีรหัสผ่าน (ข้ามคนที่ไม่มีอีเมลหรือมีบัญชีแล้ว) สมาชิกเข้าสู่ระบบด้วย Google อีเมลเดียวกัน หรือใช้ "ลืมรหัสผ่าน" เพื่อตั้งรหัสผ่าน</p>
      <input type="file" accept=".xlsx" class="mt-4 block text-sm" @change="pickExcel" />
      <p v-if="impMsg" class="mt-2 text-sm text-slate-600">{{ impMsg }}</p>
      <div v-if="impRows.length" class="mt-3 flex gap-2">
        <button :disabled="impBusy" class="rounded-full border border-navy-800 px-5 py-2 text-sm text-navy-800 disabled:opacity-60" @click="runImport(true)">ตรวจสอบก่อน (ยังไม่สร้าง)</button>
        <button :disabled="impBusy || !impResult || !impResult.dryRun || !impResult.create" class="btn-brand px-5 py-2 text-sm disabled:opacity-50" @click="runImport(false)">ยืนยันนำเข้า</button>
      </div>
      <div v-if="impResult" class="mt-3 text-sm">
        <p class="font-semibold text-navy-800">{{ impResult.dryRun ? "ผลตรวจสอบ: จะสร้างสมาชิกใหม่" : "สร้างสมาชิกแล้ว" }} {{ impResult.create }} คน · ข้าม {{ impResult.skipped.length }} คน</p>
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
                </td>
                <td class="pr-3">{{ m.email }}</td>
                <td class="pr-3">{{ m.phone || "-" }}</td>
                <td class="pr-3">{{ m.cohort || "-" }}</td>
                <td class="whitespace-nowrap text-right">
                  <button class="mr-3 rounded-full border border-navy-800 px-3 py-1 text-xs text-navy-800 hover:bg-navy-800 hover:text-white" @click="toggleCerts(m)">ใบประกาศ ({{ m.certCount }})</button>
                  <button v-if="m.imported && !m.admin" class="text-xs text-red-600 hover:underline" @click="removeMember(m)">ลบ</button>
                </td>
              </tr>
              <tr v-if="openId === m.id" class="bg-sky-soft">
                <td colspan="5" class="px-4 py-4">
                  <p class="font-semibold text-navy-800">ใบประกาศของ {{ m.name }}</p>
                  <ul v-if="certs.length" class="mt-2 space-y-1">
                    <li v-for="c in certs" :key="c.id" class="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                      <span>{{ c.title }}<span v-if="c.certNo" class="text-slate-500"> · เลขที่ {{ c.certNo }}</span><span v-if="c.issuedOn" class="text-slate-500"> · {{ c.issuedOn }}</span></span>
                      <span class="whitespace-nowrap">
                        <a :href="`/api/certificates/${c.id}/file`" target="_blank" class="mr-3 text-xs text-navy-800 hover:underline">เปิดไฟล์</a>
                        <button class="text-xs text-red-600 hover:underline" @click="removeCert(m, c)">ลบ</button>
                      </span>
                    </li>
                  </ul>
                  <p v-else class="mt-1 text-xs text-slate-500">ยังไม่มีใบประกาศ</p>
                  <div class="mt-3 grid gap-2 md:grid-cols-2">
                    <label class="text-xs text-slate-600">ไฟล์ PDF ใบประกาศ (ไม่เกิน 4MB) *
                      <input type="file" accept="application/pdf" class="mt-1 block w-full text-sm" @change="cf.file = ($event.target as HTMLInputElement).files?.[0]" />
                    </label>
                    <input v-model="cf.title" class="field self-end" placeholder="ชื่อใบประกาศ (เว้นว่าง = ค่าเริ่มต้น)" />
                    <input v-model="cf.certNo" class="field" placeholder="เลขที่ใบประกาศ (ถ้ามี)" />
                    <label class="text-xs text-slate-600">วันที่ออกใบ <input v-model="cf.issuedOn" type="date" class="field mt-1" /></label>
                  </div>
                  <p v-if="cf.err" class="mt-2 text-sm text-red-700">{{ cf.err }}</p>
                  <p v-if="cf.ok" class="mt-2 text-sm text-green-700">{{ cf.ok }}</p>
                  <button :disabled="cf.busy" class="btn-brand mt-3 px-5 py-2 text-sm disabled:opacity-60" @click="issueCert(m)">ออกใบประกาศให้สมาชิกคนนี้</button>
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
