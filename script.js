document.addEventListener("DOMContentLoaded", () => {
    // 1. Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // 2. Intersection Observer for fade-in animations
    // Add fade-in classes to elements we want to animate
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.add('fade-in-section');
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: unobserve after animating to only animate once
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // 3. Optional: Add a subtle parallax effect to the PCB background
    const pcbBackground = document.querySelector('.pcb-background');
    if (pcbBackground) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            pcbBackground.style.transform = `translateY(${scrolled * 0.1}px)`;
        });
    }
});
