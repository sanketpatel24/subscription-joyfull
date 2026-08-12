// Reusable debounce utility — add once at the top of custom.js:
function debounce(fn, delay = 150) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}


/* Tab Start */
function InitTabs() {
  document.querySelectorAll(".Tabs_common_main_new").forEach(container => {

        const tabs = container.querySelectorAll(".Tabs_common_inner_new");
        const contents = container.querySelectorAll(".tabcontent");

        const group = container.querySelector("[data-tab-group]");
        const bg = group ? group.querySelector(".tab_background_new") : null;

        function moveBgToTab(tab) {
            if (!group || !bg) return;

            const tabsArr = Array.from(tabs);
            const isLast = tab === tabsArr[tabsArr.length - 1];

            const tabRect = tab.getBoundingClientRect();
            const groupRect = group.getBoundingClientRect();

            let offset = tabRect.left - groupRect.left;

            // 3px gap on last tab
            if (isLast) offset -= 0;

            bg.style.width = `${tabRect.width}px`;
            bg.style.transform = `translateX(${offset}px)`;
        }

        function activateTab(tab) {
          const tabId = tab.getAttribute("tab_id");
          if (!tabId) return;

          tabs.forEach(t => t.classList.remove("active"));
          contents.forEach(c => c.style.display = "none");
          contents.forEach(c => c.classList.remove("active"));

          tab.classList.add("active");

          const targets = container.querySelectorAll(`.${tabId}_open`);
          targets.forEach(t => t.style.display = "block");
          targets.forEach(t => t.classList.add("active"));

          moveBgToTab(tab);
        }

        // 🔥 Recalculate background position on screen resize
        function updateActiveTabBg() {
            const activeTab = container.querySelector(".Tabs_common_inner_new.active");
            if (activeTab) moveBgToTab(activeTab);
        }
        window.addEventListener("resize", debounce(updateActiveTabBg, 150));

        tabs.forEach(tab => {
            tab.addEventListener("click", () => activateTab(tab));
        });

        const firstActive = container.querySelector(".Tabs_common_inner_new.active") || tabs[0];
        if (firstActive) activateTab(firstActive);

        const navMenu = document.querySelector(".menu-list__list-item");

        if(navMenu){
          navMenu.addEventListener("mouseenter", () => {
              const firstActive = container.querySelector(".Tabs_common_inner_new.active") || tabs[0];
              if (firstActive) activateTab(firstActive);
          });
        }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  InitTabs();
});
document.addEventListener("shopify:section:load", () => {
  InitTabs();
});
/* Tab End */

/* Accordian Start */
function initCustomAccordion(root) {
    const scope = root || document;
    scope.querySelectorAll(".accordion").forEach(acc => {
        const items = acc.querySelectorAll("li");

        items.forEach(item => {
            if (item.dataset.accordionBound === "true") return;
            item.dataset.accordionBound = "true";

            const question = item.querySelector(".question");
            const answer = item.querySelector(".answer");

            if (!question || !answer) return;

            // Ensure correct default state
            if (item.classList.contains("open")) {
                answer.style.display = "block";
                answer.style.height = "auto";
            } else {
                answer.style.display = "none";
                answer.style.height = 0;
            }

            question.addEventListener("click", () => {
                const isOpen = item.classList.contains("open");

                // Close all other items
                items.forEach(i => {
                    if (i === item) return;
                    i.classList.remove("open");
                    const a = i.querySelector(".answer");
                    if (a) {
                        a.style.height = a.scrollHeight + "px"; // ensure correct closing start
                        requestAnimationFrame(() => {
                            a.style.transition = "height 300ms ease";
                            a.style.height = "0px";
                        });
                        setTimeout(() => {
                            a.style.display = "none";
                            a.style.removeProperty("transition");
                        }, 300);
                    }
                });

                // If the clicked one was open, just close it
                if (isOpen) {
                    item.classList.remove("open");
                    answer.style.height = answer.scrollHeight + "px";
                    requestAnimationFrame(() => {
                        answer.style.transition = "height 300ms ease";
                        answer.style.height = "0px";
                    });
                    setTimeout(() => {
                        answer.style.display = "none";
                        answer.style.removeProperty("transition");
                    }, 300);
                    return;
                }

                // Otherwise, open it
                item.classList.add("open");
                answer.style.display = "block";
                answer.style.height = "auto";              // get natural height
                const endHeight = answer.scrollHeight + "px";
                answer.style.height = "0px";               // restart animation
                requestAnimationFrame(() => {
                    answer.style.transition = "height 300ms ease";
                    answer.style.height = endHeight;
                });
                // Wait until animation finishes, then scroll
                setTimeout(() => {
                    answer.style.height = "auto";
                    answer.style.removeProperty("transition");

                    // ✅ Scroll ONLY if inside Product_meta_collapsible_main_new
                    const container = item.closest(".Product_meta_collapsible_main_new");
                    if (container) {
                      // Scroll to question AFTER opening
                      const offset = 100; // adjust to your header height
                      const y = question.getBoundingClientRect().top + window.pageYOffset - offset;

                      window.scrollTo({
                          top: y,
                          behavior: "smooth"
                      });
                    }
                }, 300)
            });
        });
    });
}

window.initCustomAccordion = initCustomAccordion;
initCustomAccordion(document);
/* Accordian End */

/* Video Lazy Load */
document.addEventListener("DOMContentLoaded", () => {
  const videos = document.querySelectorAll(".lazy-video");
  const isMobile = () => window.innerWidth <= 750;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;

      const shouldLoad =
        (video.classList.contains("video--mobile") && isMobile()) ||
        (video.classList.contains("video--desktop") && !isMobile());

      if (!shouldLoad) return;

      // 🔹 PRELOAD when close (even if not visible yet)
      if (entry.intersectionRatio > 0 && !video.dataset.loaded) {
        video.src = video.dataset.src;
        video.preload = "auto";
        video.load();
        video.dataset.loaded = "true";
      }

      // 🔹 PLAY only when visible
      if (entry.isIntersecting) {
        if (video.readyState >= 2) {
          video.play().catch(() => {});
        } else {
          video.addEventListener(
            "loadeddata",
            () => video.play().catch(() => {}),
            { once: true }
          );
        }
      } else {
        // Optional pause
        // video.pause();
      }
    });
  }, {
    threshold: [0, 0.25],
    rootMargin: "400px 0px" // VERY IMPORTANT
  });

  videos.forEach(video => observer.observe(video));
});
/* Video Lazy Load */

/* Scrollbar */
document.querySelectorAll('.simplebar').forEach(el => {
    if (el.dataset.simplebarInitialized) return;

    new SimpleBar(el, {
        autoHide: false
    });

    el.dataset.simplebarInitialized = 'true';
});
/* Scrollbar */

/* Product Page */
function productPageScript(){
  
}

if (document.body.classList.contains('template-product')) {
  productPageScript();
}
/* Product Page */

/* Megamenu Grid */

document.querySelectorAll('.megamenu-list-grid-slider').forEach(el => {
  if (!el.classList.contains('swiper-initialized')) {
    new Swiper(el, {
        loop: false,
        grabCursor: false,
        spaceBetween: 40,
        slidesPerGroup: 1,
        slidesPerView: 2,
        watchSlidesProgress: true,
        draggable: !0,
        autoHeight: !1,
        watchOverflow: !0,
        threshold: 10,
        mousewheel: {
            forceToAxis: !0
        },
        observer: true,
        observeParents: true,
        freeMode: !0,
        breakpoints: {
            0: {
              freeMode: !1,
              slidesPerView: 1,
              spaceBetween: 10
            },
            990: {
              slidesPerView: 2,
              spaceBetween: 40
            },
            1200: {
            },
            1440: {
            }
        }
    })
  }
});

/* Megamenu Grid */

/*
document.querySelectorAll('.Index_object_testimonial_slider').forEach(el => {
  if (!el.classList.contains('swiper-initialized')) {
    new Swiper(el, {
        loop: true,
        grabCursor: false,
        spaceBetween: 24,
        slidesPerGroup: 1,
        slidesPerView: "auto",
        watchSlidesProgress: true,
        draggable: !0,
        autoHeight: !1,
        watchOverflow: !0,
        threshold: 10,
        mousewheel: {
            forceToAxis: !0
        },
        centeredSlides: true,
        observer: true,
        observeParents: true,
        freeMode: !0,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        pagination: {
          el: ".swiper-pagination",
          clickable: true,
        },
        scrollbar: {
          el: ".swiper-scrollbar"
        },
        breakpoints: {
            0: {
                freeMode: !1,
                centeredSlides: false,
                spaceBetween: 16
            },
            750: {
                centeredSlides: true,
                spaceBetween: 24
            },
            990: {
            },
            1200: {
            },
            1440: {
            }
        }
    })
  }
});
*/
