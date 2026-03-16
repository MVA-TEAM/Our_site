import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* ---------------- SUPABASE ---------------- */

const SUPABASE_URL = "https://vglbaobubaujvbqwdyvb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MjKF2P-22ePzCMlppBdvpQ_3K8NKvzQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------- HERO CARDS DRAG ---------------- */

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

/* ---------------- PROMO SLIDER ---------------- */

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

  prepSlides();
  updateDisabled();

  requestAnimationFrame(() => {
    track.classList.remove("is-init");
  });
})();

/* ---------------- APARTMENTS LOADING ---------------- */

(() => {
  const grid = document.getElementById("apartmentsGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const loadMoreWrap = loadMoreBtn ? loadMoreBtn.parentElement : null;

  if (!grid) return;

  let offset = 0;
  let isLoading = false;

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
        <img class="listing-img" src="${photoUrl}" alt="Интерьер квартиры">
        <div class="listing-body">
          <div class="listing-price">${price}</div>
          <div class="listing-chips">
            <span class="chip">${rooms} комн. кв.</span>
            <span class="chip">${area}</span>
            <span class="chip">${floor} этаж</span>
            <span class="chip">
              <img class="chip__icon" src="icons/метро.png" alt="">
              ${metroName}
            </span>
            <span class="chip">
              <img class="chip__icon" src="icons/бег.png" alt="">
              ${metroMinutes} мин
            </span>
          </div>
          <div class="listing-address">${address}</div>
        </div>
      </article>
    `;

    return col;
  };

  const showError = (message) => {
    grid.innerHTML = `
      <div class="col-12">
        <p>Ошибка загрузки: ${message}</p>
      </div>
    `;
    if (loadMoreBtn) loadMoreBtn.disabled = true;
  };

  const loadApartments = async (pageSize) => {
    if (isLoading) return;
    isLoading = true;
    if (loadMoreBtn) loadMoreBtn.disabled = true;

    const from = offset;
    const to = offset + pageSize - 1;

    const { data, error } = await supabase
      .from("apartments")
      .select("photo_url, price, rooms, area, floor, metro_name, metro_minutes, address, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      showError(error.message || "Неизвестная ошибка");
      isLoading = false;
      return;
    }

    if (!data || data.length === 0) {
      if (offset === 0) {
        grid.innerHTML = `
          <div class="col-12">
            <p>Нет доступных квартир.</p>
          </div>
        `;
      }
      if (loadMoreBtn) loadMoreBtn.disabled = true;
      isLoading = false;
      return;
    }

    data.forEach((apt) => grid.appendChild(renderApartment(apt)));
    offset += data.length;

    if (data.length < pageSize && loadMoreBtn) {
      loadMoreBtn.disabled = true;
    }

    if (loadMoreWrap) {
      loadMoreWrap.classList.add("col-12");
      loadMoreWrap.classList.add("d-flex");
      loadMoreWrap.classList.add("justify-content-center");
      grid.appendChild(loadMoreWrap);
    }

    if (loadMoreBtn) loadMoreBtn.disabled = false;
    isLoading = false;
  };

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => loadApartments(getPageSize()));
  }

  loadApartments(3);
})();

/* ---------------- CONTACT FORM ---------------- */

(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const firstNameInput = document.getElementById("firstName");
  const lastNameInput = document.getElementById("lastName");
  const phoneInput = document.getElementById("phone");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!firstName || !phone) {
      alert("Пожалуйста заполните имя и телефон");
      return;
    }

    const { error } = await supabase
      .from("site_clients_form")
      .insert([
        {
          form_first_name: firstName,
          form_last_name: lastName,
          form_phone: phone
        }
      ]);

    if (error) {
      alert("Ошибка отправки");
      console.error(error);
      return;
    }

    alert("Спасибо! Мы скоро вам перезвоним.");

    form.reset();
  });
})();
