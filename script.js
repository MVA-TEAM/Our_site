import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://vglbaobubaujvbqwdyvb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MjKF2P-22ePzCMlppBdvpQ_3K8NKvzQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(() => {
  const viewport = document.querySelector(".hero__cards");
  if (!viewport) return;

  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;

  const startDrag = (clientX) => {
    isDown = true;
    viewport.classList.add("is-dragging");
    document.body.classList.add("is-dragging");
    startX = clientX;
    startScrollLeft = viewport.scrollLeft;
  };

  const moveDrag = (clientX) => {
    if (!isDown) return;
    const dx = clientX - startX;
    viewport.scrollLeft = startScrollLeft - dx;
  };

  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    document.body.classList.remove("is-dragging");
  };

  viewport.addEventListener("dragstart", (e) => e.preventDefault());

  viewport.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(e.clientX);
  });

  document.addEventListener("mousemove", (e) => moveDrag(e.clientX));
  document.addEventListener("mouseup", endDrag);
})();

(() => {
  const track = document.getElementById("promoTrack");
  const dotsWrap = document.getElementById("promoDots");
  const prevBtn = document.getElementById("promoPrev");
  const nextBtn = document.getElementById("promoNext");

  if (!track || !dotsWrap || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.querySelectorAll(".promo-slide"));
  const dots = Array.from(dotsWrap.querySelectorAll(".promo-dot"));
  const slidesCount = slides.length;
  let current = 0;
  let isAnimating = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let isTouching = false;

  const setDot = () => {
    dots.forEach((d, i) => d.classList.toggle("promo-dot--active", i === current));
  };

  const prepSlides = () => {
    slides.forEach((s, i) => {
      s.classList.remove("is-active", "is-next", "is-prev");
      if (i === current) s.classList.add("is-active");
      else s.classList.add("is-next");
    });
    setDot();
  };

  const goTo = (nextIndex, dir) => {
    if (isAnimating || nextIndex === current) return;
    if (nextIndex < 0 || nextIndex >= slidesCount) return;

    isAnimating = true;

    const prevIndex = current;
    current = nextIndex;

    const prevSlide = slides[prevIndex];
    const nextSlide = slides[current];

    slides.forEach((s) => s.classList.remove("is-active", "is-next", "is-prev"));

    if (dir === "next") {
      prevSlide.classList.add("is-active");
      nextSlide.classList.add("is-next");
      void nextSlide.offsetWidth;
      prevSlide.classList.remove("is-active");
      prevSlide.classList.add("is-prev");
      nextSlide.classList.remove("is-next");
      nextSlide.classList.add("is-active");
    } else {
      prevSlide.classList.add("is-active");
      nextSlide.classList.add("is-prev");
      void nextSlide.offsetWidth;
      prevSlide.classList.remove("is-active");
      prevSlide.classList.add("is-next");
      nextSlide.classList.remove("is-prev");
      nextSlide.classList.add("is-active");
    }

    setDot();
    updateDisabled();

    setTimeout(() => {
      isAnimating = false;
    }, 420);
  };

  prevBtn.addEventListener("click", () => goTo(current - 1, "prev"));
  nextBtn.addEventListener("click", () => goTo(current + 1, "next"));

  dots.forEach((d) => {
    d.addEventListener("click", () => {
      const idx = Number(d.dataset.slide);
      if (Number.isNaN(idx)) return;
      goTo(idx, idx > current ? "next" : "prev");
    });
  });

  const updateDisabled = () => {
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slidesCount - 1;
  };

  prepSlides();
  updateDisabled();

  requestAnimationFrame(() => {
    track.classList.remove("is-init");
  });

  track.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      isTouching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  track.addEventListener(
    "touchend",
    (e) => {
      if (!isTouching) return;
      isTouching = false;
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 40) return;
      if (dx < 0) goTo(current + 1, "next");
      else goTo(current - 1, "prev");
    },
    { passive: true }
  );
})();

(() => {
  (() => {
  const grid = document.getElementById("apartmentsGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const filtersForm = document.getElementById("listingsFilters");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const metroSelect = document.getElementById("filterMetro");
  const roomsSelect = document.getElementById("filterRooms");

  if (!grid) return;

  let offset = 0;
  let isLoading = false;
  let hasMore = true;
  let activeFilters = {
    rooms: "",
    metro: "",
  };

  const getPageSize = () => {
    if (window.innerWidth >= 992) return 6;
    if (window.innerWidth >= 768) return 4;
    return 2;
  };

  const safeText = (value, fallback = "") => {
    if (value === null || value === undefined) return fallback;
    return String(value);
  };

  const escapeHtml = (value) =>
    safeText(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const formatPrice = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "";
    return `${num.toLocaleString("ru-RU")} ₽`;
  };

  const formatArea = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "";
    return `${num.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} м²`;
  };

  const renderApartment = (apt) => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    const rooms = safeText(apt.rooms, "—");
    const area = formatArea(apt.area);
    const floor = safeText(apt.floor, "—");
    const metroName = safeText(apt.metro_name, "");
    const metroMinutes = safeText(apt.metro_minutes, "");
    const price = formatPrice(apt.price);
    const address = safeText(apt.address, "");
    const photoUrl = safeText(apt.photo_url, "");

    col.innerHTML = `
      <article class="listing-card h-100">
        <img class="listing-img" src="${escapeHtml(photoUrl)}" alt="Интерьер квартиры">
        <div class="listing-body">
          <div class="listing-price">${escapeHtml(price)}</div>
          <div class="listing-chips">
            <span class="chip">${escapeHtml(rooms)} комн. кв.</span>
            <span class="chip">${escapeHtml(area)}</span>
            <span class="chip">${escapeHtml(floor)} этаж</span>
            <span class="chip">
              <img class="chip__icon" src="icons/метро.png" alt="">
              ${escapeHtml(metroName)}
            </span>
            <span class="chip">
              <img class="chip__icon" src="icons/бег.png" alt="">
              ${escapeHtml(metroMinutes)} мин
            </span>
          </div>
          <div class="listing-address">${escapeHtml(address)}</div>
        </div>
      </article>
    `;

    return col;
  };

  const showError = (message) => {
    grid.innerHTML = `
      <div class="col-12">
        <p>Ошибка загрузки: ${escapeHtml(message)}</p>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.disabled = true;
  };

  const updateLoadMoreState = () => {
    if (!loadMoreBtn) return;
    loadMoreBtn.disabled = isLoading || !hasMore;
    loadMoreBtn.style.display = hasMore ? "inline-block" : "none";
  };

  const buildQuery = (from, to) => {
    let query = supabase
      .from("apartments")
      .select("photo_url, price, rooms, area, floor, metro_name, metro_minutes, address, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (activeFilters.rooms) {
      if (activeFilters.rooms === "4") {
        query = query.gte("rooms", 4);
      } else {
        query = query.eq("rooms", Number(activeFilters.rooms));
      }
    }

    if (activeFilters.metro) {
      query = query.ilike("metro_name", `%${activeFilters.metro}%`);
    }

    return query;
  };

  const loadApartments = async ({ reset = false } = {}) => {
    if (isLoading) return;
    if (!hasMore && !reset) return;

    if (reset) {
      offset = 0;
      hasMore = true;
      grid.innerHTML = "";
    }

    isLoading = true;
    updateLoadMoreState();

    const pageSize = getPageSize();
    const from = offset;
    const to = offset + pageSize - 1;

    const { data, error } = await buildQuery(from, to);

    if (error) {
      showError(error.message || "Неизвестная ошибка");
      isLoading = false;
      updateLoadMoreState();
      return;
    }

    if (!data || data.length === 0) {
      if (offset === 0) {
        grid.innerHTML = `
          <div class="col-12">
            <p>По выбранным фильтрам квартир не найдено.</p>
          </div>
        `;
      }
      hasMore = false;
      isLoading = false;
      updateLoadMoreState();
      return;
    }

    data.forEach((apt) => grid.appendChild(renderApartment(apt)));
    offset += data.length;
    hasMore = data.length === pageSize;

    isLoading = false;
    updateLoadMoreState();
  };

  const applyFilters = () => {
    if (!filtersForm) return;

    const formData = new FormData(filtersForm);
    const rooms = safeText(formData.get("rooms")).trim();
    const metro = safeText(formData.get("metro")).trim();

    activeFilters = {
      rooms,
      metro,
    };
  };

  //  загрузка метро с учетом rooms
  const loadMetros = async () => {
    if (!metroSelect) return;

    metroSelect.innerHTML = `<option value="">Любое</option>`;

    let query = supabase
      .from("apartments")
      .select("metro_name");

    if (activeFilters.rooms) {
      if (activeFilters.rooms === "4") {
        query = query.gte("rooms", 4);
      } else {
        query = query.eq("rooms", Number(activeFilters.rooms));
      }
    }

    const { data, error } = await query;

    if (error || !data) return;

    const unique = Array.from(
      new Set(
        data
          .map((row) => safeText(row.metro_name, "").trim())
          .filter((name) => name.length > 0)
      )
    );

    unique.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      metroSelect.appendChild(option);
    });
  };

  
  if (roomsSelect) {
    roomsSelect.addEventListener("change", async () => {
      activeFilters.rooms = roomsSelect.value;
      await loadMetros();
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => loadApartments());
  }

  if (filtersForm) {
    filtersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilters();
      loadApartments({ reset: true });
    });
  }

  if (resetFiltersBtn && filtersForm) {
    resetFiltersBtn.addEventListener("click", async () => {
      filtersForm.reset();
      activeFilters = { rooms: "", metro: "" };
      await loadMetros(); 
      loadApartments({ reset: true });
    });
  }

  updateLoadMoreState();
  loadApartments({ reset: true });
  loadMetros(); 
})();

(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const phoneInput = document.getElementById("phone");

  const normalizeName = (value) => value.trim();
  const normalizePhone = (value) => value.replace(/\D/g, "").trim();
  const namePattern = /^[A-Za-zА-Яа-яЁё\s-]+$/;

  const setError = (input, message) => {
    if (!input) return;
    const errorEl = input.nextElementSibling && input.nextElementSibling.classList.contains("input-error")
      ? input.nextElementSibling
      : null;
    input.classList.add("is-invalid");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add("is-visible");
    }
  };

  const clearError = (input) => {
    if (!input) return;
    const errorEl = input.nextElementSibling && input.nextElementSibling.classList.contains("input-error")
      ? input.nextElementSibling
      : null;
    input.classList.remove("is-invalid");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.remove("is-visible");
    }
  };

  const validateNameField = (input) => {
    const value = normalizeName(input.value);
    if (!value) {
      setError(input, "Заполните поле");
      return false;
    }
    if (!namePattern.test(value)) {
      setError(input, "Данное поле может содержать буквы латинского алфавита и кириллицы");
      return false;
    }
    clearError(input);
    return true;
  };

  const validatePhoneField = (input) => {
    const value = normalizePhone(input.value);
    if (!value) {
      setError(input, "Заполните поле");
      return false;
    }
    if (!/^\d+$/.test(value)) {
      setError(input, "Данное поле может содержать только цифры");
      return false;
    }
    clearError(input);
    return true;
  };

  if (firstNameInput) {
    firstNameInput.addEventListener("input", () => {
      firstNameInput.value = normalizeName(firstNameInput.value);
      if (firstNameInput.classList.contains("is-invalid")) {
        validateNameField(firstNameInput);
      }
    });
    firstNameInput.addEventListener("blur", () => validateNameField(firstNameInput));
  }

  if (lastNameInput) {
    lastNameInput.addEventListener("input", () => {
      lastNameInput.value = normalizeName(lastNameInput.value);
      if (lastNameInput.classList.contains("is-invalid")) {
        validateNameField(lastNameInput);
      }
    });
    lastNameInput.addEventListener("blur", () => validateNameField(lastNameInput));
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = normalizePhone(phoneInput.value);
      if (phoneInput.classList.contains("is-invalid")) {
        validatePhoneField(phoneInput);
      }
    });
    phoneInput.addEventListener("blur", () => validatePhoneField(phoneInput));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = normalizeName(firstNameInput.value);
    const lastName = normalizeName(lastNameInput.value);
    const phone = normalizePhone(phoneInput.value);

    const isFirstValid = validateNameField(firstNameInput);
    const isLastValid = lastNameInput ? validateNameField(lastNameInput) : true;
    const isPhoneValid = validatePhoneField(phoneInput);

    if (!isFirstValid || !isLastValid || !isPhoneValid) return;

    const { error } = await supabase.from("site_clients_form").insert([
      {
        form_first_name: firstName,
        form_last_name: lastName,
        form_phone: phone,
      },
    ]);

    if (error) {
      alert("Ошибка отправки");
      console.error(error);
      return;
    }

    form.innerHTML = `
      <div class="form-success">
        <div class="form-success__icon" aria-hidden="true"></div>
        <p class="form-success__text">Спасибо за заявку, скоро вам перезвоним.</p>
      </div>
    `;
  });
})();
