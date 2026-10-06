/**
 * Orbit Website Interactivity & E2EE Simulator
 * orbitweb.tech
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNav();
  initE2EESimulator();
  initFAQAccordion();
  initCodeCopy();
  initActiveChannelSwitcher();
});

/* -------------------------------------------------------------------------
   1. Sticky Header Scroll Effect
   ------------------------------------------------------------------------- */
function initStickyHeader() {
  const header = document.querySelector('.header-nav');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* -------------------------------------------------------------------------
   2. Mobile Navigation Toggle
   ------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    drawer.classList.toggle('open');
    const isOpen = drawer.classList.contains('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  // Close when clicking a link
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    });
  });
}

/* -------------------------------------------------------------------------
   3. Interactive Megolm E2EE Cryptographic Ratchet Simulator
   ------------------------------------------------------------------------- */
function initE2EESimulator() {
  const input = document.getElementById('sim-input-msg');
  const btnRun = document.getElementById('btn-run-sim');
  const outCipher = document.getElementById('sim-cipher-out');
  const outDecrypted = document.getElementById('sim-decrypted-out');
  const ratchetCounter = document.getElementById('sim-ratchet-count');
  
  if (!input || !outCipher || !outDecrypted) return;

  let messageIndex = 42;

  // Simple deterministic hash & cipher representation for visualization
  function generateCiphertext(plain, index) {
    if (!plain || plain.trim() === '') {
      return '(empty buffer)';
    }

    // Convert string to pseudo-hex payload
    let hash = 0;
    for (let i = 0; i < plain.length; i++) {
      hash = ((hash << 5) - hash) + plain.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    const randomSalt = Math.random().toString(36).substring(2, 8);
    return `m.megolm.v1:${hex}:${randomSalt}:seq${index}`;
  }

  function simulateEncryption() {
    messageIndex++;
    const plainText = input.value.trim() || 'Sovereign Matrix payload';
    
    // Animate ratchet count
    if (ratchetCounter) {
      ratchetCounter.textContent = `Ratchet Step #${messageIndex}`;
    }

    // Temporary scramble animation for visual feedback
    outCipher.style.opacity = '0.4';
    outCipher.textContent = 'Deriving DH ephemeral key...';

    setTimeout(() => {
      const cipher = generateCiphertext(plainText, messageIndex);
      outCipher.textContent = cipher;
      outCipher.style.opacity = '1';

      // Decrypted recipient output
      outDecrypted.textContent = plainText;
    }, 280);
  }

  if (btnRun) {
    btnRun.addEventListener('click', simulateEncryption);
  }

  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      simulateEncryption();
    }
  });
}

/* -------------------------------------------------------------------------
   4. Interactive FAQ Accordion
   ------------------------------------------------------------------------- */
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      // Close other items
      faqItems.forEach(other => other.classList.remove('active'));
      
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* -------------------------------------------------------------------------
   5. Docker Code Snippet Copy Button
   ------------------------------------------------------------------------- */
function initCodeCopy() {
  const copyBtn = document.getElementById('btn-copy-docker');
  const codeEl = document.getElementById('docker-compose-code');
  if (!copyBtn || !codeEl) return;

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codeEl.innerText);
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #312E81">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span style="color: #312E81">Copied!</span>
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2200);
    } catch (err) {
      console.warn('Failed to copy code: ', err);
    }
  });
}

/* -------------------------------------------------------------------------
   6. UI Mockup Channel Switcher
   ------------------------------------------------------------------------- */
function initActiveChannelSwitcher() {
  const channelItems = document.querySelectorAll('.channel-item');
  const channelNameHeader = document.querySelector('.chat-channel-meta span');

  channelItems.forEach(item => {
    item.addEventListener('click', () => {
      channelItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      if (channelNameHeader) {
        const text = item.textContent.trim().replace('#', '');
        channelNameHeader.textContent = text;
      }
    });
  });
}

/* -------------------------------------------------------------------------
   7. Polish: scroll progress, reveal-on-scroll, card spotlight, hero tilt
   ------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('scroll-progress');
  if (bar) {
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  const targets = document.querySelectorAll(
    '.section-header, .feature-card, .showcase-split > *, .crypto-simulator-card, .comparison-container, .code-preview-window, .faq-item, .cta-banner-card'
  );
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.dataset.d = String((i % 3) + 1);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  const wrap = document.querySelector('.hero-mockup-wrapper');
  const win = document.querySelector('.app-window');
  if (wrap && win && window.matchMedia('(min-width: 1025px)').matches) {
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      win.style.transform = `rotateY(${-6 + x * 8}deg) rotateX(${3 - y * 8}deg)`;
    });
    wrap.addEventListener('pointerleave', () => { win.style.transform = ''; });
  }
});
