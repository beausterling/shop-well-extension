/**
 * Shop Well Landing Page JavaScript
 * Handles mobile navigation, smooth scrolling, and user interactions
 */

// ===================================
// MOBILE MENU TOGGLE
// ===================================
function initMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-menu-link');

  if (!menuToggle || !mobileMenu) return;

  // Toggle menu on button click
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('active');

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when a link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !mobileMenu.contains(e.target)) {
      closeMenu();
    }
  });

  function openMenu() {
    mobileMenu.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    mobileMenu.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
}

// ===================================
// SMOOTH SCROLLING FOR ANCHOR LINKS
// ===================================
function initSmoothScrolling() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');

      // Skip if it's just "#" or if target doesn't exist
      if (targetId === '#' || targetId.length <= 1) return;

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault();

        // Calculate offset for fixed nav
        const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without jumping
        history.pushState(null, '', targetId);
      }
    });
  });
}

// ===================================
// SCROLL-BASED NAV STYLING
// ===================================
function initScrollEffects() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add shadow when scrolled
    if (currentScroll > 10) {
      nav.style.boxShadow = 'var(--shadow-md)';
    } else {
      nav.style.boxShadow = 'var(--shadow-sm)';
    }

    lastScroll = currentScroll;
  });
}

// ===================================
// CTA BUTTON TRACKING (Optional)
// ===================================
function initCTATracking() {
  const ctaButtons = document.querySelectorAll('.btn-primary, .btn-cta');

  ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const buttonText = button.textContent.trim();
      const buttonLocation = button.closest('section')?.className || 'unknown';

      // Log CTA clicks (replace with actual analytics if needed)
      console.log('CTA Click:', {
        text: buttonText,
        location: buttonLocation,
        url: button.href
      });

      // If you add Google Analytics or similar later, you can track here:
      // gtag('event', 'cta_click', { button_text: buttonText, location: buttonLocation });
    });
  });
}

// ===================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ===================================
function initScrollAnimations() {
  // Elements to animate on scroll
  const animatedElements = document.querySelectorAll(
    '.feature-card, .problem-card, .step, .faq-item, .story-section'
  );

  if (!animatedElements.length) return;

  // Add initial state
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger animation slightly
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 50);

        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => observer.observe(el));
}

// ===================================
// KEYBOARD NAVIGATION IMPROVEMENTS
// ===================================
function initKeyboardNavigation() {
  // Escape key closes mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        document.querySelector('.mobile-menu-toggle')?.setAttribute('aria-expanded', 'false');
      }
    }
  });
}

// ===================================
// INITIALIZE ALL FEATURES
// ===================================
function init() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllFeatures);
  } else {
    initAllFeatures();
  }
}

function initAllFeatures() {
  initMobileMenu();
  initSmoothScrolling();
  initScrollEffects();
  initCTATracking();
  initScrollAnimations();
  initKeyboardNavigation();

  console.log('✅ Shop Well landing page initialized');
}

// Start the app
init();

// ===================================
// UTILITY: Detect if user prefers reduced motion
// ===================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Disable animations for users who prefer reduced motion
  document.querySelectorAll('*').forEach(el => {
    el.style.transition = 'none';
    el.style.animation = 'none';
  });
  console.log('ℹ️ Reduced motion mode detected - animations disabled');
}

// ===================================
// EXPORT FOR TESTING (if needed)
// ===================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initMobileMenu,
    initSmoothScrolling,
    initScrollEffects
  };
}
