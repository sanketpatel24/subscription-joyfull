class SubscriptionSelector extends HTMLElement {
  connectedCallback() {
    this.section = this.closest('.shopify-section');
    this.section?.addEventListener('shopify:product:select', this.handleVariantChange);
    this.bindControls();
    this.sync();
  }

  disconnectedCallback() {
    this.unbindControls();
    this.section?.removeEventListener('shopify:product:select', this.handleVariantChange);
  }

  bindControls() {
    this.purchaseInputs = this.querySelectorAll('[data-purchase-option]');
    this.planSelect = this.querySelector('[data-selling-plan-select]');
    this.sellingPlanInput = this.querySelector('[data-selling-plan-input]');
    this.details = this.querySelector('[data-subscription-details]');

    this.purchaseInputs.forEach((input) => {
      input.addEventListener('change', this.handlePurchaseChange);
    });
    this.planSelect?.addEventListener('change', this.handlePlanChange);
  }

  refresh() {
    this.unbindControls();
    this.bindControls();
    this.sync();
  }

  unbindControls() {
    this.purchaseInputs?.forEach((input) => {
      input.removeEventListener('change', this.handlePurchaseChange);
    });
    this.planSelect?.removeEventListener('change', this.handlePlanChange);
  }

  handlePurchaseChange = () => this.sync();

  handlePlanChange = () => {
    if (this.sellingPlanInput && this.planSelect) {
      this.sellingPlanInput.value = this.planSelect.value;
    }
    this.updateDisplayedPlan();
    this.updateAddToCartPrice();
  };

  sync() {
    const subscriptionInput = this.querySelector('[data-purchase-option="subscription"]');
    const isSubscription = Boolean(subscriptionInput?.checked);

    this.toggleAttribute('data-subscription-selected', isSubscription);
    if (this.details) {
      this.details.hidden = !isSubscription;
      this.details.setAttribute('aria-hidden', String(!isSubscription));
    }

    if (this.sellingPlanInput) {
      this.sellingPlanInput.disabled = !isSubscription;
      this.sellingPlanInput.value = isSubscription ? this.planSelect?.value || '' : '';
    }

    this.updateDisplayedPlan();
    this.updateAddToCartPrice();
  }

  updateDisplayedPlan() {
    if (!this.planSelect) return;

    const option = this.planSelect.selectedOptions[0];
    if (!option) return;

    this.querySelectorAll('[data-plan-output]').forEach((output) => {
      const key = output.dataset.planOutput;
      if (key && option.dataset[key] !== undefined) {
        output.textContent = option.dataset[key];
      }
    });
  }

  updateAddToCartPrice() {
    const subscriptionInput = this.querySelector('[data-purchase-option="subscription"]');
    const oneTimeInput = this.querySelector('[data-purchase-option="onetime"]');
    const selectedPlan = this.planSelect?.selectedOptions[0];
    const price = subscriptionInput?.checked ? selectedPlan?.dataset.price : oneTimeInput?.dataset.onetimePrice;
    if (!price) return;

    const form = this.sellingPlanInput?.form;
    const priceOutput = form?.querySelector('[data-add-to-cart-price]');
    if (priceOutput) priceOutput.textContent = price;
  }

  handleVariantChange = async (event) => {
    const { detail } = await event.promise;
    const nextSelector = detail?.html?.querySelector(`subscription-selector`);
    if (!nextSelector) return;

    const selectedPurchaseOption =
      this.querySelector('[data-purchase-option]:checked')?.dataset.purchaseOption || 'subscription';
    const selectedPlanName = this.planSelect?.selectedOptions[0]?.textContent.trim();

    this.unbindControls();
    this.innerHTML = nextSelector.innerHTML;
    this.bindControls();

    const matchingPlan = Array.from(this.planSelect?.options || []).find(
      (option) => option.textContent.trim() === selectedPlanName
    );
    if (matchingPlan) this.planSelect.value = matchingPlan.value;

    const purchaseInput = this.querySelector(`[data-purchase-option="${selectedPurchaseOption}"]`);
    if (purchaseInput) purchaseInput.checked = true;
    this.sync();

    // The product form morphs its button from the same variant response.
    // Update once more after that morph has completed.
    requestAnimationFrame(() => this.updateAddToCartPrice());
  };
}

if (!customElements.get('subscription-selector')) {
  customElements.define('subscription-selector', SubscriptionSelector);
}
