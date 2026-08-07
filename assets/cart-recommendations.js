import { Component } from '@theme/component';
import { StandardEvents } from '@shopify/events';

/**
 * A Swiper-powered carousel for the cart recommendations row.
 *
 * Lives inside the cart drawer/page section, which the Section Rendering API
 * re-renders on every cart mutation (add, update, remove, empty <-> populated).
 * `updatedCallback` re-syncs Swiper when morph patches this element's existing
 * slides in place; the `cartLinesUpdate` listener is a fallback for cases where
 * Swiper's own DOM observer doesn't catch the change in time.
 *
 * @extends {Component}
 */
class CartRecommendationsSlider extends Component {
  connectedCallback() {
    super.connectedCallback();

    this.initializeAttempts = 0;
    this.initialize();

    document.addEventListener(StandardEvents.cartLinesUpdate, this.onCartUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    window.cancelAnimationFrame(this.initializeFrame);
    document.removeEventListener(StandardEvents.cartLinesUpdate, this.onCartUpdate);

    if (this.swiper) this.swiper.destroy(true, true);
    this.swiper = undefined;
  }

  /**
   * Called by morph when it patches this element's existing subtree in place
   * (slides added/removed/reordered) without recreating the element itself.
   */
  updatedCallback() {
    super.updatedCallback();
    this.syncSlider();
  }

  /**
   * Handles the cart update event, re-syncing the slider once the cart
   * mutation's DOM updates have settled.
   * @param {CustomEvent & { promise?: Promise<unknown> }} event
   */
  onCartUpdate = (event) => {
    event.promise
      ?.then(() => this.syncSlider())
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[cart-recommendations] Event promise rejected:', error);
      });
  };

  /**
   * Re-syncs the Swiper instance with the current slides, initializing it if
   * this is a freshly connected element, or updating it in place if morph
   * patched slides into an already-running instance.
   */
  syncSlider() {
    if (!this.isConnected) return;

    if (!this.swiper) {
      this.initialize();
      return;
    }

    this.swiper.update();
  }

  initialize() {
    if (this.swiper || !this.isConnected) return;

    if (typeof window.Swiper !== 'function') {
      this.initializeAttempts += 1;
      if (this.initializeAttempts < 120) {
        this.initializeFrame = window.requestAnimationFrame(() => this.initialize());
      }
      return;
    }

    this.swiper = new window.Swiper(this, {
      slidesPerView: 'auto',
      spaceBetween: 12,
      speed: 450,
      threshold: 8,
      grabCursor: true,
      simulateTouch: true,
      watchOverflow: true,
      watchSlidesProgress: true,
      observer: true,
      observeParents: true,
      resistanceRatio: 0.65,
      mousewheel: {
        enabled: true,
        forceToAxis: true,
        sensitivity: 1,
        releaseOnEdges: true,
      },
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      a11y: {
        enabled: true,
        containerRoleDescriptionMessage: 'Product carousel',
        itemRoleDescriptionMessage: 'Product slide',
      },
    });
  }
}

if (!customElements.get('cart-recommendations-slider')) {
  customElements.define('cart-recommendations-slider', CartRecommendationsSlider);
}
