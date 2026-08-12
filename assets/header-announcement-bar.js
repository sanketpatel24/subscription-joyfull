document.querySelectorAll('.header-announcement-bar-slider').forEach(el => {
    if (!el.classList.contains('swiper-initialized')) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        new Swiper(el, {
            loop: true,
            grabCursor: true,
            spaceBetween: 0,
            slidesPerView: 1,
            watchSlidesProgress: true,
            draggable:!0,
            autoHeight:!1,
            watchOverflow:!0,
            threshold:10,
            keyboard:{
                enabled:!0,
                onlyInViewport:!0
            },
            mousewheel:{
                forceToAxis:!0
            },
            effect: "fade",
            speed: 300,
            fadeEffect: {
                crossFade: true,
            },
            autoplay: prefersReducedMotion ? false : {
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            }
        })
    }
})