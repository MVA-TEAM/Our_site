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

  const { data } = supabase
    .storage
    .from("apartments_ph")
    .getPublicUrl(apt.photo_url);

  const imageUrl = data.publicUrl;

  col.innerHTML = `
    <article class="listing-card h-100">
      <img class="listing-img" src="${imageUrl}">
      <div class="listing-body">
        <div class="listing-price">${formatPrice(apt.price)}</div>
        <div class="listing-chips">
          <span class="chip">${apt.rooms} комн.</span>
          <span class="chip">${formatArea(apt.area)}</span>
          <span class="chip">${apt.floor} этаж</span>
          <span class="chip">${apt.metro_name}</span>
          <span class="chip">${apt.metro_minutes} мин</span>
        </div>
        <div class="listing-address">${escapeHtml(apt.address)}</div>
      </div>
    </article>
  `;
  return col;
};

  const updateLoadMoreState = () => {
    if (!loadMoreBtn) return;
    const hasCards = grid && grid.querySelector(".listing-card");
    loadMoreBtn.disabled = isLoading || !hasMore;
    loadMoreBtn.style.display = hasMore && hasCards ? "inline-block" : "none";
  };

  const buildQuery = (from, to) => {
    let query = supabase
      .from("apartments")
      .select("*")
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
      query = query.eq("metro_name", activeFilters.metro);
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

    try {
      const pageSize = getPageSize();
      const from = offset;
      const to = offset + pageSize - 1;
      const { data, error } = await buildQuery(from, to);

      if (error) {
        showError(error.message || "Неизвестная ошибка");
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
        return;
      }

      data.forEach((apt) => grid.appendChild(renderApartment(apt)));

      offset += data.length;
      hasMore = data.length === pageSize;
    } catch (err) {
      showError(err?.message || "Неизвестная ошибка");
    } finally {
      isLoading = false;
      updateLoadMoreState();
    }
  };


  const loadMetros = async () => {
    metroSelect.innerHTML = `<option value="">Любое</option>`;

    const roomsValue = roomsSelect.value;

    const { data } = await supabase
      .from("apartments")
      .select("metro_name, rooms");

    const filtered = data.filter((row) => {
      if (!roomsValue) return true;
      if (roomsValue === "4") return row.rooms >= 4;
      return row.rooms === Number(roomsValue);
    });

    const unique = [...new Set(filtered.map((r) => r.metro_name))];

    unique.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      metroSelect.appendChild(opt);
    });
  };

  
  roomsSelect.addEventListener("change", async () => {
    await loadMetros();
  });

    if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => loadApartments());
  }
filtersForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    activeFilters.rooms = roomsSelect.value;
    activeFilters.metro = metroSelect.value;

    await loadApartments({ reset: true });
  });

  resetFiltersBtn.addEventListener("click", async () => {
    filtersForm.reset();
    activeFilters = { rooms: "", metro: "" };

    await loadMetros();
    await loadApartments({ reset: true });
  });

  loadMetros();
  loadApartments({ reset: true });
})();

(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const phoneInput = document.getElementById("phone");

  const normalizeName = (value) => value.trim();
  const normalizePhone = (value) => value.trim();
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
  const value = input.value.trim();

  const phonePattern = /^(\+7|8)\d{10}$/;

  if (!value) {
    setError(input, "Заполните поле");
    return false;
  }

  if (!phonePattern.test(value)) {
    setError(input, "Введите номер в формате +79115556677 или 89115556677");
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
