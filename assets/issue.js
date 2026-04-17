// GTME Field Guide — per-issue nav
// Horizontal transform pagination on desktop / tablet landscape.
// Native vertical scroll on phones and tablets portrait (< 900px).

(() => {
  const VERTICAL_BREAKPOINT = 900;
  const isVertical = () => window.innerWidth <= VERTICAL_BREAKPOINT;

  const pages = document.querySelector('.pages');
  const dotsContainer = document.querySelector('.dots');
  const pageEls = document.querySelectorAll('.page');
  const pageCount = pageEls.length;
  let current = 0;

  // Build dots once (CSS hides them in vertical mode)
  for (let i = 0; i < pageCount; i++) {
    const d = document.createElement('span');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.dataset.idx = String(i);
    d.addEventListener('click', () => {
      if (isVertical()) return;
      goTo(i);
    });
    dotsContainer.appendChild(d);
  }
  const dots = dotsContainer.querySelectorAll('.dot');

  function goTo(i) {
    if (isVertical()) return;
    current = Math.max(0, Math.min(pageCount - 1, i));
    pages.style.transform = `translate3d(-${current * 100}vw, 0, 0)`;
    dots.forEach((d, k) => d.classList.toggle('active', k === current));
  }

  // Arrow keys + spacebar
  window.addEventListener('keydown', (e) => {
    if (isVertical()) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      goTo(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === 'Home') {
      goTo(0);
    } else if (e.key === 'End') {
      goTo(pageCount - 1);
    }
  });

  // Mouse wheel (throttled so one flick = one page)
  let wheelLock = false;
  window.addEventListener('wheel', (e) => {
    if (isVertical() || wheelLock) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 20) return;
    wheelLock = true;
    goTo(current + (delta > 0 ? 1 : -1));
    setTimeout(() => { wheelLock = false; }, 500);
  }, { passive: true });

  // Touch swipe
  let touchStartX = 0;
  window.addEventListener('touchstart', (e) => {
    if (isVertical()) return;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (isVertical()) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) < 50) return;
    goTo(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Handle viewport resize crossing the breakpoint (e.g., rotate device)
  let wasVertical = isVertical();
  window.addEventListener('resize', () => {
    const nowVertical = isVertical();
    if (nowVertical === wasVertical) return;
    wasVertical = nowVertical;
    if (nowVertical) {
      // Leaving horizontal mode: reset transform so CSS takes over
      pages.style.transform = '';
    } else {
      // Re-entering horizontal mode: snap back to current page
      pages.style.transform = `translate3d(-${current * 100}vw, 0, 0)`;
    }
  });
})();
