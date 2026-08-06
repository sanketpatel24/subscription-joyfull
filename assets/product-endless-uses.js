(function () {
  const ROOT_SELECTOR = '[data-product-endless-uses]';
  const CAROUSEL_SELECTOR = '[data-product-endless-uses-carousel]';
  const TABLIST_SELECTOR = '[data-product-endless-uses-tablist]';
  const TAB_SELECTOR = '[data-product-endless-uses-tab]';
  const SLIDE_SELECTOR = '[data-product-endless-uses-slide]';

  const MOBILE_QUERY = '(max-width: 989px)';
  const SWIPER_SPEED = 400;

  const instances = new WeakMap();

  function debounce(callback, wait) {
    let timer = null;
    return function debounced() {
      window.clearTimeout(timer);
      timer = window.setTimeout(callback, wait);
    };
  }

  class ProductEndlessUses {
    constructor(root) {
      this.root = root;
      this.carousel = root.querySelector(CAROUSEL_SELECTOR);
      this.tablist = root.querySelector(TABLIST_SELECTOR);
      this.tabs = Array.prototype.slice.call(root.querySelectorAll(TAB_SELECTOR));
      this.slides = Array.prototype.slice.call(root.querySelectorAll(SLIDE_SELECTOR));
      this.videos = Array.prototype.slice.call(root.querySelectorAll('video'));

      if (!this.carousel || this.slides.length === 0) return;

      this.swiper = null;
      this.activeIndex = 0;
      this.mobileQuery = window.matchMedia(MOBILE_QUERY);
      this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      this.handleBreakpointChange = () => this.syncBreakpoint();
      this.handleResize = debounce(this.handleBreakpointChange, 200);
      this.handleTabClick = (event) => {
        const tab = event.currentTarget;
        this.goTo(Number(tab.dataset.index) || 0);
      };
      this.handleTabKeydown = (event) => this.onTabKeydown(event);

      for (const tab of this.tabs) {
        tab.addEventListener('click', this.handleTabClick);
        tab.addEventListener('keydown', this.handleTabKeydown);
      }

      if (typeof this.mobileQuery.addEventListener === 'function') {
        this.mobileQuery.addEventListener('change', this.handleBreakpointChange);
      } else {
        window.addEventListener('resize', this.handleResize);
      }

      this.observeVideos();
      this.syncBreakpoint();
    }

    syncBreakpoint() {
      if (this.mobileQuery.matches) {
        this.enableCarousel();
      } else {
        this.disableCarousel();
      }
    }

    enableCarousel() {
      if (this.swiper || typeof window.Swiper !== 'function') return;

      this.swiper = new window.Swiper(this.carousel, {
        slidesPerView: 1,
        spaceBetween: 16,
        speed: this.reducedMotionQuery.matches ? 0 : SWIPER_SPEED,
        watchOverflow: true,
        threshold: 10,
        grabCursor: true,
        autoHeight: false,
        simulateTouch: true,
        touchStartPreventDefault: false,
        resistanceRatio: 0.65,
        observer: true,
        observeParents: true,
        a11y: false,
        mousewheel: {
          forceToAxis: true,
          releaseOnEdges: true,
        },
        on: {
          slideChange: (swiper) => this.setActive(swiper.activeIndex),
        },
      });

      this.applyTabSemantics(true);
      this.setActive(this.swiper.activeIndex || 0);
    }

    disableCarousel() {
      if (this.swiper) {
        this.swiper.destroy(true, true);
        this.swiper = null;
      }

      this.applyTabSemantics(false);
    }

    applyTabSemantics(enabled) {
      if (this.tablist) {
        if (enabled) {
          this.tablist.setAttribute('role', 'tablist');
        } else {
          this.tablist.removeAttribute('role');
        }
      }

      this.tabs.forEach((tab, index) => {
        const slide = this.slides[index];

        if (enabled) {
          tab.setAttribute('role', 'tab');
          tab.setAttribute('aria-selected', String(index === this.activeIndex));
          tab.setAttribute('tabindex', index === this.activeIndex ? '0' : '-1');
          if (slide) tab.setAttribute('aria-controls', slide.id);
        } else {
          tab.removeAttribute('role');
          tab.removeAttribute('aria-selected');
          tab.removeAttribute('tabindex');
          tab.removeAttribute('aria-controls');
        }
      });

      this.slides.forEach((slide, index) => {
        const tab = this.tabs[index];

        if (enabled) {
          slide.setAttribute('role', 'tabpanel');
          slide.setAttribute('tabindex', '0');
          if (tab) slide.setAttribute('aria-labelledby', tab.id);
        } else {
          slide.removeAttribute('role');
          slide.removeAttribute('tabindex');
          slide.removeAttribute('aria-labelledby');
        }
      });
    }

    goTo(index) {
      if (!this.swiper) return;
      this.swiper.slideTo(index);
      this.setActive(index);
    }

    setActive(index) {
      this.activeIndex = index;

      this.tabs.forEach((tab, tabIndex) => {
        const isActive = tabIndex === index;
        tab.setAttribute('aria-selected', String(isActive));
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      this.scrollTabIntoView(this.tabs[index]);
    }

    scrollTabIntoView(tab) {
      if (!tab || !this.tablist) return;

      const tabRect = tab.getBoundingClientRect();
      const listRect = this.tablist.getBoundingClientRect();

      if (tabRect.left >= listRect.left && tabRect.right <= listRect.right) return;

      const offset = tab.offsetLeft - (this.tablist.clientWidth - tab.offsetWidth) / 2;

      this.tablist.scrollTo({
        left: Math.max(offset, 0),
        behavior: this.reducedMotionQuery.matches ? 'auto' : 'smooth',
      });
    }

    onTabKeydown(event) {
      const total = this.tabs.length;
      if (total === 0) return;

      const current = this.tabs.indexOf(event.currentTarget);
      let next = null;

      switch (event.key) {
        case 'ArrowRight':
          next = (current + 1) % total;
          break;
        case 'ArrowLeft':
          next = (current - 1 + total) % total;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = total - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      this.goTo(next);
      this.tabs[next]?.focus();
    }

    observeVideos() {
      if (this.videos.length === 0) return;

      for (const video of this.videos) {
        video.muted = true;
        video.setAttribute('playsinline', '');
      }

      if (!('IntersectionObserver' in window)) return;

      this.videoObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const video = entry.target;

            if (entry.isIntersecting) {
              const played = video.play();
              if (played && typeof played.catch === 'function') played.catch(() => {});
            } else if (!video.paused) {
              video.pause();
            }
          }
        },
        { threshold: 0.25 }
      );

      for (const video of this.videos) this.videoObserver.observe(video);
    }

    destroy() {
      for (const tab of this.tabs) {
        tab.removeEventListener('click', this.handleTabClick);
        tab.removeEventListener('keydown', this.handleTabKeydown);
      }

      if (typeof this.mobileQuery?.removeEventListener === 'function') {
        this.mobileQuery.removeEventListener('change', this.handleBreakpointChange);
      }

      window.removeEventListener('resize', this.handleResize);
      this.videoObserver?.disconnect();

      if (this.swiper) {
        this.swiper.destroy(true, true);
        this.swiper = null;
      }
    }
  }

  function initialize(scope) {
    const container = scope && scope.querySelectorAll ? scope : document;
    const roots = Array.prototype.slice.call(container.querySelectorAll(ROOT_SELECTOR));

    if (container !== document && container.matches?.(ROOT_SELECTOR)) roots.push(container);

    for (const root of roots) {
      if (instances.has(root)) continue;
      instances.set(root, new ProductEndlessUses(root));
    }
  }

  function teardown(scope) {
    if (!scope || !scope.querySelectorAll) return;

    for (const root of Array.prototype.slice.call(scope.querySelectorAll(ROOT_SELECTOR))) {
      instances.get(root)?.destroy();
      instances.delete(root);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initialize(document));
  } else {
    initialize(document);
  }

  document.addEventListener('shopify:section:load', (event) => initialize(event.target));
  document.addEventListener('shopify:section:unload', (event) => teardown(event.target));
})();
