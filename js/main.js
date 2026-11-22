(() => {
  // ===== Burger dropdown =====
  const burgerBtn = document.getElementById("burgerBtn");
  const burgerMenu = document.getElementById("burgerMenu");

  const openBurger = () => {
    if (!burgerMenu) return;
    burgerMenu.hidden = false;
    burgerBtn?.setAttribute("aria-expanded", "true");
  };

  const closeBurger = () => {
    if (!burgerMenu) return;
    burgerMenu.hidden = true;
    burgerBtn?.setAttribute("aria-expanded", "false");
  };

  burgerBtn?.addEventListener("click", () => {
    if (!burgerMenu) return;
    burgerMenu.hidden ? openBurger() : closeBurger();
  });

  // Close burger when clicking outside
  document.addEventListener("click", (e) => {
    if (!burgerMenu || burgerMenu.hidden) return;
    const t = e.target;
    if (!t) return;
    if (burgerMenu.contains(t) || burgerBtn?.contains(t)) return;
    closeBurger();
  });

  // Close burger on link click (anchors)
  document.querySelectorAll("[data-menu-close]").forEach((el) => {
    el.addEventListener("click", () => closeBurger());
  });

  // ===== Modal (Contact Form) =====
  const modal = document.getElementById("contactModal");
  const openModalBtns = document.querySelectorAll("[data-open-modal]");
  const closeModalEls = document.querySelectorAll("[data-close-modal]");

  const openModal = () => {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openModalBtns.forEach((btn) => btn.addEventListener("click", openModal));
  closeModalEls.forEach((el) => el.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeBurger();
      if (modal && !modal.hidden) closeModal();
    }
  });

  // Prevent clicks inside panel from closing (backdrop has handler)
  modal?.querySelector(".modal__panel")?.addEventListener("click", (e) => e.stopPropagation());

  // Real submit via FormSubmit (AJAX) + status
  const form = document.getElementById("bookingForm");
  const status = document.getElementById("formStatus");

  // Messages come from the page (data-msg-* on the form), in the page's language
  const msg = (key, fallback) => (form && form.dataset["msg" + key[0].toUpperCase() + key.slice(1)]) || fallback;

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.action) {
      if (status) status.textContent = "Error: no hay action en el formulario.";
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');

    // Ignore extra clicks while a request is already being sent
    if (form.dataset.sending === "1") return;
    form.dataset.sending = "1";

    let sent = false;

    try {
      if (submitBtn) submitBtn.disabled = true;
      if (status) status.textContent = msg("sending", "Enviando…");

      const fd = new FormData(form);

      // FormSubmit's AJAX endpoint answers with JSON instead of redirecting.
      // Posting to the normal endpoint made fetch fail after the email was
      // already sent, so clients saw an error and submitted again.
      const ajaxUrl = form.action.replace("formsubmit.co/", "formsubmit.co/ajax/");

      const res = await fetch(ajaxUrl, {
        method: "POST",
        body: fd,
        headers: { "Accept": "application/json" }
      });

      const data = await res.json().catch(() => ({}));
      sent = res.ok && String(data.success) !== "false";

      if (sent) {
        if (status) status.textContent = msg("ok", "✅ ¡Gracias! Hemos recibido tu solicitud.");
        form.reset();

        // обновим плейсхолдеры/оверлеи, если нужно
        document.querySelectorAll(".mselect").forEach((wrap) => {
          const sel = wrap.querySelector("select");
          const ph = wrap.querySelector("[data-placeholder]");
          if (sel && ph) ph.classList.toggle("is-hidden", sel.value !== "");
        });

        const dateWrap = document.querySelector(".mdate");
        if (dateWrap) {
          const dateInput = dateWrap.querySelector("#dateField");
          const datePh = dateWrap.querySelector("[data-date-placeholder]");
          if (dateInput && datePh) datePh.classList.toggle("is-hidden", !!dateInput.value);
        }

        // Close the modal after a pause; keep the button locked until then
        setTimeout(() => {
          if (typeof closeModal === "function") closeModal();
          if (status) status.textContent = "";
          if (submitBtn) submitBtn.disabled = false;
          form.dataset.sending = "";
        }, 2500);
      } else {
        if (status) status.textContent = msg("error", "❌ Error al enviar. Llámanos: +34 684 301 949");
      }
    } catch (err) {
      if (status) status.textContent = msg("network", "❌ Error de conexión. Llámanos: +34 684 301 949");
    } finally {
      if (!sent) {
        if (submitBtn) submitBtn.disabled = false;
        form.dataset.sending = "";
      }
    }
  });

  // ===== Services slider arrows =====
  const track = document.getElementById("servicesTrack");
  const prev = document.getElementById("prevService");
  const next = document.getElementById("nextService");

  const scrollByCard = (dir) => {
    if (!track) return;
    const card = track.querySelector(".service-card");
    const cardW = card ? card.getBoundingClientRect().width : 260;
    track.scrollBy({ left: dir * (cardW + 14), behavior: "smooth" });
  };

  prev?.addEventListener("click", () => scrollByCard(-1));
  next?.addEventListener("click", () => scrollByCard(1));

  // ===== Date: default today + min today + block Sunday =====
  const dateField = document.getElementById("dateField");
  const dateWarning = document.getElementById("dateWarning");
  const submitBtn = document.querySelector(".msubmit");

  const toISODate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const checkSunday = () => {
    if (!dateField) return;

    const val = dateField.value;
    if (!val) return;

    const selected = new Date(val + "T00:00:00");
    const isSunday = selected.getDay() === 0; // Sunday = 0

    if (dateWarning) dateWarning.hidden = !isSunday;
    if (submitBtn) submitBtn.disabled = isSunday;

    if (submitBtn) {
      submitBtn.style.opacity = isSunday ? "0.5" : "1";
      submitBtn.style.cursor = isSunday ? "not-allowed" : "pointer";
    }
  };

  if (dateField) {
    const today = new Date();
    const iso = toISODate(today);

    dateField.min = iso;

    checkSunday();
    dateField.addEventListener("change", checkSunday);
  }

  // ===== Gold placeholder overlays for selects + date =====
  const bindSelectPlaceholder = (wrap) => {
    const sel = wrap.querySelector("select");
    const ph = wrap.querySelector("[data-placeholder]");
    if (!sel || !ph) return;

    const update = () => {
      ph.classList.toggle("is-hidden", sel.value !== "");
    };

    update();
    sel.addEventListener("change", update);
  };

  document.querySelectorAll(".mselect").forEach(bindSelectPlaceholder);

  // Date placeholder overlay
  const dateWrap = document.querySelector(".mdate");
  if (dateWrap) {
    const dateInput = dateWrap.querySelector("#dateField");
    const datePh = dateWrap.querySelector("[data-date-placeholder]");
    const updDate = () => {
      if (!dateInput || !datePh) return;
      datePh.classList.toggle("is-hidden", !!dateInput.value);
    };
    updDate();
    dateInput?.addEventListener("change", updDate);
  }

  // ===== Language switcher =====
  const langBox = document.querySelector(".lang");
  if (langBox) {
    const current = document.documentElement.lang;
    langBox.querySelectorAll("a[data-lang]").forEach((a) => {
      if (a.dataset.lang === current) a.setAttribute("aria-current", "true");
      // Remember the visitor's choice so the main address opens in it next time
      a.addEventListener("click", () => {
        try { localStorage.setItem("va-lang", a.dataset.lang); } catch (err) {}
      });
    });
    // Close when clicking elsewhere or pressing Escape
    document.addEventListener("click", (e) => {
      if (langBox.open && !langBox.contains(e.target)) langBox.open = false;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") langBox.open = false;
    });
    // Opening the language list closes the burger menu and vice versa
    langBox.addEventListener("toggle", () => { if (langBox.open) closeBurger(); });
    burgerBtn?.addEventListener("click", () => { langBox.open = false; });
  }
})();

// ===== WhatsApp Business (+34 684 301 949) =====
(() => {
  const WA = "34684301949";
  const t = document.getElementById("waTexts");
  const hello = (t && t.dataset.hello) || "";
  const waUrl = (text) => "https://wa.me/" + WA + (text ? "?text=" + encodeURIComponent(text) : "");

  // Every WhatsApp link opens the chat with a greeting in the page's language
  document.querySelectorAll("a[data-wa]").forEach((a) => { a.href = waUrl(hello); });

  // "Book via WhatsApp" in the booking form: send the chosen details as a message
  const btn = document.getElementById("waBook");
  const form = document.getElementById("bookingForm");
  if (!btn || !form) return;
  btn.addEventListener("click", () => {
    const sel = form.querySelector('select[name="service"]');
    const service = sel && sel.value ? sel.selectedOptions[0].textContent.trim() : "";
    const date = form.date && form.date.value
      ? new Date(form.date.value + "T00:00:00").toLocaleDateString(document.documentElement.lang, { weekday: "long", day: "numeric", month: "long" })
      : "";
    const time = form.time && form.time.value ? form.time.value : "";
    const name = form.name && form.name.value ? form.name.value.trim() : "";
    let text = hello;
    if (service || date || time) {
      text = [(t && t.dataset.intro) || hello,
              service && "• " + service,
              (date || time) && "• " + [date, time].filter(Boolean).join(", "),
              name && "• " + name].filter(Boolean).join("\n");
    }
    window.open(waUrl(text), "_blank", "noopener");
  });
})();

// ===== Google Maps: load only when the visitor asks for it =====
(() => {
  const box = document.getElementById("mapBox");
  const btn = document.getElementById("mapShow");
  if (!box || !btn) return;
  btn.addEventListener("click", () => {
    const f = document.createElement("iframe");
    f.src = box.dataset.src;
    f.title = box.dataset.title || "Google Maps";
    f.loading = "lazy";
    f.referrerPolicy = "no-referrer-when-downgrade";
    f.allowFullscreen = true;
    box.innerHTML = "";
    box.appendChild(f);
  });
})();
