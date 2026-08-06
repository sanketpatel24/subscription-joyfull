(function () {
  const ROOT_SELECTOR = '[data-product-ingredients-flip-cards]';
  const CAROUSEL_SELECTOR = '[data-product-ingredients-flip-cards-carousel]';
  const CARD_SELECTOR = '[data-product-ingredients-flip-cards-card]';
  const TOGGLE_SELECTOR = '[data-product-ingredients-flip-cards-toggle]';

  const instances = new WeakMap();

  class ProductIngredientsFlipCards {
    constructor(root) {
      this.root = root;
      this.carousel = root.querySelector(CAROUSEL_SELECTOR);
      this.cards = Array.prototype.slice.call(root.querySelectorAll(CARD_SELECTOR));

      if (!this.carousel || this.cards.length === 0) return;

      this.swiper = null;
      this.destroyed = false;
      this.flippedCard = null;
      this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      this.handleToggle = (event) => {
        event.preventDefault();
        this.toggleCard(event.currentTarget.closest(CARD_SELECTOR));
      };

      this.toggles = Array.prototype.slice.call(root.querySelectorAll(TOGGLE_SELECTOR));
      for (const toggle of this.toggles) {
        toggle.addEventListener('click', this.handleToggle);
      }

      this.enableCarousel();
    }

    enableCarousel() {
      if (this.swiper || this.destroyed) return;

      if (typeof window.Swiper !== 'function') {
        this.swiperLoadFrame = window.requestAnimationFrame(() => this.enableCarousel());
        return;
      }

      this.swiper = new window.Swiper(this.carousel, {
        slidesPerView: 1.371009,
        spaceBetween: 16,
        speed: this.reducedMotionQuery.matches ? 0 : 400,
        watchOverflow: true,
        threshold: 10,
        grabCursor: true,
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
        keyboard: {
          enabled: true,
          onlyInViewport: true,
        },
        breakpoints: {
          750: {
            slidesPerView: 2.25,
            spaceBetween: 20,
          },
          990: {
            slidesPerView: 3.5,
            spaceBetween: 16,
          },
        },
        on: {
          slideChange: () => this.resetFlipped(),
        },
      });
    }

    disableCarousel() {
      if (!this.swiper) return;
      this.swiper.destroy(true, true);
      this.swiper = null;
    }

    toggleCard(card) {
      if (!card) return;

      const isFlipped = card.dataset.flipped === 'true';

      this.resetFlipped();

      if (!isFlipped) {
        card.dataset.flipped = 'true';
        this.setToggleState(card, true);
        this.flippedCard = card;
      }
    }

    resetFlipped() {
      if (!this.flippedCard) return;
      delete this.flippedCard.dataset.flipped;
      this.setToggleState(this.flippedCard, false);
      this.flippedCard = null;
    }

    setToggleState(card, expanded) {
      const toggle = card.querySelector(TOGGLE_SELECTOR);
      toggle?.setAttribute('aria-expanded', String(expanded));
    }

    destroy() {
      this.destroyed = true;

      for (const toggle of this.toggles || []) {
        toggle.removeEventListener('click', this.handleToggle);
      }

      if (this.swiperLoadFrame) window.cancelAnimationFrame(this.swiperLoadFrame);

      this.disableCarousel();
    }
  }

  function initialize(scope) {
    const container = scope && scope.querySelectorAll ? scope : document;
    const roots = Array.prototype.slice.call(container.querySelectorAll(ROOT_SELECTOR));

    if (container !== document && container.matches?.(ROOT_SELECTOR)) roots.push(container);

    for (const root of roots) {
      if (instances.has(root)) continue;
      instances.set(root, new ProductIngredientsFlipCards(root));
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
