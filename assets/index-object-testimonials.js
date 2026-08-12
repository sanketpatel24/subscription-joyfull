/* index-object-testimonials-marquee */
initMarquee('.index-object-testimonials-marquee', {
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
        direction: "left",
        pauseOnHover: true
    }
});

document.querySelectorAll('.index-object-testimonials-marquee .js-marquee').forEach((content, index) => {
    if (index > 0) content.setAttribute('aria-hidden', 'true');
});
/* index-object-testimonials-marquee */