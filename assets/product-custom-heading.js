import { StandardEvents } from '@shopify/events';

class ProductCustomHeading extends HTMLElement {
  connectedCallback() {
    this.section = this.closest('.shopify-section, dialog');
    this.section?.addEventListener(StandardEvents.productSelect, this.handleProductSelect);
  }

  disconnectedCallback() {
    this.section?.removeEventListener(StandardEvents.productSelect, this.handleProductSelect);
  }

  handleProductSelect = (event) => {
    if (!(event.target instanceof Element) || event.target.closest('product-card')) return;

    event.promise
      .then(({ detail }) => {
        if (!detail?.html) return;
        if (detail.productId && detail.productId !== this.dataset.productId) return;

        const updatedHeading = detail.html.querySelector(
          `product-custom-heading[data-block-id="${this.dataset.blockId}"]`
        );

        if (updatedHeading) this.innerHTML = updatedHeading.innerHTML;
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[product-custom-heading]', error);
      });
  };
}

if (!customElements.get('product-custom-heading')) {
  customElements.define('product-custom-heading', ProductCustomHeading);
}
