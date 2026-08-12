import { mediaQueryLarge } from '@theme/utilities';

const TILE = '.collection__custom-block';
const CARD = '[ref="cards[]"]';
const TILES = `:scope > ${TILE}`;
const CARDS = `:scope > ${CARD}`;

const END = Number.MAX_SAFE_INTEGER;
const PENDING = 'collection__custom-block--pending';
const ALONE = 'collection__custom-block--alone';
const ROW_TOLERANCE = 2;

class CollectionCustomGridBlocks extends HTMLElement {
  #observer = null;
  #frame = null;

  connectedCallback() {
    mediaQueryLarge.addEventListener('change', this.#schedule);
    this.#place();
  }

  disconnectedCallback() {
    mediaQueryLarge.removeEventListener('change', this.#schedule);
    this.#observer?.disconnect();
    this.#observer = null;

    if (this.#frame) cancelAnimationFrame(this.#frame);
    this.#frame = null;
  }

  #schedule = () => {
    if (this.#frame) return;

    this.#frame = requestAnimationFrame(() => {
      this.#frame = null;
      this.#place();
    });
  };

  #place() {
    this.#observer ??= new MutationObserver(this.#schedule);

    this.#observer.disconnect();

    try {
      this.#arrange();
    } finally {
      this.#observer.observe(this, { childList: true, subtree: true });
    }
  }

  #arrange() {
    const grid = this.querySelector('[ref="grid"]');
    if (!grid) return;

    const tiles = [...grid.querySelectorAll(TILES)]
      .map((element, index) => ({ element, index, position: this.#positionOf(element) }))
      .sort((a, b) => a.position - b.position || a.index - b.index);

    if (!tiles.length) return;

    const cards = [...grid.querySelectorAll(CARDS)];
    const arrangement = [...cards];
    const pending = [];
    const complete = this.#everythingLoaded(grid, cards);

    for (const { element, position } of tiles) {
      const at = Math.max(position - 1, 0);

      if (at > arrangement.length && !complete) {
        pending.push(element);
        continue;
      }

      arrangement.splice(Math.min(at, arrangement.length), 0, element);
    }

    arrangement.push(...pending);

    for (const { element } of tiles) {
      element.classList.toggle(PENDING, pending.includes(element));
    }

    const current = [...grid.children].filter((child) => child.matches(`${CARD}, ${TILE}`));
    const settled =
      current.length === arrangement.length && current.every((el, i) => el === arrangement[i]);

    if (!settled) this.#move(grid, tiles, arrangement);

    this.#markLoneTiles(
      grid,
      tiles.filter(({ element }) => !pending.includes(element))
    );
  }

  #markLoneTiles(grid, tiles) {
    for (const { element } of tiles) element.classList.remove(ALONE);

    const cardTops = [...grid.querySelectorAll(CARDS)].map((card) => card.offsetTop);

    const lone = tiles.map(({ element }) => {
      const { offsetTop } = element;
      return !cardTops.some((cardTop) => Math.abs(cardTop - offsetTop) < ROW_TOLERANCE);
    });

    tiles.forEach(({ element }, index) => element.classList.toggle(ALONE, lone[index]));
  }

  #everythingLoaded(grid, cards) {
    const lastPage = Number(grid.dataset.lastPage);
    if (!lastPage) return true;

    const loaded = cards.reduce((max, card) => Math.max(max, Number(card.dataset.page) || 1), 1);

    return loaded >= lastPage;
  }

  #move(grid, tiles, arrangement) {
    for (const { element } of tiles) element.remove();

    for (const { element } of tiles) {
      const start = arrangement.indexOf(element) + 1;
      let anchor = null;

      for (let i = start; i < arrangement.length; i++) {
        if (arrangement[i].parentElement === grid) {
          anchor = arrangement[i];
          break;
        }
      }

      grid.insertBefore(element, anchor);
    }
  }

  #positionOf(element) {
    const { desktopPosition, mobilePosition } = element.dataset;
    const position = Number(mediaQueryLarge.matches ? desktopPosition : mobilePosition);

    return Number.isFinite(position) && position > 0 ? position : END;
  }
}

if (!customElements.get('collection-custom-grid-blocks')) {
  customElements.define('collection-custom-grid-blocks', CollectionCustomGridBlocks);
}
