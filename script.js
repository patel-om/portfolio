document.addEventListener("DOMContentLoaded", () => {
    // 1. Custom Cursor Logic
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const ambientGlow = document.querySelector('.ambient-glow');
    
    // Only run cursor logic on desktop devices (non-touch)
    if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            
            // Move cursor dot instantly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            
            // Move cursor outline with slight delay for smooth effect
            // using animate for better performance
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
            
            // Move ambient background glow to follow mouse broadly
            if(ambientGlow) {
                ambientGlow.style.left = `${posX}px`;
                ambientGlow.style.top = `${posY}px`;
            }
        });

        // Add hover effect to clickable elements
        const clickables = document.querySelectorAll('a, button, .bit, .project-card');
        clickables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
            });
        });
    } else {
        // Hide custom cursor on mobile/touch
        if(cursorDot) cursorDot.style.display = 'none';
        if(cursorOutline) cursorOutline.style.display = 'none';
    }

    // 2. 3D Tilt Effect on Chip Hero Section
    const chipContainer = document.querySelector('.chip-container');
    const chipPackage = document.querySelector('.chip-package');

    if (chipContainer && chipPackage && window.matchMedia("(pointer: fine)").matches) {
        chipContainer.addEventListener('mousemove', (e) => {
            const rect = chipContainer.getBoundingClientRect();
            
            // Calculate mouse position relative to the center of the container
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotation amount (adjust divisor for more/less tilt)
            const rotateX = ((y - centerY) / centerY) * -15; // Max 15deg tilt
            const rotateY = ((x - centerX) / centerX) * 15;
            
            chipPackage.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(30px)`;
        });

        chipContainer.addEventListener('mouseleave', () => {
            // Reset position smoothly
            chipPackage.style.transform = `perspective(1000px) rotateX(0) rotateY(0) translateZ(30px)`;
            chipPackage.style.transition = 'transform 0.5s ease-out';
        });
        
        chipContainer.addEventListener('mouseenter', () => {
            // Remove transition while moving for instant response
            chipPackage.style.transition = 'none';
        });
    }

    // 3. Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 90; // Adjust based on sticky nav height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // 4. Advanced Intersection Observer for Staggered Fade-in Animations
    const sections = document.querySelectorAll('.content-section');
    
    // Add base classes
    sections.forEach(section => {
        section.classList.add('fade-in-section');
        
        // Find elements to stagger inside sections
        const projectsGrid = section.querySelector('.projects-grid');
        if(projectsGrid) projectsGrid.classList.add('stagger-children');
        
        const registerMap = section.querySelector('.register-map');
        if(registerMap) registerMap.classList.add('stagger-children');
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px', // Trigger slightly before it hits bottom
        threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // Trigger stagger children if present
                const staggered = entry.target.querySelectorAll('.stagger-children');
                staggered.forEach(el => el.classList.add('is-visible'));
                
                // Unobserve to run animation only once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });
});
