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

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const formatPrice = (value) => {
    const num = Number(value);
    return `${num.toLocaleString("ru-RU")} ₽`;
  };

  const formatArea = (value) => {
    const num = Number(value);
    return `${num.toLocaleString("ru-RU")} м²`;
  };

  // 🔥 ВОТ ТУТ УЖЕ ВСЁ ПОФИКШЕНО
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
        <div class="listing-img-wrap">
          <img class="listing-img" src="${imageUrl}">
        </div>
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

    const pageSize = getPageSize();
    const from = offset;
    const to = offset + pageSize - 1;

    const { data } = await buildQuery(from, to);

    if (!data || data.length === 0) {
      hasMore = false;
      return;
    }

    data.forEach((apt) => grid.appendChild(renderApartment(apt)));

    offset += data.length;
    hasMore = data.length === pageSize;

    isLoading = false;
  };

  loadApartments({ reset: true });
})();
