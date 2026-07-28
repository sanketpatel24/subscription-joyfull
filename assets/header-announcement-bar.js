document.querySelectorAll('.header-announcement-bar-slider').forEach(el => {
    if (!el.classList.contains('swiper-initialized')) {
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
            mousewheel:{
                forceToAxis:!0
            },
            effect: "fade",
            speed: 300,
            fadeEffect: {
                crossFade: true,
            },
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            }
        })
    }
})