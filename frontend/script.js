// Mobile Menu Toggle
const mobileMenuBtn = document.createElement('button');
mobileMenuBtn.classList.add('mobile-menu-btn');
mobileMenuBtn.innerHTML = '☰';
mobileMenuBtn.style.cssText = `
    display: none;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--gray-900);
`;

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar Background on Scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for Fade-in Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply fade-in to sections
const sections = document.querySelectorAll('.feature-card, .pricing-card, .comparison-row');
sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Copy Code Snippet Functionality
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // Show success message
    showNotification('Copied to clipboard!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--gray-900);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(10px)';
        notification.style.transition = 'opacity 0.3s, transform 0.3s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Add copy buttons to code snippets if they exist
document.querySelectorAll('pre code').forEach(code => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    code.parentNode.insertBefore(wrapper, code.parentNode);
    wrapper.appendChild(code.parentNode);
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 6px 12px;
        background: var(--gray-100);
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    `;
    copyBtn.addEventListener('click', () => {
        copyToClipboard(code.textContent);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = 'Copy';
        }, 2000);
    });
    wrapper.appendChild(copyBtn);
});

// Mobile Menu Toggle
if (window.innerWidth <= 768) {
    const navContent = document.querySelector('.nav-content');
    const navLinks = document.querySelector('.nav-links');
    
    if (navContent && navLinks) {
        mobileMenuBtn.style.display = 'block';
        navContent.insertBefore(mobileMenuBtn, navContent.lastElementChild);
        
        mobileMenuBtn.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '60px';
                navLinks.style.left = '0';
                navLinks.style.right = '0';
                navLinks.style.background = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }
        });
    }
}

// Stats Counter Animation
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Trigger stats animation when in view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
            const value = parseInt(entry.target.textContent.replace(/,/g, ''));
            animateValue(entry.target, 0, value, 2000);
            entry.target.dataset.animated = 'true';
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-value').forEach(stat => {
    statsObserver.observe(stat);
});

// FAQ Accordion (if exists)
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const isOpen = answer.style.maxHeight;
        
        // Close all answers
        document.querySelectorAll('.faq-answer').forEach(a => {
            a.style.maxHeight = null;
            a.style.padding = '0 24px';
        });
        
        // Open clicked answer if it was closed
        if (!isOpen) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
            answer.style.padding = '24px';
        }
    });
});

// Form Validation (if exists)
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'red';
                setTimeout(() => {
                    field.style.borderColor = '';
                }, 2000);
            }
        });
        
        if (!isValid) {
            e.preventDefault();
            showNotification('Please fill in all required fields');
        }
    });
});

// Lazy Loading Images
const images = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
        }
    });
});

images.forEach(img => imageObserver.observe(img));

// Dark Mode Toggle (optional feature)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Check for saved dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

// Add dark mode styles if needed
const darkModeStyles = `
    .dark-mode {
        background: var(--gray-900);
        color: white;
    }
    .dark-mode .navbar {
        background: rgba(15, 23, 42, 0.8);
        border-bottom-color: var(--gray-700);
    }
    .dark-mode .feature-card {
        background: var(--gray-800);
    }
    .dark-mode .pricing-card {
        background: var(--gray-800);
        border-color: var(--gray-700);
    }
`;

console.log('Refferq Frontend Loaded ✨');
