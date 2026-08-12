/**
 * index-tab-collections-lazy.js
 *
 * Tab switching and lazy-loading for the homepage tab sections:
 *   - Index Tab Collection List (New Arrivals)
 *   - Index Tabs Collections (Shop by Shade)
 *
 * Replaces tabsCommonScript() for elements using the
 * .Tabs_lazy_main_new / .Tabs_lazy_inner_new classes.
 *
 * When an inactive tab with data-lazy="true" is shown, its content is
 * fetched via the section rendering API and injected into the existing
 * .swiper-wrapper. A pre-rendered cv-loader spinner inside the wrapper
 * is naturally replaced by the innerHTML assignment.
 *
 * fetchTabContent() is decoupled from tab switching so it can also be
 * called independently (e.g. to pre-load tabs in the background).
 */

(function () {
	"use strict";

	// ----------------------------------------------------------------
	// Height helpers
	// ----------------------------------------------------------------

	/**
	 * @param {HTMLElement} container - The .Tabs_lazy_main_new ancestor
	 * @returns {string} Computed height (e.g. "456.5px"), or ""
	 */
	function measureActiveTabHeight(container) {
		const active = container.querySelector(
			'.tabcontent:not([style*="display: none"]) .swiper-wrapper'
		);
		if (!active) {
			return "";
		}
		return getComputedStyle(active).height;
	}

	/**
	 * Size the cv-loader to match the outgoing tab so the page doesn't shift.
	 *
	 * @param {HTMLElement} tabContent
	 * @param {string} height - CSS height value (e.g. "456.5px")
	 */
	function sizeLoader(tabContent, height) {
		if (height) {
			var loader = tabContent.querySelector(".cv-loader");
			if (loader) {
				loader.style.height = height;
			}
		}
	}

	// ----------------------------------------------------------------
	// Fetch + inject
	// ----------------------------------------------------------------

	/**
	 * Fetch product card slides for a tab and inject them into its
	 * .swiper-wrapper. Pure fetch/inject with no UI side-effects — can be
	 * called during a tab switch or in the background to pre-load content.
	 *
	 * @param {HTMLElement} tabContent - Element with data-collection-handle
	 *        and data-lazy="true"
	 * @returns {Promise<void>}
	 */
	async function fetchTabContent(tabContent) {
		const handle = tabContent.getAttribute("data-collection-handle");
		const limit = tabContent.getAttribute("data-products-limit") || "12";

		if (!handle) {
			throw new Error("[lazy-tabs] Missing data-collection-handle");
		}

		const url =
			"/collections/" +
			encodeURIComponent(handle) +
			"?section_id=index-tab-collections-lazy-cards&limit=" +
			encodeURIComponent(limit);

		const swiperWrapper = tabContent.querySelector(".swiper-wrapper");
		if (!swiperWrapper) {
			throw new Error("[lazy-tabs] No .swiper-wrapper found inside tab");
		}

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error("HTTP " + response.status + " " + response.statusText);
		}

		const html = await response.text();

		// Shopify wraps section responses in a <div id="shopify-section-…">.
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		const sectionWrapper = doc.querySelector('[id^="shopify-section-"]');

		if (sectionWrapper) {
			swiperWrapper.innerHTML = sectionWrapper.innerHTML;
		} else {
			swiperWrapper.innerHTML = doc.body.innerHTML;
		}

		tabContent.removeAttribute("data-lazy");

		// Post-injection hooks
		document.dispatchEvent(new CustomEvent("swatch-more-card:init"));

		if (
			typeof affirm !== "undefined" &&
			affirm &&
			affirm.ui &&
			affirm.ui.refresh
		) {
			affirm.ui.refresh();
		}
	}

	// ----------------------------------------------------------------
	// Tab switching
	// ----------------------------------------------------------------

	/**
	 * Snapshot the currently active tab button and visible tab contents
	 * so we can restore them if a lazy fetch fails.
	 *
	 * @param {HTMLElement} container - The .Tabs_lazy_main_new ancestor
	 * @returns {{ button: HTMLElement, tabs: HTMLElement[] }}
	 */
	function captureActiveTab(container) {
		const button = container.querySelector(".Tabs_lazy_inner_new.active");
		const tabs = Array.from(
			container.querySelectorAll('.tabcontent:not([style*="display: none"])')
		);
		return { button: button, tabs: tabs };
	}

	/**
	 * Revert to a previously captured tab state — re-activate its button
	 * and restore visibility on its tab contents.
	 *
	 * @param {HTMLElement} container
	 * @param {{ button: HTMLElement, tabs: HTMLElement[] }} previous
	 */
	function revertToTab(container, previous) {
		container.querySelectorAll(".Tabs_lazy_inner_new").forEach(function (btn) {
			btn.classList.remove("active");
			btn.setAttribute("aria-selected", "false");
		});
		if (previous.button) {
			previous.button.classList.add("active");
			previous.button.setAttribute("aria-selected", "true");
		}

		container.querySelectorAll(".tabcontent").forEach(function (tab) {
			tab.style.display = "none";
		});
		previous.tabs.forEach(function (tab) {
			tab.style.display = "block";
		});
	}

	/**
	 * @param {HTMLElement} button
	 */
	function handleTabClick(button) {
		const tabId = button.getAttribute("tab_id");

		if (button.classList.contains("active")) {
			return;
		}

		// Scope all DOM queries to the parent section so multiple lazy-tab
		// sections on the same page don't interfere with each other.
		const container = button.closest(".Tabs_lazy_main_new");
		if (!container) {
			console.error(
				"[lazy-tabs] Could not find .Tabs_lazy_main_new ancestor for",
				button
			);
			return;
		}

		// Snapshot current state so we can revert on fetch failure.
		const previous = captureActiveTab(container);

		// Measure before hiding so we have a stable reference height.
		const activeHeight = measureActiveTabHeight(container);

		container.querySelectorAll(".Tabs_lazy_inner_new").forEach(function (btn) {
			btn.classList.remove("active");
			btn.setAttribute("aria-selected", "false");
		});
		button.classList.add("active");
		button.setAttribute("aria-selected", "true");

		// Index-tabs-collections-new.liquid has multiple .tabcontent loops
		// that share the same tab_id pattern — toggle ALL of them.
		container.querySelectorAll(".tabcontent").forEach(function (tab) {
			tab.style.display = "none";
		});

		const targetClass = tabId + "_open";
		container.querySelectorAll("." + targetClass).forEach(function (tab) {
			tab.style.display = "block";

			if (tab.getAttribute("data-lazy") === "true") {
				sizeLoader(tab, activeHeight);

				fetchTabContent(tab)
					.catch(function () {
						// First attempt failed — retry once immediately.
						return fetchTabContent(tab);
					})
					.catch(function (err) {
						// Both attempts failed — snap back to the previous tab.
						console.error("[lazy-tabs] Fetch failed after retry:", err);
						revertToTab(container, previous);
					});
			}
		});
	}

	// ----------------------------------------------------------------
	// Bootstrap
	// ----------------------------------------------------------------

	// Delegated on document: survives tab buttons being replaced by section
	// hydration (e.g. the mobile drawer's data-hydration-key subtree), which
	// happens after initial load and would otherwise leave fresh nodes with
	// no listener attached.
	document.addEventListener("click", function (event) {
		const button = event.target.closest(".Tabs_lazy_inner_new");
		if (!button) return;
		handleTabClick(button);
	});

	// Keyboard activation (Enter / Space) for the div-based tab buttons —
	// mirrors native <button> behavior since these aren't real buttons.
	document.addEventListener("keydown", function (event) {
		if (event.key !== "Enter" && event.key !== " ") return;
		const button = event.target.closest(".Tabs_lazy_inner_new");
		if (!button) return;
		event.preventDefault();
		handleTabClick(button);
	});
})();
