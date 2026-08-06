import { Component } from '@theme/component';

export class CartLineSubscriptionSelector extends Component {
  requiredRefs = ['details', 'summaryLabel'];

  handleChange() {
    const input = this.querySelector('input:checked');
    if (!(input instanceof HTMLInputElement)) return;

    const { details, summaryLabel } = this.refs;
    const line = Number(this.dataset.line);
    const sellingPlan = input.value ? input.value : null;

    summaryLabel.textContent = input.dataset.summary || '';

    this.querySelectorAll('[data-option-row]').forEach((row) => {
      row.toggleAttribute('data-selected', row.contains(input));
    });

    if (details instanceof HTMLDetailsElement) details.open = false;

    const cartItemsComponent = this.closest('cart-items-component');
    if (cartItemsComponent && 'onLineItemSellingPlanChange' in cartItemsComponent) {
      /** @type {any} */ (cartItemsComponent).onLineItemSellingPlanChange(line, sellingPlan);
    }
  }
}

if (!customElements.get('cart-line-subscription-selector')) {
  customElements.define('cart-line-subscription-selector', CartLineSubscriptionSelector);
}
