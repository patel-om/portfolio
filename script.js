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

    // v3 premium: CRT boot sequence retired — content fades in immediately
    let hasBooted = true;

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
                ctx.fillStyle = 'rgba(61, 155, 255, 0.3)';
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
                ctx.strokeStyle = 'rgba(61, 155, 255, 0.04)';
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
                this.speed = Math.random() * 0.003 + 0.0012;
                this.color = Math.random() > 0.6
                    ? 'rgba(30, 111, 217, 0.7)'
                    : Math.random() > 0.5
                        ? 'rgba(61, 155, 255, 0.7)'
                        : 'rgba(138, 152, 172, 0.7)';
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
    // v3 premium: hover-scramble retired for a calmer feel
    const scrambleElements = [];

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


    /* =========================================
       13. INTERACTIVE ARCHITECTURE (AXI4)
    ========================================= */
    (function initArchitecture() {
        // Block chain: hover highlights the access path down to the hovered block
        const chainSvg = document.getElementById('arch-chain');
        if (chainSvg) {
            const blocks = Array.from(chainSvg.querySelectorAll('.arch-block'));
            const conns = Array.from(chainSvg.querySelectorAll('.arch-conn'));
            blocks.forEach((block, idx) => {
                block.addEventListener('mouseenter', () => {
                    chainSvg.classList.add('dimmed');
                    blocks.forEach((b, i) => b.classList.toggle('hi', i <= idx));
                    conns.forEach((c, i) => c.classList.toggle('hi', i < idx));
                });
                block.addEventListener('mouseleave', () => {
                    chainSvg.classList.remove('dimmed');
                    blocks.forEach(b => b.classList.remove('hi'));
                    conns.forEach(c => c.classList.remove('hi'));
                });
            });
        }

        // Transaction visualizer
        const lanesSvg = document.getElementById('axi-lanes');
        const packetLayer = document.getElementById('axi-packets');
        const logEl = document.getElementById('axi-log');
        const btnRead = document.getElementById('axi-read-btn');
        const btnWrite = document.getElementById('axi-write-btn');
        if (!lanesSvg || !packetLayer || !logEl || !btnRead || !btnWrite) return;

        const X_M = 90, X_S = 550;
        const LANE_Y = { AW: 90, W: 150, B: 210, AR: 290, R: 350 };
        const LANE_COLOR = { AW: '#3D9BFF', W: '#9AA7BA', B: '#30D158', AR: '#3D9BFF', R: '#30D158' };
        let axiBusy = false;

        const wait = ms => new Promise(r => setTimeout(r, ms));

        function setLog(html) { logEl.innerHTML = html; }

        function laneActive(ch, on) {
            lanesSvg.querySelectorAll(`[data-ch="${ch}"]`).forEach(el => el.classList.toggle('active', on));
        }

        function sendPacket(ch, reverse) {
            return new Promise(resolve => {
                const from = reverse ? X_S : X_M;
                const to = reverse ? X_M : X_S;
                const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttribute('cy', LANE_Y[ch]);
                c.setAttribute('cx', from);
                c.setAttribute('r', 6);
                c.setAttribute('fill', LANE_COLOR[ch]);
                c.setAttribute('class', 'axi-packet');
                c.style.color = LANE_COLOR[ch]; // drives drop-shadow via currentColor
                packetLayer.appendChild(c);
                laneActive(ch, true);
                const D = 700;
                const t0 = performance.now();
                function step(t) {
                    const p = Math.min((t - t0) / D, 1);
                    const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
                    c.setAttribute('cx', from + (to - from) * e);
                    if (p < 1) {
                        requestAnimationFrame(step);
                    } else {
                        setTimeout(() => { c.remove(); laneActive(ch, false); resolve(); }, 150);
                    }
                }
                requestAnimationFrame(step);
            });
        }

        async function runTxn(kind) {
            if (axiBusy) return;
            axiBusy = true;
            btnRead.disabled = true;
            btnWrite.disabled = true;
            if (kind === 'write') {
                setLog('<span class="t-cyan">AWVALID ↑ … AWREADY ↑</span> — write address <span class="t-cyan">0x0200_1000</span> accepted');
                await sendPacket('AW', false);
                setLog('<span class="t-orange">WVALID ↑ … WLAST</span> — data beat transferred');
                await sendPacket('W', false);
                setLog('<span class="t-lime">BVALID ↑</span> — BRESP = <span class="t-lime">OKAY ✓</span> write complete');
                await sendPacket('B', true);
            } else {
                setLog('<span class="t-cyan">ARVALID ↑ … ARREADY ↑</span> — read address <span class="t-cyan">0x0200_1000</span> accepted');
                await sendPacket('AR', false);
                setLog('<span class="t-lime">RVALID ↑</span> — RDATA returned, RRESP = <span class="t-lime">OKAY ✓</span>');
                await sendPacket('R', true);
            }
            await wait(300);
            setLog('idle — fire a READ or WRITE to watch the handshake');
            btnRead.disabled = false;
            btnWrite.disabled = false;
            axiBusy = false;
        }

        btnRead.addEventListener('click', () => runTxn('read'));
        btnWrite.addEventListener('click', () => runTxn('write'));
    })();


    /* =========================================
       14. INTERACTIVE TERMINAL
    ========================================= */
    (function initTerminal() {
        const overlay = document.getElementById('terminal-overlay');
        const toggle = document.getElementById('terminal-toggle');
        const closeBtn = document.getElementById('terminal-close');
        const bodyEl = document.getElementById('term-body');
        const input = document.getElementById('term-input');
        if (!overlay || !toggle || !closeBtn || !bodyEl || !input) return;

        const history = [];
        let histIdx = -1;
        let welcomed = false;
        let regBusy = false;

        const wait = ms => new Promise(r => setTimeout(r, ms));
        const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        function print(html, cls) {
            const line = document.createElement('div');
            line.className = 'term-line' + (cls ? ' ' + cls : '');
            line.innerHTML = html;
            bodyEl.appendChild(line);
            bodyEl.scrollTop = bodyEl.scrollHeight;
            return line;
        }

        function openTerm() {
            overlay.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
            if (!welcomed) {
                welcomed = true;
                print('Om Patel — verification shell <span class="t-dim">(build v3.1-pipeline)</span>', 't-cyan');
                print('Type <span class="t-lime">help</span> to list commands.', 't-dim');
            }
            input.focus();
        }

        function closeTerm() {
            overlay.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }

        const SECTIONS = ['about', 'now', 'experience', 'architecture', 'projects', 'skills', 'education', 'achievements'];

        function gotoSection(id) {
            const target = document.getElementById(id);
            if (!target) return false;
            closeTerm();
            const top = target.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: top, behavior: 'smooth' });
            return true;
        }

        async function makeRegression() {
            if (regBusy) { print('make: regression already running', 't-rose'); return; }
            regBusy = true;
            print('[VCS] Compiling RTL + testbench ...', 't-dim');
            await wait(450);
            print('[VCS] Elaboration complete — 0 errors, 0 warnings', 't-dim');
            print('[SIM] Dispatching 17 tests to Slurm ...', 't-dim');
            const bar = print('', 't-lime');
            for (let i = 0; i <= 20; i++) {
                bar.textContent = '█'.repeat(i) + '░'.repeat(20 - i) + '  ' + (i * 5) + '%';
                bodyEl.scrollTop = bodyEl.scrollHeight;
                await wait(65);
            }
            print('[RESULT] 17/17 PASS · 0 FAIL · coverage merged ✓', 't-lime');
            regBusy = false;
        }

        const COMMANDS = {
            help() {
                print('Available commands:');
                print('  <span class="t-lime">whoami</span>        who is Om?');
                print('  <span class="t-lime">experience</span>    SiFive highlights');
                print('  <span class="t-lime">projects</span>      selected work');
                print('  <span class="t-lime">skills</span>        tech stack');
                print('  <span class="t-lime">goto</span> &lt;sec&gt;    jump to a section (' + SECTIONS.join(', ') + ')');
                print('  <span class="t-lime">resume</span>        open resume PDF');
                print('  <span class="t-lime">contact</span>       reach me');
                print('  <span class="t-lime">clear</span>         clear terminal');
                print('Hint: DV engineers also try <span class="t-orange">make regression</span>, <span class="t-orange">coverage</span>, <span class="t-orange">promotion</span>, <span class="t-orange">pipeline</span>, <span class="t-orange">version</span>', 't-dim');
            },
            whoami() {
                print('Om Patel', 't-cyan');
                print('Design Verification Engineer @ SiFive');
                print('RISC-V · SystemVerilog · UVM · AXI4 · AI workflows');
                print('Ahmedabad, India', 't-dim');
            },
            experience() {
                print('SiFive — Design Verification Engineer <span class="t-dim">(Jul 2024 → present)</span>', 't-cyan');
                print('· Control Port & CLP owner — 17 functional tests, 100% coverage closure');
                print('· CLP coverage driven <span class="t-orange">50%</span> → <span class="t-lime">100%</span>');
                print('· 5 RTL bugs found via regression analysis & triage');
                print('· SiFive Intelligence™ vertical — 2 FR programs, 10+ core configs');
                print('· VDB→HTML coverage pipeline (self-built, in production)');
                print('· NoC verification — <span class="t-cyan">ongoing</span>');
            },
            projects() {
                print('Control Port / CLP Verification   <span class="t-dim">AXI4 · SiFive</span>');
                print('AXI4-Lite Slave UVM VIP           <span class="t-dim">100% coverage</span>');
                print('RISC-V ALU UVM Testbench          <span class="t-dim">constrained-random</span>');
                print('Synchronous FIFO UVM + SVA        <span class="t-dim">corner cases</span>');
                print('VDB→HTML Coverage Pipeline        <span class="t-dim">Python</span>');
                print('Try <span class="t-lime">goto projects</span> for details.', 't-dim');
            },
            skills() {
                print('<span class="t-cyan">hardware</span>    : SystemVerilog · UVM · AXI4 · RISC-V · SVA · NoC');
                print('<span class="t-cyan">programming</span> : C/C++ · Python · Ruby · YAML · SQL');
                print('<span class="t-cyan">tools</span>       : VCS · Verdi · Git · Slurm · JIRA · Jenkins-style regression');
                print('<span class="t-cyan">ml</span>          : TensorFlow · PyTorch · LSTM · Liquid NN');
            },
            contact() {
                print('email    : <a href="mailto:patel2om002@gmail.com">patel2om002@gmail.com</a>');
                print('linkedin : <a href="https://linkedin.com/in/om-patel-0369" target="_blank" rel="noopener noreferrer">linkedin.com/in/om-patel-0369</a>');
                print('github   : <a href="https://github.com/patel-om" target="_blank" rel="noopener noreferrer">github.com/patel-om</a>');
            },
            resume() {
                print('Opening resume ...', 't-dim');
                window.open('Om Patel.pdf', '_blank');
            },
            clear() {
                bodyEl.innerHTML = '';
            },
            coverage() {
                print('── Coverage Report (CLP) ─────────────', 't-dim');
                print('functional : <span class="t-lime">100% ████████████████████</span>');
                print('line       : <span class="t-lime">100%</span>   branch  : <span class="t-lime">100%</span>');
                print('toggle     : <span class="t-lime">100%</span>   assert  : <span class="t-lime">100%</span>');
                print('status     : <span class="t-lime">CLOSED ✓</span>  <span class="t-dim">(was 50% at handoff)</span>');
            },
            promotion() {
                print('Checking promotion.status ...', 't-dim');
                print('Current status: waiting for next review :)', 't-orange');
            },
            pipeline() {
                const cur = document.body.dataset.stage || 'FETCH';
                const names = ['FETCH', 'DECODE', 'EXECUTE', 'MEMORY', 'WRITEBACK'];
                const row = names.map(nm => (nm === cur ? '<span class="t-cyan">◉</span>' : '○')).join('────');
                print('IF ─ ID ─ EX ─ MEM ─ WB', 't-dim');
                print(row);
                print('instruction currently in: <span class="t-cyan">' + cur + '</span> stage');
                print('Scroll the page — you are the instruction.', 't-dim');
            },
            version() {
                print('portfolio <span class="t-cyan">v3.1-pipeline</span>');
                print('theme      : near-black · electric blue · glass', 't-dim');
                print('toolchain  : HTML5 · CSS3 · vanilla JS — zero build step', 't-dim');
                print('regression : <span class="t-lime">ALL CHECKS PASSED</span>');
            }
        };

        function runCommand(raw) {
            const cmd = raw.trim();
            print('<span class="tf-prompt">om@verif</span><span class="t-dim">:</span><span class="tf-path">~</span><span class="t-dim">$</span> ' + esc(cmd));
            if (!cmd) return;
            const parts = cmd.split(/\s+/);
            const name = parts[0].toLowerCase();
            const arg = parts.slice(1).join(' ').toLowerCase();

            if (name === 'make') {
                if (arg === 'regression') { makeRegression(); }
                else { print("make: *** No rule to make target '" + esc(arg || '') + "'.  Stop.", 't-rose'); }
            } else if (name === 'goto') {
                if (!gotoSection(arg)) print('goto: unknown section. Try: ' + SECTIONS.join(', '), 't-rose');
            } else if (name === 'sudo') {
                print('Permission denied. This incident will be reported to the DV lead.', 't-rose');
            } else if (name === 'ls') {
                print(SECTIONS.join('/  ') + '/', 't-cyan');
            } else if (COMMANDS[name]) {
                COMMANDS[name]();
            } else {
                print('command not found: ' + esc(name) + ' — try <span class="t-lime">help</span>', 't-rose');
            }
        }

        toggle.addEventListener('click', openTerm);
        closeBtn.addEventListener('click', closeTerm);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeTerm(); });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const value = input.value;
                input.value = '';
                if (value.trim()) { history.push(value); }
                histIdx = history.length;
                runCommand(value);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (histIdx > 0) { histIdx--; input.value = history[histIdx] || ''; }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx] || ''; }
                else { histIdx = history.length; input.value = ''; }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('open')) {
                closeTerm();
            } else if (e.key === '`' && !overlay.classList.contains('open')) {
                const t = e.target;
                if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
                e.preventDefault();
                openTerm();
            }
        });
    })();


    /* =========================================
       15. KONAMI CODE — CPU DIE EASTER EGG
    ========================================= */
    (function initKonami() {
        const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let pos = 0;
        let dieOverlay = null;

        function showDie() {
            if (dieOverlay) return;
            dieOverlay = document.createElement('div');
            dieOverlay.id = 'die-overlay';
            dieOverlay.setAttribute('role', 'presentation');
            let cells = '';
            for (let r = 0; r < 6; r++) {
                for (let c = 0; c < 8; c++) {
                    const delay = ((r + c) * 0.12).toFixed(2);
                    cells += `<div class="die-cell" style="animation-delay:${delay}s"></div>`;
                }
            }
            dieOverlay.innerHTML =
                '<div class="die-package">' +
                    '<div class="die-grid">' + cells + '</div>' +
                    '<div class="die-caption">RISC-V CORE COMPLEX — you found the die shot. Verified. ✓</div>' +
                '</div>';
            document.body.appendChild(dieOverlay);
            const dismiss = () => {
                if (!dieOverlay) return;
                dieOverlay.classList.add('fading');
                setTimeout(() => { if (dieOverlay) { dieOverlay.remove(); dieOverlay = null; } }, 500);
            };
            dieOverlay.addEventListener('click', dismiss);
            setTimeout(dismiss, 6000);
        }

        document.addEventListener('keydown', (e) => {
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            if (key === SEQ[pos]) {
                pos++;
                if (pos === SEQ.length) { pos = 0; showDie(); }
            } else {
                pos = (key === SEQ[0]) ? 1 : 0;
            }
        });
    })();


    /* =========================================
       16. BUTTON RIPPLE MICRO-INTERACTION
    ========================================= */
    document.querySelectorAll('.contact-btn, .axi-btn, #terminal-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const span = document.createElement('span');
            span.className = 'ripple';
            span.style.width = span.style.height = size + 'px';
            span.style.left = (e.clientX - rect.left - size / 2) + 'px';
            span.style.top = (e.clientY - rect.top - size / 2) + 'px';
            btn.appendChild(span);
            setTimeout(() => span.remove(), 650);
        });
    });


    /* =========================================
       17. CPU PIPELINE HUD (Signature Feature)
       Scroll = one instruction flowing through
       IF → ID → EX → MEM → WB
    ========================================= */
    (function initPipelineHUD() {
        const hud = document.getElementById('pipeline-hud');
        if (!hud) return;
        const stages = Array.from(hud.querySelectorAll('.phud-stage'));
        const packet = hud.querySelector('.phud-packet');
        const fill = hud.querySelector('.phud-fill');
        const anchors = stages.map(s => document.getElementById(s.dataset.target));
        if (anchors.some(a => !a) || !packet || !fill) return;

        const STAGE_NAMES = ['FETCH', 'DECODE', 'EXECUTE', 'MEMORY', 'WRITEBACK'];
        let lastActive = -1;
        let hudRAF;

        function update() {
            const ref = window.scrollY + window.innerHeight * 0.35;
            const tops = anchors.map(a => a.getBoundingClientRect().top + window.scrollY);
            const n = tops.length;

            // piecewise-linear progress between stage anchors
            let overall;
            if (ref <= tops[0]) {
                overall = 0;
            } else if (ref >= tops[n - 1]) {
                overall = 1;
            } else {
                let i = 0;
                while (i < n - 2 && ref >= tops[i + 1]) i++;
                const frac = (ref - tops[i]) / Math.max(tops[i + 1] - tops[i], 1);
                overall = (i + Math.min(frac, 1)) / (n - 1);
            }

            // fully retire the instruction at the very bottom of the page
            const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 60;
            if (atEnd) overall = 1;
            hud.classList.toggle('retired', atEnd);

            const pct = (overall * 100).toFixed(2);
            packet.style.top = `calc(${pct}% - 5px)`;
            fill.style.height = pct + '%';

            const active = Math.min(Math.floor(overall * (n - 1) + 0.5), n - 1);
            stages.forEach((s, i) => {
                s.classList.toggle('done', i < active || (i === active && atEnd));
                s.classList.toggle('active', i === active);
            });
            if (active !== lastActive) {
                lastActive = active;
                document.body.dataset.stage = STAGE_NAMES[active];
                const dot = stages[active].querySelector('.phud-dot');
                if (dot) {
                    // restart the pipeline-register glow pulse
                    dot.classList.remove('pulse');
                    void dot.offsetWidth;
                    dot.classList.add('pulse');
                }
            }
        }

        window.addEventListener('scroll', () => {
            if (hudRAF) cancelAnimationFrame(hudRAF);
            hudRAF = requestAnimationFrame(update);
        }, { passive: true });
        window.addEventListener('resize', () => {
            if (hudRAF) cancelAnimationFrame(hudRAF);
            hudRAF = requestAnimationFrame(update);
        });

        stages.forEach(s => {
            s.addEventListener('click', () => {
                const target = document.getElementById(s.dataset.target);
                if (!target) return;
                const top = target.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: top, behavior: 'smooth' });
            });
        });

        update();
    })();

});
