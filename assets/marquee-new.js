/**
 * Marquee.js - A Vanilla JavaScript implementation of a continuous scrolling marquee.
 * Replaces the functionality of the jQuery Marquee plugin for continuous scrolling.
 */
class Marquee {
    /**
     * @param {HTMLElement} element The DOM element to apply the marquee effect to (e.g., .Index_information_marquee).
     * @param {Object} options Configuration options.
     * @param {number} options.duration The time in milliseconds for one complete animation cycle.
     * @param {number} options.gap The gap between duplicated content (set to 0 in your usage).
     * @param {string} options.direction 'left' or 'right' (your usage is 'left').
     * @param {boolean} options.duplicated Whether to duplicate the content for continuous loop.
     * @param {boolean} options.startVisible Whether the content should start visible.
     */
    constructor(element, options) {
        this.element = element;
        this.options = {
            duration: options.duration || 5000,
            gap: options.gap || 0,
            direction: options.direction || 'left',
            duplicated: options.duplicated || true,
            startVisible: options.startVisible || true,
            pauseOnHover: options.pauseOnHover || false
        };

        // Class names matching your SCSS and original jQuery structure
        this.wrapperClass = 'js-marquee-wrapper';
        this.contentClass = 'js-marquee';
        this.animationName = `marqueeAnimation-${Math.floor(Math.random() * 1e7)}`;

        this.init();
    }

    init() {
        if (!this.options.duplicated) {
            console.error('Marquee component currently only supports duplicated: true in this simplified implementation.');
            return;
        }

        this.prepareDOM();
        this.calculateDimensions();
        this.createCSSAnimation();
        this.bindHoverEvents();
    }

    prepareDOM() {
        const originalContent = this.element.innerHTML;

        // 1. Wrap the original content
        const content1 = document.createElement('div');
        content1.className = this.contentClass;
        content1.innerHTML = originalContent;
        content1.style.marginRight = `${this.options.gap}px`;

        // 2. Clone and append for duplication
        const content2 = content1.cloneNode(true);

        // 3. Create the wrapper
        const wrapper = document.createElement('div');
        wrapper.className = this.wrapperClass;
        wrapper.style.display = 'flex'; // Ensures content items are side-by-side
        wrapper.appendChild(content1);
        wrapper.appendChild(content2);

        // Replace the original content with the wrapper
        this.element.innerHTML = '';
        this.element.appendChild(wrapper);

        this.wrapper = wrapper;
        this.content1 = content1;
    }

    calculateDimensions() {
        // Measure the width of a single content block
        this.contentWidth = this.content1.offsetWidth + this.options.gap;
        
        // The wrapper needs to be wide enough to hold both, plus any gap
        const totalContentWidth = this.contentWidth * 2;
        this.wrapper.style.width = `${totalContentWidth}px`;
    }

    createCSSAnimation() {
        const durationSeconds = this.options.duration / 1000;
        const distance = this.contentWidth;

        let from, to;

        if (this.options.direction === 'left') {
            from = '0px';
            to = `-${distance}px`;
        } else {
            from = `-${distance}px`;
            to = '0px';

            // IMPORTANT: set initial transform so it starts visible
            this.wrapper.style.transform = `translateX(${from})`;
        }

        const keyframes = `
            @keyframes ${this.animationName} {
                0% { transform: translateX(${from}); }
                100% { transform: translateX(${to}); }
            }
        `;

        let styleSheet = document.getElementById('marquee-styles');
        if (!styleSheet) {
            styleSheet = document.createElement('style');
            styleSheet.id = 'marquee-styles';
            document.head.appendChild(styleSheet);
        }

        styleSheet.innerHTML += keyframes;

        this.wrapper.style.animation = 
            `${this.animationName} ${durationSeconds}s linear infinite`;
    }

    bindHoverEvents() {
        if (!this.options.pauseOnHover) return;

        this.element.addEventListener('mouseenter', () => {
            this.wrapper.style.animationPlayState = 'paused';
        });

        this.element.addEventListener('mouseleave', () => {
            this.wrapper.style.animationPlayState = 'running';
        });
    }
}

/* Custom Function */
function initMarquee(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    // Breakpoint
    const width = window.innerWidth;
    const isMobile = width < 750;

    // Default fallback options
    const defaultOptions = {
        duration: 80000,
        gap: 0,
        direction: 'left',
        duplicated: true,
        startVisible: true,
        pauseOnHover: false
    };

    // Extract breakpoint settings from options
    const mobileOptions = options.mobile || {};
    const desktopOptions = options.desktop || {};

    // Merge options based on breakpoint
    const finalOptions = {
        ...defaultOptions,
        ...(isMobile ? mobileOptions : desktopOptions)
    };

    // Initialize marquee
    elements.forEach(el => {
        if (!el.dataset.marqueeInitialized) {
            new Marquee(el, finalOptions);
            el.dataset.marqueeInitialized = 'true';
        }
    });
}