(() => {
  const form = document.getElementById("alumniForm");
  const message = document.getElementById("formMessage");
  const warning = document.getElementById("configWarning");
  document.getElementById("yearNow").textContent = new Date().getFullYear();

  const config = window.APP_CONFIG || {};
  const configured = config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
    !config.SUPABASE_URL.includes("ISI_") && !config.SUPABASE_ANON_KEY.includes("ISI_");
  if (!configured || !window.supabase) {
    warning.classList.remove("hidden");
    form.querySelectorAll("input,select,textarea,button").forEach(el => el.disabled = true);
    return;
  }

  const client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  function showMessage(text, type) {
    message.textContent = text;
    message.className = "notice " + (type || "");
    message.classList.remove("hidden");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!document.getElementById("consent").checked) {
      showMessage("Mohon centang persetujuan penggunaan data sebelum mengirim.", "error");
      return;
    }
    const button = document.getElementById("submitButton");
    button.disabled = true;
    button.textContent = "Mengirim data...";
    const data = {
      full_name: form.full_name.value.trim(),
      gender: form.gender.value,
      entry_year: form.entry_year.value ? Number(form.entry_year.value) : null,
      graduation_year: form.graduation_year.value ? Number(form.graduation_year.value) : null,
      whatsapp: form.whatsapp.value.trim(),
      city: form.city.value.trim() || null,
      education: form.education.value || null,
      occupation: form.occupation.value.trim() || null,
      message: form.message.value.trim() || null,
      consent: true,
      status: "pending"
    };
    try {
      const { error } = await client.from("alumni").insert(data);
      if (error) throw error;
      form.reset();
      showMessage("Alhamdulillah, data berhasil dikirim. Data akan diperiksa oleh pengelola alumni.", "");
    } catch (error) {
      console.error(error);
      showMessage("Data belum berhasil dikirim. Periksa koneksi internet atau hubungi admin. Jika masalah berlanjut, admin perlu memeriksa konfigurasi database.", "error");
    } finally {
      button.disabled = false;
      button.innerHTML = 'Kirim Data Alumni <span>→</span>';
    }
  });
})();