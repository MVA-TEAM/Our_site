import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

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

  const press = (btn, pressed) => btn.classList.toggle("is-pressed", pressed);
  [prevBtn, nextBtn].forEach((btn) => {
    btn.addEventListener("mousedown", () => press(btn, true));
    btn.addEventListener("mouseup", () => press(btn, false));
    btn.addEventListener("mouseleave", () => press(btn, false));
    btn.addEventListener("touchstart", () => press(btn, true), { passive: true });
    btn.addEventListener("touchend", () => press(btn, false));
  });

  prepSlides();
  updateDisabled();

  requestAnimationFrame(() => {
    track.classList.remove("is-init");
  });
})();

(() => {
  const SUPABASE_URL = "https://vglbaobubaujvbqwdyvb.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_MjKF2P-22ePzCMlppBdvpQ_3K8NKvzQ";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const grid = document.getElementById("apartmentsGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const filtersForm = document.getElementById("listingsFilters");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");

  if (!grid) return;

  let offset = 0;
  let isLoading = false;
  let hasMore = true;
  let activeFilters = {
    rooms: "",
    priceMin: null,
    priceMax: null,
  };

  const getPageSize = () => {
    if (window.innerWidth >= 992) return 6;
    if (window.innerWidth >= 768) return 4;
    return 2;
  };

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

  const renderApartment = (apt) => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    const rooms = safeText(apt.rooms, "—");
    const area = formatArea(apt.area);
    const floor = safeText(apt.floor, "—");
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
      .select("photo_url, price, rooms, area, floor, address, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (activeFilters.rooms) {
      if (activeFilters.rooms === "4") {
        query = query.gte("rooms", 4);
      } else {
        query = query.eq("rooms", Number(activeFilters.rooms));
      }
    }

    if (activeFilters.priceMin !== null) {
      query = query.gte("price", activeFilters.priceMin);
    }

    if (activeFilters.priceMax !== null) {
      query = query.lte("price", activeFilters.priceMax);
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

  const parseNumberInput = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const applyFilters = () => {
    if (!filtersForm) return;
    const formData = new FormData(filtersForm);
    const rooms = safeText(formData.get("rooms"), "").trim();
    let priceMin = parseNumberInput(formData.get("priceMin"));
    let priceMax = parseNumberInput(formData.get("priceMax"));

    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      const temp = priceMin;
      priceMin = priceMax;
      priceMax = temp;
    }

    activeFilters = {
      rooms,
      priceMin,
      priceMax,
    };
  };

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => loadApartments());
    loadMoreBtn.addEventListener("mousedown", () => loadMoreBtn.classList.add("is-pressed"));
    loadMoreBtn.addEventListener("mouseup", () => loadMoreBtn.classList.remove("is-pressed"));
    loadMoreBtn.addEventListener("mouseleave", () => loadMoreBtn.classList.remove("is-pressed"));
    loadMoreBtn.addEventListener("touchstart", () => loadMoreBtn.classList.add("is-pressed"), { passive: true });
    loadMoreBtn.addEventListener("touchend", () => loadMoreBtn.classList.remove("is-pressed"));
  }

  if (filtersForm) {
    filtersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      applyFilters();
      loadApartments({ reset: true });
    });
  }

  if (resetFiltersBtn && filtersForm) {
    resetFiltersBtn.addEventListener("click", () => {
      filtersForm.reset();
      activeFilters = {
        rooms: "",
        priceMin: null,
        priceMax: null,
      };
      loadApartments({ reset: true });
    });
  }

  updateLoadMoreState();
  loadApartments({ reset: true });
})();
