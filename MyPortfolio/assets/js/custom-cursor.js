// Custom Trailing Cursor Implementation
document.addEventListener('DOMContentLoaded', () => {
  // Only activate custom cursor on desktop screens (min-width: 992px)
  if (window.innerWidth < 992) return;

  // Create cursor elements dynamically to keep HTML files clean
  const dot = document.createElement('div');
  const outline = document.createElement('div');

  dot.className = 'custom-cursor-dot';
  outline.className = 'custom-cursor-outline';

  document.body.appendChild(dot);
  document.body.appendChild(outline);

  let mouseX = 0, mouseY = 0;
  let dotX = 0, dotY = 0;
  let outlineX = 0, outlineY = 0;

  // Easing delay factor (higher value = slower, smoother trailing)
  const delay = 6;

  let isFirstMove = true;

  document.addEventListener('mousemove', (e) => {
    // Reveal cursor elements on first mouse movement
    if (isFirstMove) {
      dot.style.opacity = '1';
      outline.style.opacity = '1';
      isFirstMove = false;
      dotX = mouseX = e.clientX;
      dotY = mouseY = e.clientY;
      outlineX = mouseX;
      outlineY = mouseY;
    } else {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
  });

  // Smooth frame loop using requestAnimationFrame
  function updateCursor() {
    if (!isFirstMove) {
      // Inner dot follows fast
      dotX += (mouseX - dotX) * 0.25;
      dotY += (mouseY - dotY) * 0.25;
      dot.style.left = `${dotX}px`;
      dot.style.top = `${dotY}px`;

      // Outer outline follows with dynamic easing delay
      outlineX += (mouseX - outlineX) * (1 / delay);
      outlineY += (mouseY - outlineY) * (1 / delay);
      outline.style.left = `${outlineX}px`;
      outline.style.top = `${outlineY}px`;
    }
    requestAnimationFrame(updateCursor);
  }
  requestAnimationFrame(updateCursor);

  // Bind mouse interactions for all hoverable components
  const updateHoverState = () => {
    const hoverables = document.querySelectorAll(
      'a, button, input, textarea, select, .portfolio-item, .header-toggle, [role="button"], .isotope-filters li'
    );

    hoverables.forEach(el => {
      // Avoid duplicate event listener bindings
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 'true';

      el.addEventListener('mouseenter', () => {
        outline.style.transform = 'translate(-50%, -50%) scale(1.6)';
        outline.style.backgroundColor = 'rgba(20, 157, 221, 0.12)';
        outline.style.borderColor = 'var(--accent-color, #149ddd)';
        dot.style.transform = 'translate(-50%, -50%) scale(0.4)';
        dot.style.opacity = '0.5';
      });

      el.addEventListener('mouseleave', () => {
        outline.style.transform = 'translate(-50%, -50%) scale(1)';
        outline.style.backgroundColor = 'transparent';
        outline.style.borderColor = 'var(--accent-color, #149ddd)';
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
        dot.style.opacity = '1';
      });
    });
  };

  updateHoverState();

  // Watch for dynamic DOM changes (e.g. portfolio Isotope rendering more items)
  const observer = new MutationObserver(updateHoverState);
  observer.observe(document.body, { childList: true, subtree: true });

  // Hide custom cursor elements when the mouse leaves the document window
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    outline.style.opacity = '0';
    isFirstMove = true;
  });

  document.addEventListener('mouseenter', () => {
    isFirstMove = true;
  });
});
