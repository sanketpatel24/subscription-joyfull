/* footer-custom-instagram-marquee */
initMarquee('.footer-custom-instagram-marquee', {
    mobile: {
        duration: 50000,
        gap: 0,
        duplicated: true,
        direction: "left"
    },
    desktop: {
        duration: 60000,
        gap: 0,
        duplicated: true,
        direction: "left"
    }
});

document.querySelectorAll('.footer-custom-instagram-marquee .js-marquee').forEach((content, index) => {
    if (index > 0) content.setAttribute('aria-hidden', 'true');
});
/* footer-custom-instagram-marquee */