document.querySelectorAll('.index-feature-collections-title-slider').forEach(el => {
  if (!el.classList.contains('swiper-initialized')) {
    new Swiper(el, {
        loop: false,
        grabCursor: true,
        spaceBetween: 40,
        slidesPerGroup: 1,
        slidesPerView: "auto",
        watchSlidesProgress: true,
        draggable: !0,
        autoHeight: !1,
        watchOverflow: !0,
        threshold: 10,
        mousewheel: {
            forceToAxis: !0
        },
        scrollbar: {
            el: ".swiper-scrollbar"
        },
        observer: true,
        observeParents: true,
        breakpoints: {
            0: {
                spaceBetween: 32
            },
            750: {
                spaceBetween: 40
            },
            990: {
            },
            1200: {
            },
            1440: {
            }
        }
    })
  }
});

document.querySelectorAll('.index-feature-collections-items-slider').forEach(el => {
  if (!el.classList.contains('swiper-initialized')) {
    new Swiper(el, {
        loop: false,
        grabCursor: true,
        spaceBetween: 16,
        slidesPerGroup: 1,
        slidesPerView: "auto",
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
        breakpoints: {
            0: {
                freeMode: !1
            },
            750: {
            },
            990: {
            },
            1200: {
            },
            1440: {
            }
        }
    })
  }
});