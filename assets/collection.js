document.querySelectorAll('.collection-category-filter-list-slider').forEach(el => {
  if (!el.classList.contains('swiper-initialized')) {
    const swiper = new Swiper(el, {
        loop: false,
        grabCursor: false,
        spaceBetween: 24,
        slidesPerGroup: 1,
        slidesPerView: 3,
        watchSlidesProgress: true,
        draggable: !0,
        autoHeight: !1,
        watchOverflow: !0,
        threshold: 10,
        mousewheel: {
            forceToAxis: !0
        },
        observer: true,
        observeParents: true,
        freeMode: !0,
        scrollbar: {
          el: ".swiper-scrollbar"
        },
        breakpoints: {
            0: {
                freeMode: !1,
                spaceBetween: 16,
                slidesPerView: "auto",
            },
            750: {
                spaceBetween: 16,
                slidesPerView: "auto",
            },
            990: {
                spaceBetween: 24,
                slidesPerView: "auto",
            },
            1440: {
              spaceBetween: 24,
              slidesPerView: 3,
            }
        }
    })

    const activeIndex = swiper.slides.findIndex((/** @type {HTMLElement} */ slide) => slide.querySelector('a.active'));
    if (activeIndex > -1) {
      swiper.slideTo(activeIndex, 0);
    }
  }
});