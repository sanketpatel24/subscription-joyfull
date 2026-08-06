(function () {
  const SLIDER_SELECTOR = '[data-happy-parents-pets-slider]';
  const CARD_SELECTOR = '.happy-parents-pets__card';
  const VIDEO_SELECTOR = '[data-happy-parents-pets-video]';
  const mobileQuery = window.matchMedia('(max-width: 749px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sliders = new WeakMap();
  const videos = new Set();

  let videoObserver = null;

  function createSlider(element) {
    if (typeof window.Swiper !== 'function') return;
    if (sliders.has(element)) return;

    element.querySelectorAll(CARD_SELECTOR).forEach(function (card) {
      if (card.dataset.happyParentsPetsOriginalStyle !== undefined) return;
      card.dataset.happyParentsPetsOriginalStyle = card.getAttribute('style') || '';
    });

    sliders.set(
      element,
      new window.Swiper(element, {
        slidesPerView: 'auto',
        spaceBetween: 16,
        speed: 400,
        threshold: 10,
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
          containerRoleDescriptionMessage: 'carousel',
          itemRoleDescriptionMessage: 'slide'
        }
      })
    );
  }

  function destroySlider(element) {
    const instance = sliders.get(element);
    if (!instance) return;

    instance.destroy(true, true);
    sliders.delete(element);

    element.querySelectorAll(CARD_SELECTOR).forEach(function (card) {
      const originalStyle = card.dataset.happyParentsPetsOriginalStyle;

      if (originalStyle) {
        card.setAttribute('style', originalStyle);
      } else {
        card.removeAttribute('style');
      }
    });
  }

  function syncSliders(root) {
    const scope = root || document;

    scope.querySelectorAll(SLIDER_SELECTOR).forEach(function (element) {
      if (mobileQuery.matches) {
        createSlider(element);
      } else {
        destroySlider(element);
      }
    });
  }

  function playVideo(video) {
    if (reducedMotionQuery.matches) return;
    if (video.preload === 'none') video.preload = 'auto';

    const playRequest = video.play();

    if (playRequest && typeof playRequest.catch === 'function') {
      playRequest.catch(function () {});
    }
  }

  function getVideoObserver() {
    if (videoObserver || !('IntersectionObserver' in window)) return videoObserver;

    videoObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          const video = entry.target;

          if (entry.isIntersecting) {
            playVideo(video);
          } else if (!video.paused) {
            video.pause();
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: '100px 0px'
      }
    );

    return videoObserver;
  }

  function observeVideos(root) {
    const scope = root || document;
    const observer = getVideoObserver();

    scope.querySelectorAll(VIDEO_SELECTOR).forEach(function (video) {
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');

      if (video.dataset.happyParentsPetsObserved === 'true') return;
      video.dataset.happyParentsPetsObserved = 'true';
      videos.add(video);

      if (observer) {
        observer.observe(video);
      } else {
        playVideo(video);
      }
    });
  }

  function releaseVideos(root) {
    if (!root) return;

    root.querySelectorAll(VIDEO_SELECTOR).forEach(function (video) {
      if (videoObserver) videoObserver.unobserve(video);
      videos.delete(video);
    });
  }

  function handleReducedMotionChange() {
    if (!reducedMotionQuery.matches) return;

    videos.forEach(function (video) {
      if (!video.paused) video.pause();
    });
  }

  function init(root) {
    syncSliders(root);
    observeVideos(root);
  }

  mobileQuery.addEventListener('change', function () {
    syncSliders(document);
  });

  reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    if (!event.target || !event.target.querySelector(SLIDER_SELECTOR)) return;
    init(event.target);
  });

  document.addEventListener('shopify:section:unload', function (event) {
    if (!event.target) return;
    releaseVideos(event.target);
    event.target.querySelectorAll(SLIDER_SELECTOR).forEach(destroySlider);
  });
})();
