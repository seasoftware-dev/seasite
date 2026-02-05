document.addEventListener('DOMContentLoaded', () => {
    // --- Animation & UI Helpers ---

    // Scroll Observer for Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.feature-card, .section-title, .hero-content, .hero-visual, .coming-soon-content, .announcement-header, .announcement-text, .announcement-sidebar');
    animatedElements.forEach(el => observer.observe(el));


    // --- UI Interactions ---

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Executor Demo Interactivity
    const execBtns = document.querySelectorAll('.exec-btn');
    const codeContent = document.querySelector('.code-content');

    if (execBtns.length > 0) {
        execBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const originalText = this.innerHTML;

                if (this.innerText.includes('Execute')) {
                    this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing...';
                    setTimeout(() => {
                        this.innerHTML = '<i class="fa-solid fa-check"></i> Executed!';
                        this.style.background = 'var(--success)';
                        console.log("Script executed");
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.style.background = '';
                        }, 1500);
                    }, 800);
                } else if (this.innerText.includes('Clear')) {
                    if (codeContent) codeContent.innerText = '';
                } else {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => this.style.transform = 'scale(1)', 100);
                }
            });
        });
    }

    // Grid Mouse Animation
    const bgAnimation = document.querySelector('.background-animation');
    if (bgAnimation) {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            bgAnimation.style.setProperty('--x', `${x}px`);
            bgAnimation.style.setProperty('--y', `${y}px`);
        });
    }

    // Mobile Menu Toggle (if present)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
});
