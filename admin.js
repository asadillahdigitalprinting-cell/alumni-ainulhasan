(() => {
  const $ = (id) => document.getElementById(id);
  $("yearNow").textContent = new Date().getFullYear();
  const config = window.APP_CONFIG || {};
  const configured = config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
    !config.SUPABASE_URL.includes("ISI_") && !config.SUPABASE_ANON_KEY.includes("ISI_");
  const message = $("adminMessage");
  let client = null;
  let allRows = [];

  function notice(text, type = "") {
    message.textContent = text;
    message.className = "notice " + type;
    message.classList.remove("hidden");
  }
  function hideNotice() { message.classList.add("hidden"); }
  function isConfigured() {
    if (!configured || !window.supabase) {
      notice("Konfigurasi Supabase belum diisi. Lengkapi config.js terlebih dahulu.", "warning");
      $("loginForm").querySelectorAll("input,button").forEach(el => el.disabled = true);
      return false;
    }
    client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    return true;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
  }
  function formatYear(value) { return value ? String(value) : "—"; }
  function setLoggedIn(on) {
    $("loginPanel").classList.toggle("hidden", on);
    $("dashboardPanel").classList.toggle("hidden", !on);
    $("logoutButton").classList.toggle("hidden", !on);
  }
  async function checkSession() {
    if (!client) return;
    const { data: { session } } = await client.auth.getSession();
    if (!session) { setLoggedIn(false); return; }
    const { data: adminRow, error } = await client.from("admin_users").select("user_id").eq("user_id", session.user.id).maybeSingle();
    if (error || !adminRow) {
      await client.auth.signOut();
      setLoggedIn(false);
      notice("Akun berhasil dikenali, tetapi belum terdaftar sebagai admin. Tambahkan user ID melalui SQL Editor Supabase sesuai panduan.", "error");
      return;
    }
    setLoggedIn(true);
    await loadAlumni();
  }
  async function loadAlumni() {
    hideNotice();
    $("alumniRows").innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';
    const { data, error } = await client.from("alumni").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      notice("Gagal mengambil data. Periksa policy RLS dan status admin di Supabase.", "error");
      $("alumniRows").innerHTML = '<tr><td colspan="6">Data tidak dapat dimuat.</td></tr>';
      return;
    }
    allRows = data || [];
    $("totalCount").textContent = allRows.length;
    $("pendingCount").textContent = allRows.filter(r => r.status === "pending").length;
    $("verifiedCount").textContent = allRows.filter(r => r.status === "verified").length;
    const years = [...new Set(allRows.map(r => r.graduation_year).filter(Boolean))].sort((a,b) => b-a);
    const selected = $("yearFilter").value;
    $("yearFilter").innerHTML = '<option value="all">Semua tahun lulus</option>' + years.map(y => `<option value="${y}">${y}</option>`).join("");
    if (years.map(String).includes(selected)) $("yearFilter").value = selected;
    renderRows();
  }
  function renderRows() {
    const q = $("searchInput").value.trim().toLowerCase();
    const status = $("statusFilter").value;
    const year = $("yearFilter").value;
    const rows = allRows.filter(r => {
      const haystack = [r.full_name,r.whatsapp,r.city,r.occupation].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) &&
        (status === "all" || r.status === status) &&
        (year === "all" || String(r.graduation_year || "") === year);
    });
    if (!rows.length) {
      $("alumniRows").innerHTML = '<tr><td colspan="6">Tidak ada data yang cocok.</td></tr>';
      return;
    }
    $("alumniRows").innerHTML = rows.map(r => `
      <tr>
        <td><strong>${escapeHtml(r.full_name)}</strong><br><span class="muted">${escapeHtml(r.gender || "—")}</span></td>
        <td>${escapeHtml(formatYear(r.entry_year))} / ${escapeHtml(formatYear(r.graduation_year))}</td>
        <td>${escapeHtml(r.whatsapp)}</td>
        <td>${escapeHtml(r.city || "—")}</td>
        <td><span class="status ${r.status === "verified" ? "verified" : "pending"}">${r.status === "verified" ? "Terverifikasi" : "Menunggu"}</span></td>
        <td>${r.status === "verified" ? `<button class="action-btn" data-action="pending" data-id="${escapeHtml(r.id)}">Batalkan verifikasi</button>` : `<button class="action-btn" data-action="verified" data-id="${escapeHtml(r.id)}">Verifikasi</button>`} <button class="action-btn danger" data-action="delete" data-id="${escapeHtml(r.id)}">Hapus</button></td>
      </tr>`).join("");
  }
  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!client) return;
    hideNotice();
    const button = $("loginForm").querySelector("button");
    button.disabled = true;
    try {
      const { error } = await client.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
      if (error) throw error;
      await checkSession();
    } catch (error) {
      notice("Login gagal. Periksa email/kata sandi dan pastikan akun sudah terdaftar sebagai admin.", "error");
    } finally { button.disabled = false; }
  });
  $("logoutButton").addEventListener("click", async () => {
    await client.auth.signOut();
    setLoggedIn(false);
    notice("Anda sudah keluar dari dashboard.");
  });
  $("refreshButton").addEventListener("click", loadAlumni);
  ["searchInput","statusFilter","yearFilter"].forEach(id => $(id).addEventListener(id === "searchInput" ? "input" : "change", renderRows));
  $("alumniRows").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (action === "delete" && !confirm("Yakin ingin menghapus data alumni ini? Tindakan ini tidak dapat dibatalkan.")) return;
    button.disabled = true;
    let result;
    if (action === "delete") result = await client.from("alumni").delete().eq("id", id);
    else result = await client.from("alumni").update({ status: action }).eq("id", id);
    if (result.error) {
      notice("Perubahan gagal. Periksa hak akses admin di database.", "error");
    } else {
      notice(action === "delete" ? "Data alumni telah dihapus." : "Status alumni berhasil diperbarui.");
      await loadAlumni();
    }
    button.disabled = false;
  });
  $("exportButton").addEventListener("click", () => {
    if (!allRows.length) { notice("Belum ada data untuk diekspor.", "warning"); return; }
    if (!window.XLSX) { notice("Pustaka ekspor Excel tidak berhasil dimuat. Periksa koneksi internet lalu coba lagi.", "error"); return; }
    const q = $("searchInput").value.trim().toLowerCase();
    const status = $("statusFilter").value;
    const year = $("yearFilter").value;
    const rows = allRows.filter(r => {
      const haystack = [r.full_name,r.whatsapp,r.city,r.occupation].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) && (status === "all" || r.status === status) &&
        (year === "all" || String(r.graduation_year || "") === year);
    }).map(r => ({
      "Nama Lengkap": r.full_name, "Jenis Kelamin": r.gender, "Tahun Masuk": r.entry_year,
      "Tahun Lulus": r.graduation_year, "WhatsApp": r.whatsapp, "Domisili": r.city,
      "Pendidikan Terakhir": r.education, "Pekerjaan": r.occupation, "Pesan": r.message,
      "Status": r.status === "verified" ? "Terverifikasi" : "Menunggu",
      "Tanggal Daftar": r.created_at
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Data Alumni");
    XLSX.writeFile(book, "Rekap-Alumni-Ainul-Hasan.xlsx");
  });
  if (isConfigured()) checkSession();
})();