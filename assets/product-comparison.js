(function () {
  const ROOT_SELECTOR = '[data-product-comparison]';
  const TABLIST_SELECTOR = '[data-product-comparison-tablist]';
  const TAB_SELECTOR = '[data-product-comparison-tab]';
  const CARD_SELECTOR = '[data-product-comparison-card]';

  const MOBILE_QUERY = '(max-width: 989px)';

  const instances = new WeakMap();

  class ProductComparison {
    constructor(root) {
      this.root = root;
      this.tablist = root.querySelector(TABLIST_SELECTOR);
      this.tabs = Array.prototype.slice.call(root.querySelectorAll(TAB_SELECTOR));
      this.cards = Array.prototype.slice.call(root.querySelectorAll(CARD_SELECTOR));

      if (this.tabs.length === 0 || this.cards.length === 0) return;

      this.activeIndex = Number(root.dataset.activeIndex) || 0;
      this.mobileQuery = window.matchMedia(MOBILE_QUERY);

      this.handleBreakpointChange = () => this.syncBreakpoint();
      this.handleTabClick = (event) => this.setActive(Number(event.currentTarget.dataset.index) || 0);
      this.handleTabKeydown = (event) => this.onTabKeydown(event);

      for (const tab of this.tabs) {
        tab.addEventListener('click', this.handleTabClick);
        tab.addEventListener('keydown', this.handleTabKeydown);
      }

      if (typeof this.mobileQuery.addEventListener === 'function') {
        this.mobileQuery.addEventListener('change', this.handleBreakpointChange);
      }

      this.syncBreakpoint();
    }

    syncBreakpoint() {
      const isMobile = this.mobileQuery.matches;

      this.applyTabSemantics(isMobile);

      if (isMobile) {
        this.setActive(this.activeIndex);
      } else {
        for (const card of this.cards) card.removeAttribute('hidden');
      }
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
        const card = this.cards[index];

        if (enabled) {
          tab.setAttribute('role', 'tab');
          if (card) tab.setAttribute('aria-controls', card.id);
        } else {
          tab.removeAttribute('role');
          tab.removeAttribute('aria-controls');
          tab.removeAttribute('tabindex');
        }
      });

      this.cards.forEach((card, index) => {
        const tab = this.tabs[index];

        if (enabled) {
          card.setAttribute('role', 'tabpanel');
          card.setAttribute('tabindex', '0');
          if (tab) card.setAttribute('aria-labelledby', tab.id);
        } else {
          card.removeAttribute('role');
          card.removeAttribute('tabindex');
          card.removeAttribute('aria-labelledby');
        }
      });
    }

    setActive(index) {
      this.activeIndex = index;

      this.tabs.forEach((tab, tabIndex) => {
        const isActive = tabIndex === index;
        tab.setAttribute('aria-selected', String(isActive));

        if (this.mobileQuery.matches) {
          tab.setAttribute('tabindex', isActive ? '0' : '-1');
        }
      });

      if (!this.mobileQuery.matches) return;

      this.cards.forEach((card, cardIndex) => {
        if (cardIndex === index) {
          card.removeAttribute('hidden');
        } else {
          card.setAttribute('hidden', '');
        }
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
      this.setActive(next);
      this.tabs[next]?.focus();
    }

    destroy() {
      for (const tab of this.tabs || []) {
        tab.removeEventListener('click', this.handleTabClick);
        tab.removeEventListener('keydown', this.handleTabKeydown);
      }

      if (typeof this.mobileQuery?.removeEventListener === 'function') {
        this.mobileQuery.removeEventListener('change', this.handleBreakpointChange);
      }
    }
  }

  function initialize(scope) {
    const container = scope && scope.querySelectorAll ? scope : document;
    const roots = Array.prototype.slice.call(container.querySelectorAll(ROOT_SELECTOR));

    if (container !== document && container.matches?.(ROOT_SELECTOR)) roots.push(container);

    for (const root of roots) {
      if (instances.has(root)) continue;
      instances.set(root, new ProductComparison(root));
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
