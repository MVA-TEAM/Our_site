// 1) Горизонтальная прокрутка карточек услуг колесиком — только когда курсор над лентой
(() => {
  const track = document.getElementById("servicesTrack");
  if (!track) return;

  track.addEventListener(
    "wheel",
    (e) => {
      const isMostlyVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      if (!isMostlyVertical) return;

      e.preventDefault();
      track.scrollLeft += e.deltaY;
    },
    { passive: false }
  );
})();

// 2) Promo slider 
(() => {
  const track = document.getElementById("promoTrack");
  const markersWrap = document.getElementById("promoMarkers");
  const prevBtn = document.getElementById("promoPrev");
  const nextBtn = document.getElementById("promoNext");

  if (!track || !markersWrap || !prevBtn || !nextBtn) return;

  const markers = Array.from(markersWrap.querySelectorAll(".promo-marker"));
  const slidesCount = track.children.length;
  let current = 0;

  const setActive = (index) => {
    current = (index + slidesCount) % slidesCount;
    track.style.transform = `translateX(-${current * 100}%)`;
    markers.forEach((m, i) => m.classList.toggle("is-active", i === current));
  };

  prevBtn.addEventListener("click", () => setActive(current - 1));
  nextBtn.addEventListener("click", () => setActive(current + 1));

  markers.forEach((m) => {
    m.addEventListener("click", () => {
      const idx = Number(m.dataset.slide);
      if (!Number.isNaN(idx)) setActive(idx);
    });
  });

  setActive(0);
})();