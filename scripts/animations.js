/**
 * Orbit animations: count-up, scramble, parallax, magnetic buttons,
 * cursor glow, auto-running simulator, typing indicator.
 */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ready = (fn) => document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn);

  ready(() => {
    initTypingIndicator();
    initCountUp();
    initInViewClasses();
    if (reduce) return;
    initCursorGlow();
    initParallax();
    initMagnetic();
    initAutoSimulator();
  });

  /* Typing indicator appended to the mockup chat */
  function initTypingIndicator() {
    const tl = document.querySelector('.chat-timeline');
    if (!tl) return;
    const row = document.createElement('div');
    row.className = 'typing-row';
    row.innerHTML = '<div class="msg-avatar avatar-blurple" style="width:28px;height:28px;border-radius:8px;font-size:11px">C</div>' +
      '<div class="typing-bubble"><i></i><i></i><i></i></div><span class="typing-name">Carol is typing…</span>';
    tl.appendChild(row);
  }

  /* Stats: numbers count up, text scrambles in */
  function initCountUp() {
    const nums = document.querySelectorAll('.stat-num');
    const glyphs = 'ABCDEF0123456789#@%';
    const run = (el) => {
      const final = el.textContent.trim();
      const m = final.match(/^(\d+)(.*)$/);
      const dur = 1400, t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        if (m) {
          el.textContent = Math.round(parseInt(m[1], 10) * e) + m[2];
        } else {
          el.textContent = final.split('').map((c, i) => (p > (i + 1) / final.length ? c : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
        }
        if (p < 1) requestAnimationFrame(step); else el.textContent = final;
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (e.isIntersecting) { if (!reduce) run(e.target); io.unobserve(e.target); }
    }), { threshold: 0.6 });
    nums.forEach(n => io.observe(n));
  }

  /* Add .in to lists / tables when visible (drives CSS stagger) */
  function initInViewClasses() {
    const io = new IntersectionObserver((es) => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.25 });
    document.querySelectorAll('.bullet-list, .comparison-container').forEach(el => io.observe(el));
  }

  function initCursorGlow() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const g = document.createElement('div');
    g.className = 'cursor-glow';
    document.body.appendChild(g);
    let x = 0, y = 0, tx = 0, ty = 0, on = false;
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!on) { on = true; g.style.opacity = 1; x = tx; y = ty; } }, { passive: true });
    document.addEventListener('pointerleave', () => { g.style.opacity = 0; on = false; });
    const loop = () => { x += (tx - x) * 0.12; y += (ty - y) * 0.12; g.style.transform = `translate(${x}px, ${y}px)`; requestAnimationFrame(loop); };
    loop();
  }

  /* Parallax: orbit rings + aurora respond to scroll and mouse */
  function initParallax() {
    const rings = document.querySelector('.hero-orbits');
    const aurora = document.querySelector('.bg-mesh-glow');
    let mx = 0, my = 0;
    window.addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    const tick = () => {
      const sy = window.scrollY;
      if (rings) rings.style.translate = `${mx * -30}px ${sy * 0.12 + my * -30}px`;
      if (aurora) aurora.style.transform = `translateY(${sy * 0.25}px)`;
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* Buttons lean toward the cursor */
  function initMagnetic() {
    document.querySelectorAll('.btn-lg, .nav-actions .btn').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        btn.style.transform = `translate(${dx}px, ${dy - 2}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* Simulator loops through messages while it is on screen */
  function initAutoSimulator() {
    const card = document.getElementById('e2ee-simulator');
    const btn = document.getElementById('btn-run-sim');
    const input = document.getElementById('sim-input-msg');
    const cipher = document.getElementById('sim-cipher-out');
    if (!card || !btn || !input) return;
    const samples = ['Sovereign communications online.', 'Meet at the usual place.', 'Keys rotated. All clear.', 'Hello from orbitweb.tech'];
    let i = 0, visible = false, timer = null;
    const tick = () => {
      if (!visible || document.activeElement === input) return;
      i = (i + 1) % samples.length;
      input.value = samples[i];
      btn.click();
      if (cipher) { cipher.classList.remove('scrambling'); void cipher.offsetWidth; cipher.classList.add('scrambling'); }
    };
    new IntersectionObserver((es) => es.forEach(e => {
      visible = e.isIntersecting;
      clearInterval(timer);
      if (visible) timer = setInterval(tick, 3600);
    }), { threshold: 0.4 }).observe(card);
  }
})();
