document.addEventListener("DOMContentLoaded", () => {
    
    /* =========================================
       1. TERMINAL BOOT SEQUENCE
    ========================================= */
    const bootLines = [
        "Initializing boot sequence...",
        "Loading SiFive RISC-V Core Configuration...",
        "Mounting Core Local Port (CLP)... OK",
        "Loading AXI4 Bus Drivers... OK",
        "Starting UVM Environment...",
        "Checking coverage closure... 100% achieved.",
        "System Ready. Powering on UI..."
    ];
    
    const bootTextEl = document.getElementById('boot-text');
    const bootScreen = document.getElementById('boot-screen');
    const skipBtn = document.getElementById('skip-boot');
    let lineIndex = 0;
    let charIndex = 0;
    let isBooting = true;
    let typeTimeout;

    function endBootSequence() {
        if (!isBooting) return;
        isBooting = false;
        clearTimeout(typeTimeout);
        
        // Trigger CRT Flash
        document.body.classList.add('power-on-flash');
        
        setTimeout(() => {
            bootScreen.style.opacity = '0';
            setTimeout(() => {
                bootScreen.style.display = 'none';
                document.body.classList.remove('is-booting');
                document.body.classList.remove('power-on-flash');
                initPostBootAnimations();
            }, 500);
        }, 300);
    }

    skipBtn.addEventListener('click', endBootSequence);

    function typeLine() {
        if (!isBooting) return;
        if (lineIndex < bootLines.length) {
            const currentLine = bootLines[lineIndex];
            if (charIndex < currentLine.length) {
                bootTextEl.innerHTML += currentLine.charAt(charIndex);
                charIndex++;
                typeTimeout = setTimeout(typeLine, Math.random() * 20 + 10);
            } else {
                bootTextEl.innerHTML += "<br>";
                lineIndex++;
                charIndex = 0;
                typeTimeout = setTimeout(typeLine, Math.random() * 200 + 100);
            }
        } else {
            typeTimeout = setTimeout(endBootSequence, 500);
        }
    }
    
    // Start boot sequence
    typeLine();


    /* =========================================
       2. CANVAS CIRCUIT ROUTING SIMULATION
    ========================================= */
    const canvas = document.getElementById('circuit-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let nodes = [];
    let lines = [];
    let packets = [];
    let mouse = { x: null, y: null };

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initCircuit();
    }

    window.addEventListener('resize', resizeCanvas);

    class Node {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() > 0.8 ? 2 : 1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(57, 208, 216, 0.4)';
            ctx.fill();
        }
    }

    class Line {
        constructor(n1, n2) {
            this.n1 = n1;
            this.n2 = n2;
        }
        draw() {
            ctx.beginPath();
            ctx.moveTo(this.n1.x, this.n1.y);
            // Draw an orthogonal right-angle trace instead of straight line
            // for circuit board aesthetic
            let midX = this.n1.x;
            let midY = this.n2.y;
            if (Math.random() > 0.5) {
                midX = this.n2.x;
                midY = this.n1.y;
            }
            ctx.lineTo(midX, midY);
            ctx.lineTo(this.n2.x, this.n2.y);
            ctx.strokeStyle = 'rgba(57, 208, 216, 0.05)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    class Packet {
        constructor() {
            this.reset();
        }
        reset() {
            const startNode = nodes[Math.floor(Math.random() * nodes.length)];
            const endNode = nodes[Math.floor(Math.random() * nodes.length)];
            this.x = startNode.x;
            this.y = startNode.y;
            this.targetX = endNode.x;
            this.targetY = endNode.y;
            this.progress = 0;
            this.speed = Math.random() * 0.01 + 0.005;
            this.color = Math.random() > 0.5 ? 'rgba(57, 208, 216, 0.8)' : 'rgba(255, 158, 44, 0.8)';
            
            // Waypoint for right-angle routing
            this.midX = startNode.x;
            this.midY = endNode.y;
            if (Math.random() > 0.5) {
                this.midX = endNode.x;
                this.midY = startNode.y;
            }
        }
        update() {
            this.progress += this.speed;
            if (this.progress >= 1) {
                this.reset();
                return;
            }

            // Interpolate position along the right-angle path
            if (this.progress < 0.5) {
                let p = this.progress * 2;
                this.x = this.x + (this.midX - this.x) * p;
                this.y = this.y + (this.midY - this.y) * p;
            } else {
                let p = (this.progress - 0.5) * 2;
                this.x = this.midX + (this.targetX - this.midX) * p;
                this.y = this.midY + (this.targetY - this.midY) * p;
            }
            
            // Attract slightly to mouse
            if (mouse.x && mouse.y) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 200) {
                    this.x += dx * 0.02;
                    this.y += dy * 0.02;
                }
            }
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        }
    }

    function initCircuit() {
        nodes = [];
        lines = [];
        packets = [];
        const gridSize = 80;
        const cols = Math.floor(width / gridSize);
        const rows = Math.floor(height / gridSize);

        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                // Add some randomness to grid points
                let x = i * gridSize + (Math.random() * 40 - 20);
                let y = j * gridSize + (Math.random() * 40 - 20);
                nodes.push(new Node(x, y));
            }
        }

        // Connect nearby nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                let dx = nodes[i].x - nodes[j].x;
                let dy = nodes[i].y - nodes[j].y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < gridSize * 1.5 && Math.random() > 0.4) {
                    lines.push(new Line(nodes[i], nodes[j]));
                }
            }
        }

        for (let i = 0; i < 30; i++) {
            packets.push(new Packet());
        }
    }

    function animateCircuit() {
        ctx.clearRect(0, 0, width, height);
        
        lines.forEach(l => l.draw());
        nodes.forEach(n => n.draw());
        
        packets.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animateCircuit);
    }

    resizeCanvas();
    animateCircuit();


    /* =========================================
       3. CUSTOM MAGNETIC CURSOR & INTERACTIONS
    ========================================= */
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const ambientGlow = document.querySelector('.ambient-glow');
    
    if (window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            
            // Move cursor dot instantly
            cursorDot.style.left = `${mouse.x}px`;
            cursorDot.style.top = `${mouse.y}px`;
            
            // Ambient glow
            if(ambientGlow) {
                ambientGlow.style.left = `${mouse.x}px`;
                ambientGlow.style.top = `${mouse.y}px`;
            }

            // Only animate outline if not magnetically snapped
            if (!document.body.classList.contains('cursor-magnetic')) {
                cursorOutline.animate({
                    left: `${mouse.x}px`,
                    top: `${mouse.y}px`,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%'
                }, { duration: 150, fill: "forwards" });
            }
        });

        // Click effect (ripple)
        window.addEventListener('mousedown', () => {
            cursorOutline.animate([
                { transform: 'translate(-50%, -50%) scale(1)' },
                { transform: 'translate(-50%, -50%) scale(0.5)' },
                { transform: 'translate(-50%, -50%) scale(1)' }
            ], { duration: 300 });
            
            // Spawn extra packets on click
            for(let i=0; i<5; i++) packets.push(new Packet());
            if(packets.length > 50) packets.splice(0, 5); // Keep count reasonable
        });

        // Hover states
        const clickables = document.querySelectorAll('a:not(.magnetic), button:not(.magnetic), .project-card, .timeline-item');
        clickables.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });

        // Magnetic Elements
        const magnetics = document.querySelectorAll('.magnetic');
        magnetics.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const strength = btn.dataset.strength || 20;
                
                // Calculate pull
                const x = e.clientX - (rect.left + rect.width / 2);
                const y = e.clientY - (rect.top + rect.height / 2);
                
                btn.style.transform = `translate(${x * (strength/100)}px, ${y * (strength/100)}px)`;

                // Snap cursor to button
                document.body.classList.add('cursor-magnetic');
                cursorOutline.animate({
                    left: `${rect.left + rect.width/2}px`,
                    top: `${rect.top + rect.height/2}px`,
                    width: `${rect.width + 10}px`,
                    height: `${rect.height + 10}px`,
                    borderRadius: '8px'
                }, { duration: 100, fill: "forwards" });
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = `translate(0px, 0px)`;
                document.body.classList.remove('cursor-magnetic');
            });
        });
    } else {
        if(cursorDot) cursorDot.style.display = 'none';
        if(cursorOutline) cursorOutline.style.display = 'none';
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
            
            const rotateX = ((y - centerY) / centerY) * -15; 
            const rotateY = ((x - centerX) / centerX) * 15;
            
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
       5. PARALLAX & SMOOTH SCROLLING (Post-Boot)
    ========================================= */
    function initPostBootAnimations() {
        // Parallax scroll listener
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            document.querySelectorAll('.parallax').forEach(el => {
                const speed = el.dataset.speed || 0.05;
                // Only move if element is somewhat in view to save performance
                const rect = el.getBoundingClientRect();
                if(rect.top < window.innerHeight && rect.bottom > 0) {
                    el.style.transform = `translateY(${scrolled * speed}px)`;
                }
            });
        });
    }
    
    // Fallback: If skip isn't clicked, animations start after boot sequence automatically
    // (handled in endBootSequence())

    // Smooth navigation anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 90; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        });
    });

});
