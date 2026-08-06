(function () {
  class WhileYoureHereSlider extends HTMLElement {
    connectedCallback() {
      this.initializeAttempts = 0;
      this.initialize();
    }

    disconnectedCallback() {
      window.cancelAnimationFrame(this.initializeFrame);
      if (this.swiper) this.swiper.destroy(true, true);
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

      const styles = window.getComputedStyle(this.closest('.while-youre-here'));
      const desktopGap = Number.parseFloat(styles.getPropertyValue('--wyh-gap-desktop')) || 16;
      const mobileGap = Number.parseFloat(styles.getPropertyValue('--wyh-gap-mobile')) || 16;
      const desktopColumns = Math.max(
        1,
        Number.parseInt(styles.getPropertyValue('--wyh-columns-desktop'), 10) || 4
      );

      this.swiper = new window.Swiper(this, {
        slidesPerView: 'auto',
        spaceBetween: mobileGap,
        speed: 450,
        threshold: 8,
        grabCursor: true,
        watchOverflow: true,
        watchSlidesProgress: true,
        observer: true,
        observeParents: true,
        resistanceRatio: 0.65,
        mousewheel: {
          forceToAxis: true
        },
        keyboard: {
          enabled: true,
          onlyInViewport: true
        },
        a11y: {
          enabled: true,
          containerRoleDescriptionMessage: 'Product carousel',
          itemRoleDescriptionMessage: 'Product slide'
        },
        breakpoints: {
          750: {
            slidesPerView: desktopColumns,
            spaceBetween: desktopGap
          }
        }
      });
    }
  }

  if (!customElements.get('while-youre-here-slider')) {
    customElements.define('while-youre-here-slider', WhileYoureHereSlider);
  }
})();
