/* Presstropic website: shared behaviour for every page.
   Navigation menus, reveal-on-scroll, smooth in-page links, the ERP module
   slider, screen previews, the FAQ accordion and the inquiry form. */

(function () {
  'use strict';

  /* ── Scroll position ───────────────────────────────────────────────────
     A refresh always lands at the top. A visit that arrives with a #section
     (for example /#inquiry from a product page) scrolls to that section once
     the page is ready, then removes the hash so the address bar stays clean. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var arrivalHash = location.hash ? location.hash.slice(1) : '';
  function settleScroll() {
    var target = arrivalHash ? document.getElementById(arrivalHash) : null;
    if (target) {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      history.replaceState(null, '', location.pathname + location.search);
    } else {
      window.scrollTo(0, 0);
    }
  }
  if (window.__ptReady) settleScroll();
  else window.addEventListener('pt-ready', settleScroll, { once: true });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── Header menus (Products, Sign in) ──────────────────────────────────
     Open on hover for a mouse, on click/tap for everyone, close on Escape or
     an outside click. */
  var menus = [].slice.call(document.querySelectorAll('.nav-dd'));
  function closeAll(except) {
    menus.forEach(function (m) {
      if (m !== except) {
        m.classList.remove('open');
        var b = m.querySelector(':scope > button');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  }
  menus.forEach(function (m) {
    var btn = m.querySelector(':scope > button');
    var hoverTimer = null;
    function open() { closeAll(m); m.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { m.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (m.classList.contains('open')) close(); else open();
    });
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) {
      m.addEventListener('mouseenter', function () { clearTimeout(hoverTimer); open(); });
      m.addEventListener('mouseleave', function () { hoverTimer = setTimeout(close, 160); });
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-dd')) closeAll();
  });

  /* Mobile menu sheet */
  var menuBtn = document.getElementById('menuBtn');
  var sheet = document.getElementById('mSheet');
  function setSheet(open) {
    if (!sheet || !menuBtn) return;
    sheet.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.innerHTML = open
      ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
      : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setSheet(!sheet.classList.contains('open'));
    });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setSheet(false); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeAll(); setSheet(false); }
  });

  /* ── Smooth in-page links ──────────────────────────────────────────────
     Links to a section of the page already open scroll smoothly and never
     push a #hash into the address bar. Links to another page navigate. */
  document.querySelectorAll('a[href*="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var url;
      try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.origin !== location.origin || url.pathname !== location.pathname) return;
      var id = url.hash.slice(1);
      e.preventDefault();
      var target = id ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ── Reveal on scroll ──────────────────────────────────────────────────*/
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    var startReveal = function () {
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    };
    if (window.__ptReady || !document.documentElement.classList.contains('pt-loading')) startReveal();
    else window.addEventListener('pt-ready', startReveal, { once: true });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ── Screen previews ───────────────────────────────────────────────────
     Each preview is the real screen rendered at a fixed desktop width and
     scaled down to the space it has, so it stays crisp and nothing is cut off.
     Paired screens share one frame height; the module screens all share the
     tallest height so the page never jumps as the slider moves. */
  (function () {
    if (!document.querySelector('.mock-frame')) return;
    function fitFrame(frame) {
      var wrap = frame.parentElement;
      if (!wrap) return 0;
      var W = parseInt(frame.dataset.w || 1000, 10);
      var H = parseInt(frame.dataset.h || 600, 10);
      frame.style.width = W + 'px';
      frame.style.height = H + 'px';
      var s = Math.min(1, wrap.clientWidth / W);
      frame.style.transform = 'scale(' + s + ')';
      return H * s;
    }
    function scaleMock() {
      var modFrames = [].slice.call(document.querySelectorAll('#modShots .mock-frame'));
      var modShared = Math.max.apply(null, modFrames.map(fitFrame).concat(0));
      document.querySelectorAll('.shots.two').forEach(function (group) {
        var frames = [].slice.call(group.querySelectorAll('.mock-frame'));
        var heights = frames.map(fitFrame);
        var shared = group.classList.contains('mod-pair') ? modShared : Math.max.apply(null, heights.concat(0));
        frames.forEach(function (frame, i) {
          frame.parentElement.style.height = shared + 'px';
          frame.style.top = ((shared - heights[i]) / 2) + 'px';
        });
      });
      document.querySelectorAll('.mock-frame').forEach(function (frame) {
        if (frame.closest('.shots.two')) return;
        var h = fitFrame(frame);
        frame.style.top = '0';
        frame.parentElement.style.height = h + 'px';
      });
    }
    window.addEventListener('load', scaleMock);
    window.addEventListener('resize', scaleMock);
    scaleMock();
  })();

  /* ── Module slider (ERP page) ──────────────────────────────────────────
     Advances every 5s. Once someone steers with a chevron or a dot, the dwell
     relaxes to 15s. Pauses on hover and while the tab is hidden; does not
     animate for anyone who asked for reduced motion. */
  (function () {
    var root = document.getElementById('modSlider');
    if (!root) return;
    var slides = [].slice.call(root.querySelectorAll('.slide'));
    var dots = [].slice.call(document.querySelectorAll('#modDots .dot'));
    var pairs = [].slice.call(document.querySelectorAll('#modShots .mod-pair'));
    if (slides.length < 2) return;
    var AUTO = 5000, SLOWED = 15000;
    var i = 0, delay = AUTO, timer = null, paused = false;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var bar = document.getElementById('modBar');
    function runBar() {
      if (!bar) return;
      bar.style.transition = 'none';
      bar.style.width = '0';
      if (still || paused) return;
      void bar.offsetWidth;
      bar.style.transition = 'width ' + delay + 'ms linear';
      bar.style.width = '100%';
    }
    function holdBar() {
      if (!bar) return;
      var w = getComputedStyle(bar).width;
      bar.style.transition = 'none';
      bar.style.width = w;
    }
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      pairs.forEach(function (p, k) {
        p.classList.toggle('on', k === i);
        if (k === i) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true');
      });
    }
    function schedule() {
      clearTimeout(timer);
      if (still || paused) return;
      runBar();
      timer = setTimeout(function () { show(i + 1); schedule(); }, delay);
    }
    function steer(n) { delay = SLOWED; show(n); schedule(); }
    root.querySelector('.s-nav.prev').addEventListener('click', function () { steer(i - 1); });
    root.querySelector('.s-nav.next').addEventListener('click', function () { steer(i + 1); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { steer(parseInt(d.dataset.go, 10)); });
    });
    root.addEventListener('mouseenter', function () { paused = true; clearTimeout(timer); holdBar(); });
    root.addEventListener('mouseleave', function () { paused = false; schedule(); });
    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
      if (paused) { clearTimeout(timer); holdBar(); } else schedule();
    });
    show(0);
    schedule();
  })();

  /* ── FAQ accordion ─────────────────────────────────────────────────────
     Animates <details> open and close; only one answer is open at a time. */
  (function () {
    var items = [].slice.call(document.querySelectorAll('.faq-item'));
    var PAD = '20px';
    function part(det) { return det.querySelector('p'); }
    function closeItem(det) {
      var content = part(det);
      if (!det.open) return;
      if (det.dataset.animating) { det.dataset.closeAfter = '1'; return; }
      det.dataset.animating = '1';
      content.style.height = content.offsetHeight + 'px';
      content.style.paddingBottom = PAD; content.style.opacity = '1';
      requestAnimationFrame(function () {
        content.style.height = '0px'; content.style.paddingBottom = '0px'; content.style.opacity = '0';
      });
      content.addEventListener('transitionend', function te(ev) {
        if (ev.propertyName !== 'height') return;
        det.open = false; content.style.opacity = ''; delete det.dataset.animating;
        content.removeEventListener('transitionend', te);
      });
    }
    function openItem(det) {
      var content = part(det);
      items.forEach(function (other) { if (other !== det) closeItem(other); });
      delete det.dataset.closeAfter;
      det.dataset.animating = '1';
      det.open = true;
      var target = content.scrollHeight;
      content.style.height = '0px'; content.style.paddingBottom = '0px'; content.style.opacity = '0';
      requestAnimationFrame(function () {
        content.style.height = target + 'px'; content.style.paddingBottom = PAD; content.style.opacity = '1';
      });
      content.addEventListener('transitionend', function te(ev) {
        if (ev.propertyName !== 'height') return;
        content.style.height = ''; content.style.paddingBottom = ''; content.style.opacity = '';
        delete det.dataset.animating; content.removeEventListener('transitionend', te);
        if (det.dataset.closeAfter) { delete det.dataset.closeAfter; closeItem(det); }
      });
    }
    items.forEach(function (det) {
      var sum = det.querySelector('summary');
      if (!sum || !part(det)) return;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (det.dataset.animating) return;
        if (det.open) closeItem(det); else openItem(det);
      });
    });
  })();

  /* ── Phone field: country flag, dial code and live formatting ──────────*/
  (function () {
    var input = document.getElementById('phone');
    if (!input || !window.intlTelInput) return;
    window.__iti = window.intlTelInput(input, {
      initialCountry: 'in',
      separateDialCode: true,
      formatOnDisplay: true,
      nationalMode: false,
      countryOrder: ['in', 'ae', 'us', 'gb', 'np', 'bd', 'pk', 'lk', 'sg'],
      loadUtils: function () { return Promise.resolve(); }
    });
  })();

  /* ── Inquiry form ──────────────────────────────────────────────────────
     Submits in the background and shows a blocking overlay on success, so no
     query parameter ever lands in the address bar. */
  (function () {
    var form = document.getElementById('inquiryForm');
    var overlay = document.getElementById('successOverlay');
    if (!form || !overlay) return;
    function closeOverlay() { overlay.classList.remove('show'); }
    document.getElementById('ovClose').addEventListener('click', closeOverlay);
    document.getElementById('ovCloseBtn').addEventListener('click', closeOverlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOverlay(); });

    var errOverlay = document.getElementById('errorOverlay');
    function showError(msg) {
      if (msg) document.getElementById('ovErrMsg').textContent = msg;
      errOverlay.classList.add('show');
    }
    function closeError() { errOverlay.classList.remove('show'); }
    if (errOverlay) {
      document.getElementById('ovErrClose').addEventListener('click', closeError);
      document.getElementById('ovErrCloseBtn').addEventListener('click', closeError);
      errOverlay.addEventListener('click', function (e) { if (e.target === errOverlay) closeError(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeError(); });
    }

    /* Anti-spam: the server ignores anything submitted within 4 seconds of
       page load. Cloudflare Turnstile stays OFF while the site key is empty;
       to turn it on, paste the SITE key here and put the SECRET key in the
       server's .env as TURNSTILE_SECRET. */
    var started = document.getElementById('formStarted');
    function stampStart() { if (started) started.value = String(Date.now()); }
    stampStart();
    var TURNSTILE_SITEKEY = '';
    var tsId = null;
    if (TURNSTILE_SITEKEY) {
      window.__ptTsLoad = function () {
        tsId = window.turnstile.render('#tsWidget', { sitekey: TURNSTILE_SITEKEY, theme: 'light' });
      };
      var tsScript = document.createElement('script');
      tsScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__ptTsLoad';
      tsScript.async = true; tsScript.defer = true;
      document.head.appendChild(tsScript);
    }
    function resetTurnstile() { if (tsId !== null && window.turnstile) window.turnstile.reset(tsId); }

    var consentBoxes = [document.getElementById('accept_terms'), document.getElementById('accept_privacy')];
    consentBoxes.forEach(function (cb) {
      if (!cb) return;
      cb.addEventListener('change', function () { cb.closest('.consent-row').classList.toggle('err', !cb.checked); });
      cb.addEventListener('invalid', function () { cb.closest('.consent-row').classList.add('err'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var missing = consentBoxes.filter(function (cb) { return cb && !cb.checked; });
      if (missing.length) {
        missing.forEach(function (cb) { cb.closest('.consent-row').classList.add('err'); });
        missing[0].focus();
        return;
      }
      var phone = document.getElementById('phone');
      if (window.__iti && phone) {
        var full = window.__iti.getNumber();
        if (full) phone.value = full;
      }
      var btn = form.querySelector('button[type="submit"]');
      var original = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(form.getAttribute('action') || '/submit', {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'fetch' }
      }).then(function (res) {
        return res.json().catch(function () { return { ok: res.ok }; })
          .then(function (data) { return { ok: res.ok && data && data.ok, error: data && data.error }; });
      }).then(function (result) {
        if (result.ok) {
          form.reset();
          stampStart();
          overlay.classList.add('show');
        } else {
          showError(result.error);
        }
      }).catch(function () {
        showError("Sorry — we couldn't reach the server. Please check your connection and try again, or email info@presstropic.com.");
      }).finally(function () {
        resetTurnstile();
        if (btn) { btn.disabled = false; btn.textContent = original; }
      });
    });
  })();
})();
