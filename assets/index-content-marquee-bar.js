(function () {
  const ROOT_SELECTOR = '[data-product-benefits-marquee]';
  const VIEWPORT_SELECTOR = '[data-product-benefits-marquee-viewport]';
  const TRACK_SELECTOR = '[data-product-benefits-marquee-track]';
  const GROUP_SELECTOR = '[data-product-benefits-marquee-group]';
  const CLONE_SELECTOR = '[data-product-benefits-marquee-clone]';
  const ELEMENT_SELECTOR = '[data-product-benefits-marquee-element]';

  const TWO_PI = Math.PI * 2;
  const RADIANS_TO_DEGREES = 180 / Math.PI;
  const MAX_FRAME_DELTA = 0.05;
  const HOVER_EASING = 8;

  const instances = new WeakMap();

  function readPixelValue(styles, property, fallback) {
    const value = Number.parseFloat(styles.getPropertyValue(property));
    return Number.isFinite(value) ? value : fallback;
  }

  function debounce(callback, wait) {
    let timer = null;
    return function debounced() {
      window.clearTimeout(timer);
      timer = window.setTimeout(callback, wait);
    };
  }

  class ProductBenefitsMarquee {
    constructor(root) {
      this.root = root;
      this.viewport = root.querySelector(VIEWPORT_SELECTOR);
      this.track = root.querySelector(TRACK_SELECTOR);
      this.group = root.querySelector(GROUP_SELECTOR);

      if (!this.viewport || !this.track || !this.group) return;

      this.loopEnabled = root.dataset.loop === 'true';
      this.pauseOnHover = root.dataset.pauseOnHover === 'true';
      this.speed = Math.max(Number.parseFloat(root.dataset.speed) || 0, 0);

      this.offset = 0;
      this.rate = 1;
      this.targetRate = 1;
      this.lastTimestamp = 0;
      this.frameId = null;
      this.isVisible = true;
      this.elements = [];
      this.elementCenters = [];
      this.cycleWidth = 0;
      this.amplitude = 0;
      this.wavelength = 1;
      this.phase = 0;

      this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

      this.handleResize = debounce(() => {
        this.measure();
        this.render();
      }, 150);
      this.handlePointerEnter = () => {
        this.targetRate = 0;
      };
      this.handlePointerLeave = () => {
        this.targetRate = 1;
      };
      this.handleVisibilityChange = () => this.syncPlayback();
      this.handleMotionPreferenceChange = () => this.syncPlayback();
      this.tick = this.tick.bind(this);

      root.setAttribute('data-enhanced', 'true');

      this.measure();
      this.render();
      this.bindEvents();
      this.syncPlayback();
    }

    bindEvents() {
      window.addEventListener('resize', this.handleResize);
      window.addEventListener('orientationchange', this.handleResize);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);

      if (typeof this.reducedMotionQuery.addEventListener === 'function') {
        this.reducedMotionQuery.addEventListener('change', this.handleMotionPreferenceChange);
      }

      if (this.pauseOnHover) {
        this.root.addEventListener('pointerenter', this.handlePointerEnter);
        this.root.addEventListener('pointerleave', this.handlePointerLeave);
      }

      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(this.handleResize);
        this.resizeObserver.observe(this.viewport);
      }

      if ('IntersectionObserver' in window) {
        this.intersectionObserver = new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            if (!entry) return;
            this.isVisible = entry.isIntersecting;
            this.syncPlayback();
          },
          { rootMargin: '128px 0px' }
        );
        this.intersectionObserver.observe(this.root);
      }

      if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready.then(() => {
          this.measure();
          this.render();
        });
      }
    }

    measure() {
      const styles = window.getComputedStyle(this.root);
      this.amplitude = readPixelValue(styles, '--product-benefits-marquee-amplitude', 0);
      this.wavelength = Math.max(readPixelValue(styles, '--product-benefits-marquee-wavelength', 1), 1);
      this.phase = readPixelValue(styles, '--product-benefits-marquee-phase', 0);

      this.track.style.transform = '';
      for (const element of this.elements) element.style.transform = '';

      const groupWidth = this.group.getBoundingClientRect().width;

      if (groupWidth > 0 && this.loopEnabled) {
        const viewportWidth = this.viewport.clientWidth;
        const requiredCopies = Math.max(2, Math.ceil((viewportWidth + groupWidth) / groupWidth) + 1);
        this.syncCopies(requiredCopies);
      } else if (!this.loopEnabled) {
        this.syncCopies(1);
      }

      this.cycleWidth = groupWidth;
      this.elements = Array.prototype.slice.call(this.track.querySelectorAll(ELEMENT_SELECTOR));

      for (const element of this.elements) element.style.transform = '';

      const trackLeft = this.track.getBoundingClientRect().left;
      this.elementCenters = [];

      for (const element of this.elements) {
        const rect = element.getBoundingClientRect();
        this.elementCenters.push(rect.left - trackLeft + rect.width / 2);
      }

      if (this.cycleWidth > 0) {
        this.offset = ((this.offset % this.cycleWidth) + this.cycleWidth) % this.cycleWidth;
      } else {
        this.offset = 0;
      }
    }

    syncCopies(requiredCopies) {
      const clones = Array.prototype.slice.call(this.track.querySelectorAll(CLONE_SELECTOR));
      const currentCopies = clones.length + 1;

      for (let index = currentCopies; index < requiredCopies; index += 1) {
        const clone = this.group.cloneNode(true);
        clone.removeAttribute('data-product-benefits-marquee-group');
        clone.setAttribute('data-product-benefits-marquee-clone', '');
        this.track.appendChild(clone);
      }

      for (let index = currentCopies; index > requiredCopies; index -= 1) {
        const removable = clones.pop();
        if (removable) removable.remove();
      }
    }

    render() {
      this.track.style.transform = 'translate3d(' + -this.offset + 'px, 0, 0)';

      if (this.amplitude <= 0) {
        for (const element of this.elements) element.style.transform = '';
        return;
      }

      const angularFrequency = TWO_PI / this.wavelength;

      for (let index = 0; index < this.elements.length; index += 1) {
        const positionX = this.elementCenters[index] - this.offset + this.phase;
        const waveAngle = angularFrequency * positionX;
        const offsetY = -this.amplitude * Math.sin(waveAngle);
        const slope = -this.amplitude * angularFrequency * Math.cos(waveAngle);
        const angle = Math.atan(slope) * RADIANS_TO_DEGREES;

        this.elements[index].style.transform =
          'translate3d(0, ' + offsetY.toFixed(2) + 'px, 0) rotate(' + angle.toFixed(2) + 'deg)';
      }
    }

    shouldAnimate() {
      return (
        this.loopEnabled &&
        this.speed > 0 &&
        this.cycleWidth > 0 &&
        this.isVisible &&
        !document.hidden &&
        !this.reducedMotionQuery.matches
      );
    }

    syncPlayback() {
      if (this.shouldAnimate()) {
        this.start();
      } else {
        this.stop();
        this.render();
      }
    }

    start() {
      if (this.frameId !== null) return;
      this.lastTimestamp = 0;
      this.frameId = window.requestAnimationFrame(this.tick);
    }

    stop() {
      if (this.frameId === null) return;
      window.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    tick(timestamp) {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;

      const delta = Math.min((timestamp - this.lastTimestamp) / 1000, MAX_FRAME_DELTA);
      this.lastTimestamp = timestamp;

      if (this.pauseOnHover && this.finePointerQuery.matches) {
        this.rate += (this.targetRate - this.rate) * Math.min(1, delta * HOVER_EASING);
      } else {
        this.rate = 1;
      }

      this.offset += this.speed * this.rate * delta;

      if (this.offset >= this.cycleWidth) {
        this.offset -= this.cycleWidth * Math.floor(this.offset / this.cycleWidth);
      }

      this.render();
      this.frameId = window.requestAnimationFrame(this.tick);
    }

    destroy() {
      this.stop();
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('orientationchange', this.handleResize);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);

      if (typeof this.reducedMotionQuery?.removeEventListener === 'function') {
        this.reducedMotionQuery.removeEventListener('change', this.handleMotionPreferenceChange);
      }

      this.root.removeEventListener('pointerenter', this.handlePointerEnter);
      this.root.removeEventListener('pointerleave', this.handlePointerLeave);
      this.resizeObserver?.disconnect();
      this.intersectionObserver?.disconnect();
    }
  }

  function initialize(scope) {
    const container = scope && scope.querySelectorAll ? scope : document;
    const roots = Array.prototype.slice.call(container.querySelectorAll(ROOT_SELECTOR));

    if (container !== document && container.matches?.(ROOT_SELECTOR)) roots.push(container);

    for (const root of roots) {
      if (instances.has(root)) continue;
      instances.set(root, new ProductBenefitsMarquee(root));
    }
  }

  function teardown(scope) {
    if (!scope || !scope.querySelectorAll) return;
    const roots = Array.prototype.slice.call(scope.querySelectorAll(ROOT_SELECTOR));

    for (const root of roots) {
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
