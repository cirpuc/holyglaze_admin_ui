/* UI preview navigation only. Does not save, price, edit designs or create orders. */
(() => {
  const views = window.MOBILE_UI_VIEWS;
  let current = location.hash.slice(1) || (location.pathname.match(/\/states\/([^/]+)\.html$/)?.[1] ?? 'shape');
  let previous = 'shape';
  const assetPrefix = location.pathname.includes('/states/') ? '../' : '';
  const vh = () => document.documentElement.style.setProperty('--mcm-vh', `${innerHeight * 0.01}px`);
  const centerShapes = () => {
    const row = document.querySelector('.mcm-cards-row--shape');
    const active = row?.querySelector('[aria-pressed="true"]');
    if (row && active) row.scrollLeft = active.offsetLeft + active.offsetWidth / 2 - row.clientWidth / 2;
  };
  const show = name => {
    if (!views[name]) return;
    previous = current;
    current = name;
    document.body.innerHTML = views[name].replaceAll('="assets/', `="${assetPrefix}assets/`);
    vh();
    requestAnimationFrame(centerShapes);
  };
  const routes = {
    'Text': 'text', 'Image': 'image', 'Draw': 'draw', 'Icon': 'icons',
    'Cart': 'cart', 'Close cart': 'shape', 'Start creating →': 'shape',
    'Layers': 'layers',
    'Back · TEXT': 'decor', 'Back · IMAGE': 'decor', 'Back · DRAWING': 'decor', 'Back · ICON': 'decor',
    'Back · CHOOSE FONT': 'text', 'Back · TEXT STYLE': 'text',
    'Back · TEXT SIZE': 'text', 'Back · TEXT COLOUR': 'text', 'Back · TEXT BEND': 'text',
    'Back · BRUSH THICKNESS': 'draw', 'Back · DRAWING STYLE': 'draw',
    'Back · All': 'icons', 'Back · Love': 'icons',
    'All': 'icons-all', 'Love': 'icons-love',
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('button, [role="option"]');
    if (!button || button.disabled) return;
    const labelCopy = button.cloneNode(true);
    labelCopy.querySelectorAll('[aria-hidden="true"]').forEach(node => node.remove());
    const label = button.getAttribute('aria-label') || labelCopy.textContent.trim().replace(/\s+/g, ' ');
    if (button.getAttribute('role') === 'tab') {
      show(label.toLowerCase() === 'shape' ? 'shape' : 'decor');
      return;
    }
    if (label === 'Layers' && current === 'layers') { show(previous); return; }
    if (button.closest('[role="listbox"][aria-label="Cookie flavour"], [role="listbox"][aria-label="Cookie size"]')) { show('shape'); return; }
    if (button.matches('.mcm-meta-picker')) {
      show(/[0-9]/.test(label) ? 'size' : 'flavour');
      return;
    }
    if (current === 'text') {
      const key = {'Serif':'text-font', 'Italic':'text-style', '18':'text-size', 'Black':'text-color', 'Flat':'text-finish'}[label];
      if (key) { show(key); return; }
    }
    if (current === 'draw') {
      const key = {'Medium':'draw-size', 'Solid':'draw-style'}[label];
      if (key) { show(key); return; }
    }
    if (label === 'Previous shapes' || label === 'Next shapes') {
      const row = document.querySelector('.mcm-cards-row--shape');
      row?.scrollBy({left:(label === 'Previous shapes' ? -1 : 1) * row.clientWidth * 0.75, behavior:'smooth'});
      return;
    }
    if (routes[label]) show(routes[label]);
  });
  vh();
  addEventListener('resize', vh);
  visualViewport?.addEventListener('resize', vh);
  if (location.hash && views[current]) show(current);
  else requestAnimationFrame(centerShapes);
})();
