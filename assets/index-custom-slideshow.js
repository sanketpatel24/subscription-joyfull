function isMenuDrawerOpen() {
    return document.querySelector('.menu-drawer-container.menu-open') !== null;
}

function applyHeaderTransparency(slide) {
    const header = document.querySelector('#header-component');
    if (!header || !slide) return;

    if (isMenuDrawerOpen()) return;

    const wantsTransparent = slide.getAttribute('data-need-transparent-header') === 'true';
    header.setAttribute('data-slide-wants-transparent', wantsTransparent ? 'true' : 'false');

    header.querySelectorAll('.header__row').forEach(row => {
        [
            ['--border-bottom-width', 'borderWidthBeforeTransparent'],
            ['--border-bottom-width-mobile', 'borderWidthMobileBeforeTransparent'],
        ].forEach(([property, cacheKey]) => {
            if (wantsTransparent) {
                if (row.dataset[cacheKey] === undefined) {
                    row.dataset[cacheKey] = row.style.getPropertyValue(property);
                }
                row.style.setProperty(property, '0px');
            } else if (row.dataset[cacheKey] !== undefined) {
                row.style.setProperty(property, row.dataset[cacheKey]);
                delete row.dataset[cacheKey];
            }
        });
    });
}

function pauseAutoplayWhileDrawerOpen(swiperInstances) {
    const details = document.getElementById('Details-menu-drawer-container');
    if (!details) return;

    details.addEventListener('toggle', () => {
        for (const swiper of swiperInstances) {
            if (!swiper?.autoplay) continue;
            if (details.open) {
                swiper.autoplay.stop();
            } else {
                swiper.autoplay.start();
            }
        }
    });
}

document.querySelectorAll('.slideshow .swiper-wrapper').forEach(wrapper => {
    if (!wrapper.closest('.index-custom-slideshow-slider')) {
        applyHeaderTransparency(wrapper.querySelector('.swiper-slide'));
    }
});

const indexCustomSlideshowInstances = [];

document.querySelectorAll('.index-custom-slideshow-slider').forEach(el => {
    if (!el.classList.contains('swiper-initialized')) {
        const swiper = new Swiper(el, {
            loop: true,
            grabCursor: false,
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
            autoplay: {
                delay: 6000,
                disableOnInteraction: false,
            },
            on: {
                init(swiper) {
                    applyHeaderTransparency(swiper.slides[swiper.activeIndex]);
                },
                slideChange(swiper) {
                    applyHeaderTransparency(swiper.slides[swiper.activeIndex]);
                },
            },
        });

        indexCustomSlideshowInstances.push(swiper);
    }
})

pauseAutoplayWhileDrawerOpen(indexCustomSlideshowInstances);