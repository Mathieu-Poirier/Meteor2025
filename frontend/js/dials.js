document.addEventListener("DOMContentLoaded", () => {

  const star = document.querySelector(".star");
  const container = document.querySelector(".title-container");
  const leftDial = document.querySelector(".dial-left");
  const rightDial = document.querySelector(".dial-right");
  const gravityLabel = document.getElementById("gravity-value");
  const bounceLabel = document.getElementById("bounce-value");

  if (!star || !container) {
    console.warn("❌ Missing star or container element");
    return;
  }

  // === Physics state ===
  let starX, starY;
  let vx = 0, vy = 0;
  let rotation = 0, angularVel = 0;

  // === Adjustable parameters ===
  let gravity = 0.004;
  let bounceDamp = 0.65;

  // === Constants ===
  const drag = 0.985;
  const angularDrag = 0.97;
  const throwScale = 0.25;
  const edgeMargin = 0;

  // === Mouse drag state ===
  let isDragging = false;
  let lastMouseX = 0, lastMouseY = 0;
  let prevTime = 0;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  // --- Update Star Position ---
function updateStar(initial = false) {
  const rect = container.getBoundingClientRect();
  const sw = star.offsetWidth || 60;
  const sh = star.offsetHeight || 60;
  const halfW = sw / 2, halfH = sh / 2;

  // initialize slightly below center
  if (starX === undefined) starX = rect.width / 2;
  if (starY === undefined) starY = rect.height * 0.7;

  star.style.transform =
    `translate(${starX - halfW}px, ${starY - halfH}px) rotate(${rotation}deg)`;

  // enable transitions only after first draw
}


  // --- Physics Loop ---
  function physicsStep() {
    const rect = container.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const sw = star.offsetWidth || 60;
    const sh = star.offsetHeight || 60;
    const halfW = sw / 2, halfH = sh / 2;

    const minX = edgeMargin + halfW;
    const maxX = w - edgeMargin - halfW;
    const minY = edgeMargin + halfH;
    const maxY = h - edgeMargin - halfH * 0.3;

    if (!isDragging) {
      // Apply gravity
      vy += gravity;
      vx *= drag;
      vy *= drag;
      angularVel *= angularDrag;

      // Integrate motion
      starX += vx * 100;
      starY += vy * 100;
      rotation += angularVel;

      // Collisions
      if (starX < minX) {
        starX = minX;
        vx = Math.abs(vx) * bounceDamp;
        angularVel *= -0.5;
      } else if (starX > maxX) {
        starX = maxX;
        vx = -Math.abs(vx) * bounceDamp;
        angularVel *= -0.5;
      }

      if (starY < minY) {
        starY = minY;
        vy = Math.abs(vy) * bounceDamp;
        angularVel *= -0.5;
      } else if (starY > maxY) {
        starY = maxY;
        vy = -Math.abs(vy) * bounceDamp;
        angularVel *= -0.5;
      }
    }

    updateStar();
    requestAnimationFrame(physicsStep);
  }

  // --- Drag interaction (throw mechanic) ---
  container.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    prevTime = performance.now();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const rect = container.getBoundingClientRect();
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    const dt = performance.now() - prevTime;
    prevTime = performance.now();

    starX = clamp(e.clientX - rect.left, 0, rect.width);
    starY = clamp(e.clientY - rect.top, 0, rect.height);

    angularVel += dx * 0.02;
    vx = (dx / dt) * throwScale;
    vy = (dy / dt) * throwScale;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    updateStar();
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      window.getSelection()?.removeAllRanges();
    }
  });

  // --- Linear Infinite Dials ---
  function attachDial(dial, onDelta, updateLabel) {
    if (!dial) return;
    const indicator = dial.querySelector(".dial-indicator");
    let isDragging = false;
    let lastVec = null;
    let visualAngle = 0; // purely visual

    function getVec(e) {
      const rect = dial.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      return { x: dx / dist, y: dy / dist };
    }

    dial.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isDragging = true;
      lastVec = getVec(e);
      dial.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const v = getVec(e);

      // incremental rotation
      const dot = lastVec.x * v.x + lastVec.y * v.y;
      const det = lastVec.x * v.y - lastVec.y * v.x;
      const deltaDeg = Math.atan2(det, dot) * 180 / Math.PI;

      visualAngle = (visualAngle + deltaDeg) % 360;
      indicator.style.transform = `translateX(-50%) rotate(${visualAngle}deg)`;

      const value = onDelta(deltaDeg); // pass incremental delta
      updateLabel(value);

      lastVec = v;
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        dial.style.cursor = "grab";
        lastVec = null;
      }
    });
  }

  // Left dial → gravity (unbounded, can go negative)
  attachDial(
    leftDial,
    (delta) => {
      gravity += delta * 0.00002;
      gravity = Math.max(-0.02, Math.min(0.05, gravity));
      return gravity.toFixed(4);
    },
    (val) => (gravityLabel.textContent = val)
  );

  // Right dial → bounce damping (bounded 0–1)
  attachDial(
    rightDial,
    (delta) => {
      bounceDamp += delta * 0.00005;
      bounceDamp = clamp(bounceDamp, 0, 1);
      return bounceDamp.toFixed(2);
    },
    (val) => (bounceLabel.textContent = val)
  );

  // --- Start simulation ---
  updateStar();
  requestAnimationFrame(physicsStep);
});
