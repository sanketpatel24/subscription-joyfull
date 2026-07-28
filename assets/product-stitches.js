import { morphSection } from '@theme/section-renderer';

class ProductStitches extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  handleClick = (event) => {
    const link = event.target.closest('a.product-stitches-card');

    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    // The current product is still a real link for no-JS fallback, but clicking
    // it with JavaScript enabled should leave the existing PDP untouched.
    if (link.getAttribute('aria-current') === 'page') return;

    this.navigate(new URL(link.href), {
      updateHistory: true,
      productTitle: link.dataset.productTitle,
    });
  };

  /**
   * Loads another product into the current Product Information section.
   * The anchor remains a normal link, so navigation still works without JS.
   *
   * @param {URL} url
   * @param {{ updateHistory?: boolean, productTitle?: string }} options
   */
  async navigate(url, { updateHistory = false, productTitle = '' } = {}) {
    if (this.getAttribute('aria-busy') === 'true') return;

    const publicUrl = new URL(url);
    publicUrl.searchParams.delete('section_id');

    const sectionId = this.dataset.sectionId;
    if (!sectionId) {
      window.location.assign(publicUrl);
      return;
    }

    this.setAttribute('aria-busy', 'true');
    this.querySelector('.product-stitches__status').textContent = 'Loading product';

    try {
      const response = await fetch(publicUrl, {
        headers: {
          Accept: 'text/html',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`Product request failed with status ${response.status}`);
      }

      const productPageHTML = await response.text();
      await morphSection(sectionId, productPageHTML, {
        mode: 'full',
        injectStylesheet: true,
      });

      // The section morph can preserve the subscription-selector custom element
      // while replacing its controls. Rebind it to the new product's controls
      // and update the newly rendered add-to-cart price.
      const section = document.getElementById(`shopify-section-${sectionId}`);
      section?.querySelector('subscription-selector')?.refresh?.();

      if (updateHistory) {
        const cleanPath = `${publicUrl.pathname}${publicUrl.search}${publicUrl.hash}`;
        window.history.pushState({ productStitches: true }, '', cleanPath);
      }

      if (productTitle) {
        document.title = replaceProductTitle(document.title, productTitle);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Unable to load the selected product.', error);
      window.location.assign(publicUrl);
    }
  }
}

/**
 * Keeps the store-name suffix from the existing document title.
 *
 * @param {string} currentTitle
 * @param {string} productTitle
 * @returns {string}
 */
function replaceProductTitle(currentTitle, productTitle) {
  const separator = currentTitle.includes(' – ') ? ' – ' : currentTitle.includes(' | ') ? ' | ' : '';
  if (!separator) return productTitle;

  return `${productTitle}${separator}${currentTitle.split(separator).slice(1).join(separator)}`;
}

if (!customElements.get('product-stitches')) {
  customElements.define('product-stitches', ProductStitches);
}

if (!window.productStitchesPopstateBound) {
  window.productStitchesPopstateBound = true;

  window.addEventListener('popstate', () => {
    const selector = document.querySelector('product-stitches');
    if (!selector) return;

    const currentUrl = new URL(selector.dataset.currentUrl, window.location.origin);
    const requestedUrl = new URL(window.location.href);
    if (currentUrl.pathname === requestedUrl.pathname) return;

    const matchingCard = Array.from(selector.querySelectorAll('a.product-stitches-card')).find(
      (card) => new URL(card.href).pathname === requestedUrl.pathname
    );

    selector.navigate(requestedUrl, {
      updateHistory: false,
      productTitle: matchingCard?.dataset.productTitle,
    });
  });
}
