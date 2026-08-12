/* Footer Newsletter Signup (Klaviyo) */
document.querySelectorAll('[data-klaviyo-form]').forEach(function (form) {
  var footer = form.closest('.footer__email') || form;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var emailInput = form.querySelector('.kl-footer-input');
    var email = emailInput.value.trim();
    var publicKey = form.dataset.publicKey;
    var listId = form.dataset.listId;
    var blockId = form.dataset.klaviyoForm;
    var errorEl = footer.querySelector('[data-error="' + blockId + '"]');
    var successEl = footer.querySelector('[data-success="' + blockId + '"]');
    var submitBtn = form.querySelector('.kl-footer-submit');

    if (errorEl) errorEl.hidden = true;

    if (!publicKey || !listId || !email) return;

    if (submitBtn) submitBtn.disabled = true;

    fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(publicKey), {
      method: 'POST',
      headers: {
        'content-type': 'application/vnd.api+json',
        'revision': '2024-10-15'
      },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            profile: {
              data: {
                type: 'profile',
                attributes: {
                  email: email,
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: 'SUBSCRIBED'
                      }
                    }
                  }
                }
              }
            }
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: listId
              }
            }
          }
        }
      })
    }).then(function (res) {
      if (res.ok) {
        form.style.display = 'none';
        if (successEl) successEl.hidden = false;
      } else {
        if (submitBtn) submitBtn.disabled = false;
        if (errorEl) errorEl.hidden = false;
      }
    }).catch(function () {
      if (submitBtn) submitBtn.disabled = false;
      if (errorEl) errorEl.hidden = false;
    });
  });
});
/* Footer Newsletter Signup (Klaviyo) */

/* Footer Email Input Typing State */
document.querySelectorAll('.footer__email-wrap-form .kl-footer-input').forEach(function (footerInput) {
  footerInput.addEventListener('input', function () {
    footerInput.classList.toggle('typing', footerInput.value.trim() !== '');
  });
});
/* Footer Email Input Typing State */

/* Footer Image Reveal On Scroll */
(function () {
  var footerItems = document.querySelectorAll('.footer__item');
  if (!footerItems.length) return;

  var footerImageObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var footerImage = entry.target.querySelector('.footer__image');
      if (!footerImage) return;

      footerImage.classList.toggle('active', entry.isIntersecting);
    });
  }, {
    threshold: 0.2
  });

  footerItems.forEach(function (footerItem) {
    footerImageObserver.observe(footerItem);
  });
})();
/* Footer Image Reveal On Scroll */
