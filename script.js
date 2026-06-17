document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       1. TERMINAL BOOT SEQUENCE (Session-aware)
    ========================================= */
    const bootLines = [
        "Initializing boot sequence...",
        "Loading Custom RISC-V Core Configuration...",
        "Elaborating RTL hierarchy... OK",
        "Loading AXI4 Bus Drivers... OK",
        "Starting UVM Environment...",
        "Running regression suite... PASS",
        "System Ready. Powering on UI..."
    ];

    const bootTextEl = document.getElementById('boot-text');
    const bootScreen = document.getElementById('boot-screen');
    const skipBtn = document.getElementById('skip-boot');
    let isBooting = true;
    let typeTimeout;

    function endBootSequence() {
        if (!isBooting) return;
        isBooting = false;
        clearTimeout(typeTimeout);

        // Mark this session as booted
        try { sessionStorage.setItem('portfolio_booted', 'true'); } catch(e) {}

        document.body.classList.add('power-on-flash');

        setTimeout(() => {
            if (bootScreen) bootScreen.style.opacity = '0';
            setTimeout(() => {
                if (bootScreen) bootScreen.style.display = 'none';
                document.body.classList.remove('is-booting');
                document.body.classList.remove('power-on-flash');
                initPostBootAnimations();
            }, 400);
        }, 250);
    }

    // Check if user already visited this session
    let hasBooted = false;
    try { hasBooted = sessionStorage.getItem('portfolio_booted') === 'true'; } catch(e) {}

    if (hasBooted) {
        // Skip boot entirely
        isBooting = false;
        if (bootScreen) bootScreen.style.display = 'none';
        document.body.classList.remove('is-booting');
        // Defer post-boot animations to next frame
        requestAnimationFrame(() => initPostBootAnimations());
    } else {
        // Run boot sequence
        if (skipBtn) skipBtn.addEventListener('click', endBootSequence);

        let lineIndex = 0;
        let charIndex = 0;

        // Auto-skip after 4 seconds
        const autoSkipTimer = setTimeout(endBootSequence, 4000);

        function typeLine() {
            if (!isBooting) { clearTimeout(autoSkipTimer); return; }
            if (lineIndex < bootLines.length) {
                const currentLine = bootLines[lineIndex];
                if (charIndex < currentLine.length) {
                    if (bootTextEl) bootTextEl.innerHTML += currentLine.charAt(charIndex);
                    charIndex++;
                    typeTimeout = setTimeout(typeLine, Math.random() * 15 + 8);
                } else {
                    if (bootTextEl) bootTextEl.innerHTML += "<br>";
                    lineIndex++;
                    charIndex = 0;
                    typeTimeout = setTimeout(typeLine, Math.random() * 150 + 80);
                }
            } else {
                clearTimeout(autoSkipTimer);
                typeTimeout = setTimeout(endBootSequence, 400);
            }
        }

        typeLine();
    }


    /* =========================================
       2. CANVAS CIRCUIT ROUTING (Optimized)
    ========================================= */
    const canvas = document.getElementById('circuit-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let nodes = [];
        let lines = [];
        let packets = [];
        let mouse = { x: null, y: null };
        let animationId;
        let lastFrameTime = 0;
        const TARGET_FPS = 30; // Cap at 30fps for efficiency
        const FRAME_INTERVAL = 1000 / TARGET_FPS;

        function resizeCanvas() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initCircuit();
        }

        // Debounced resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeCanvas, 200);
        });

        class Node {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.radius = Math.random() > 0.85 ? 1.5 : 0.8;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 217, 255, 0.3)';
                ctx.fill();
            }
        }

        class Line {
            constructor(n1, n2) {
                this.n1 = n1;
                this.n2 = n2;
                // Pre-calculate the mid point
                if (Math.random() > 0.5) {
                    this.midX = n1.x;
                    this.midY = n2.y;
                } else {
                    this.midX = n2.x;
                    this.midY = n1.y;
                }
            }
            draw() {
                ctx.beginPath();
                ctx.moveTo(this.n1.x, this.n1.y);
                ctx.lineTo(this.midX, this.midY);
                ctx.lineTo(this.n2.x, this.n2.y);
                ctx.strokeStyle = 'rgba(0, 217, 255, 0.04)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        class Packet {
            constructor() { this.reset(); }
            reset() {
                const startNode = nodes[Math.floor(Math.random() * nodes.length)];
                const endNode = nodes[Math.floor(Math.random() * nodes.length)];
                this.startX = startNode.x;
                this.startY = startNode.y;
                this.x = startNode.x;
                this.y = startNode.y;
                this.targetX = endNode.x;
                this.targetY = endNode.y;
                this.progress = 0;
                this.speed = Math.random() * 0.008 + 0.003;
                this.color = Math.random() > 0.6
                    ? 'rgba(0, 166, 196, 0.7)'
                    : Math.random() > 0.5
                        ? 'rgba(0, 217, 255, 0.7)'
                        : 'rgba(255, 107, 0, 0.7)';
                if (Math.random() > 0.5) {
                    this.midX = startNode.x;
                    this.midY = endNode.y;
                } else {
                    this.midX = endNode.x;
                    this.midY = startNode.y;
                }
            }
            update() {
                this.progress += this.speed;
                if (this.progress >= 1) { this.reset(); return; }
                if (this.progress < 0.5) {
                    const p = this.progress * 2;
                    this.x = this.startX + (this.midX - this.startX) * p;
                    this.y = this.startY + (this.midY - this.startY) * p;
                } else {
                    const p = (this.progress - 0.5) * 2;
                    this.x = this.midX + (this.targetX - this.midX) * p;
                    this.y = this.midY + (this.targetY - this.midY) * p;
                }
                // Subtle mouse attraction
                if (mouse.x && mouse.y) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        this.x += dx * 0.01;
                        this.y += dy * 0.01;
                    }
                }
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 6;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        function initCircuit() {
            nodes = [];
            lines = [];
            packets = [];
            const gridSize = 120; // Reduced density for performance
            const cols = Math.floor(width / gridSize);
            const rows = Math.floor(height / gridSize);
            for (let i = 0; i <= cols; i++) {
                for (let j = 0; j <= rows; j++) {
                    const x = i * gridSize + (Math.random() * 50 - 25);
                    const y = j * gridSize + (Math.random() * 50 - 25);
                    nodes.push(new Node(x, y));
                }
            }
            // Cap connections
            const maxLines = 150;
            let lineCount = 0;
            for (let i = 0; i < nodes.length && lineCount < maxLines; i++) {
                for (let j = i + 1; j < nodes.length && lineCount < maxLines; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < gridSize * 1.4 && Math.random() > 0.5) {
                        lines.push(new Line(nodes[i], nodes[j]));
                        lineCount++;
                    }
                }
            }
            // Fewer packets
            const packetCount = Math.min(15, Math.max(8, Math.floor(nodes.length / 10)));
            for (let i = 0; i < packetCount; i++) {
                packets.push(new Packet());
            }
        }

        function animateCircuit(timestamp) {
            // Skip frames when tab is hidden
            if (document.hidden) {
                animationId = requestAnimationFrame(animateCircuit);
                return;
            }

            // Throttle to target FPS
            const elapsed = timestamp - lastFrameTime;
            if (elapsed < FRAME_INTERVAL) {
                animationId = requestAnimationFrame(animateCircuit);
                return;
            }
            lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL);

            ctx.clearRect(0, 0, width, height);
            lines.forEach(l => l.draw());
            nodes.forEach(n => n.draw());
            packets.forEach(p => { p.update(); p.draw(); });
            animationId = requestAnimationFrame(animateCircuit);
        }

        resizeCanvas();
        animationId = requestAnimationFrame(animateCircuit);

        // Mouse tracking for canvas
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        window.addEventListener('mousedown', () => {
            for (let i = 0; i < 3; i++) packets.push(new Packet());
            if (packets.length > 30) packets.splice(0, 3);
        });
    }


    /* =========================================
       3. CUSTOM MAGNETIC CURSOR & INTERACTIONS
    ========================================= */
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const ambientGlow = document.querySelector('.ambient-glow');

    if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener('mousemove', (e) => {
            if (cursorDot) {
                cursorDot.style.left = `${e.clientX}px`;
                cursorDot.style.top = `${e.clientY}px`;
            }
            if (ambientGlow) {
                ambientGlow.style.left = `${e.clientX}px`;
                ambientGlow.style.top = `${e.clientY}px`;
            }
            if (cursorOutline && !document.body.classList.contains('cursor-magnetic')) {
                cursorOutline.animate({
                    left: `${e.clientX}px`,
                    top: `${e.clientY}px`,
                    width: '32px', height: '32px', borderRadius: '50%'
                }, { duration: 120, fill: "forwards" });
            }
        });

        if (cursorOutline) {
            window.addEventListener('mousedown', () => {
                cursorOutline.animate([
                    { transform: 'translate(-50%, -50%) scale(1)' },
                    { transform: 'translate(-50%, -50%) scale(0.6)' },
                    { transform: 'translate(-50%, -50%) scale(1)' }
                ], { duration: 250 });
            });
        }

        const clickables = document.querySelectorAll('a:not(.magnetic), button:not(.magnetic), .project-card, .timeline-item');
        clickables.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });

        const magnetics = document.querySelectorAll('.magnetic');
        magnetics.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const strength = btn.dataset.strength || 20;
                const x = e.clientX - (rect.left + rect.width / 2);
                const y = e.clientY - (rect.top + rect.height / 2);

                btn.style.transform = `translate(${x * (strength / 100)}px, ${y * (strength / 100)}px)`;

                document.body.classList.add('cursor-magnetic');
                if (cursorOutline) {
                    cursorOutline.animate({
                        left: `${rect.left + rect.width / 2}px`,
                        top: `${rect.top + rect.height / 2}px`,
                        width: `${rect.width + 10}px`,
                        height: `${rect.height + 10}px`,
                        borderRadius: '8px'
                    }, { duration: 80, fill: "forwards" });
                }
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = `translate(0px, 0px)`;
                document.body.classList.remove('cursor-magnetic');
            });
        });

        // Spotlight Card Mouse Tracking
        const spotlightCards = document.querySelectorAll('.spotlight-card');
        spotlightCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            });
        });
    } else {
        if (cursorDot) cursorDot.style.display = 'none';
        if (cursorOutline) cursorOutline.style.display = 'none';
    }


    /* =========================================
       4. 3D CHIP TILT EFFECT
    ========================================= */
    const chipContainer = document.querySelector('.chip-container');
    const chipPackage = document.querySelector('.chip-package');

    if (chipContainer && chipPackage && window.matchMedia("(pointer: fine)").matches) {
        chipContainer.addEventListener('mousemove', (e) => {
            const rect = chipContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -12;
            const rotateY = ((x - centerX) / centerX) * 12;
            chipPackage.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(40px)`;
        });

        chipContainer.addEventListener('mouseleave', () => {
            chipPackage.style.transform = `perspective(1000px) rotateX(0) rotateY(0) translateZ(40px)`;
            chipPackage.style.transition = 'transform 0.5s ease-out';
        });
        chipContainer.addEventListener('mouseenter', () => {
            chipPackage.style.transition = 'none';
        });
    }


    /* =========================================
       5. HACKER TEXT SCRAMBLE EFFECT
    ========================================= */
    const scrambleLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?";
    const scrambleElements = document.querySelectorAll('.scramble-text');

    scrambleElements.forEach(el => {
        el.addEventListener('mouseenter', event => {
            let iterations = 0;
            const targetText = event.target.dataset.value;
            if (!targetText) return;

            clearInterval(event.target.scrambleInterval);

            event.target.scrambleInterval = setInterval(() => {
                event.target.innerText = targetText.split("")
                    .map((letter, index) => {
                        if (index < iterations) return targetText[index];
                        return scrambleLetters[Math.floor(Math.random() * scrambleLetters.length)];
                    })
                    .join("");

                if (iterations >= targetText.length) {
                    clearInterval(event.target.scrambleInterval);
                }
                iterations += 1 / 3;
            }, 30);
        });
    });


    /* =========================================
       6. SCROLL PROGRESS BAR
    ========================================= */
    const scrollProgressEl = document.getElementById('scroll-progress');
    let scrollRAF;

    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0 && scrollProgressEl) {
            const progress = (scrollTop / docHeight) * 100;
            scrollProgressEl.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    window.addEventListener('scroll', () => {
        if (scrollRAF) cancelAnimationFrame(scrollRAF);
        scrollRAF = requestAnimationFrame(updateScrollProgress);
    }, { passive: true });


    /* =========================================
       7. MOBILE HAMBURGER MENU
    ========================================= */
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (hamburgerBtn && mobileNav) {
        hamburgerBtn.addEventListener('click', () => {
            const isActive = hamburgerBtn.classList.toggle('active');
            mobileNav.classList.toggle('active');
            hamburgerBtn.setAttribute('aria-expanded', isActive);
            document.body.style.overflow = isActive ? 'hidden' : '';
        });

        // Close on link click
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                mobileNav.classList.remove('active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }


    /* =========================================
       8. ANIMATED NUMBER COUNTERS
    ========================================= */
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            if (counter.dataset.animated) return;

            const target = parseInt(counter.dataset.target, 10);
            const duration = 2000; // ms
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);
                counter.textContent = current;
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                    counter.dataset.animated = 'true';
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }


    /* =========================================
       9. ACTIVE NAV SECTION HIGHLIGHTING
    ========================================= */
    function initActiveNav() {
        const navLinks = document.querySelectorAll('.nav-links a[data-section]');
        const sections = [];

        navLinks.forEach(link => {
            const sectionId = link.dataset.section;
            const section = document.getElementById(sectionId);
            if (section) sections.push({ el: section, link: link, id: sectionId });
        });

        if (sections.length === 0) return;

        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    const match = sections.find(s => s.el === entry.target);
                    if (match) match.link.classList.add('active');
                }
            });
        }, {
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        });

        sections.forEach(s => navObserver.observe(s.el));
    }


    /* =========================================
       10. PARALLAX & SECTION REVEALS (Post-Boot)
    ========================================= */
    function initPostBootAnimations() {
        // Parallax (debounced with rAF, GPU-accelerated)
        let parallaxRAF;
        window.addEventListener('scroll', () => {
            if (parallaxRAF) cancelAnimationFrame(parallaxRAF);
            parallaxRAF = requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                document.querySelectorAll('.parallax').forEach(el => {
                    const speed = parseFloat(el.dataset.speed) || 0.03;
                    const rect = el.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        el.style.transform = `translate3d(0, ${scrolled * speed}px, 0)`;
                    }
                });
            });
        }, { passive: true });

        // Intersection Observer for Section Fade-ins
        const contentSections = document.querySelectorAll('.content-section');
        contentSections.forEach(section => {
            section.classList.add('fade-in-section');
        });

        // Also fade in the stats section
        const statsSection = document.querySelector('.stats-section');
        if (statsSection) statsSection.classList.add('fade-in-section');

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -8% 0px',
            threshold: 0.05
        };

        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');

                    // JS-driven stagger delays (unlimited children)
                    const staggered = entry.target.querySelectorAll('.stagger-children');
                    staggered.forEach(el => {
                        el.classList.add('is-visible');
                        const children = el.children;
                        for (let i = 0; i < children.length; i++) {
                            children[i].style.transitionDelay = `${0.08 * (i + 1)}s`;
                        }
                    });

                    // Trigger typewriter for paragraphs
                    const typewriters = entry.target.querySelectorAll('.typewriter-para');
                    typewriters.forEach(para => {
                        if (!para.classList.contains('typed')) {
                            typewriteElement(para);
                        }
                    });

                    // Trigger counters
                    if (entry.target.classList.contains('stats-section') ||
                        entry.target.querySelector('.stats-section')) {
                        animateCounters();
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        contentSections.forEach(section => sectionObserver.observe(section));
        if (statsSection) sectionObserver.observe(statsSection);

        // Hero section typewriter (visible on load)
        const heroTypewriters = document.querySelectorAll('.hero-intro .typewriter-para');
        heroTypewriters.forEach(para => typewriteElement(para));

        // Stats visible on load
        const heroStats = document.querySelector('.hero-section .stats-section');
        if (heroStats) {
            // Small delay so animation is visible
            setTimeout(() => animateCounters(), 600);
        }

        // Init active nav highlighting
        initActiveNav();
    }


    /* =========================================
       11. TYPEWRITER EFFECT (HTML-preserving)
    ========================================= */
    function typewriteElement(el) {
        el.classList.add('typed');
        const htmlContent = el.innerHTML;
        el.innerHTML = '';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const nodes = Array.from(tempDiv.childNodes);

        async function typeChildIntoParent(childNode, parentEl) {
            if (childNode.nodeType === Node.TEXT_NODE) {
                const text = childNode.textContent;
                for (let i = 0; i < text.length; i++) {
                    parentEl.appendChild(document.createTextNode(text[i]));
                    await new Promise(r => setTimeout(r, 8));
                }
            } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                const clone = childNode.cloneNode(false);
                parentEl.appendChild(clone);
                const childNodes = Array.from(childNode.childNodes);
                for (let child of childNodes) {
                    await typeChildIntoParent(child, clone);
                }
            }
        }

        async function startTyping() {
            for (let node of nodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    for (let i = 0; i < text.length; i++) {
                        el.appendChild(document.createTextNode(text[i]));
                        await new Promise(r => setTimeout(r, 8));
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const clone = node.cloneNode(false);
                    el.appendChild(clone);
                    const childNodes = Array.from(node.childNodes);
                    for (let child of childNodes) {
                        await typeChildIntoParent(child, clone);
                    }
                }
            }
        }

        startTyping();
    }


    /* =========================================
       12. SMOOTH NAVIGATION ANCHOR LINKS
    ========================================= */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        });
    });

});
