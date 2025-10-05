document.addEventListener("DOMContentLoaded", () => {
//   console.log("🎛️ Rotary Knob Debug Mode");

  const dials = document.querySelectorAll(".dial");
  if (dials.length === 0) {
    console.warn("❌ No .dial found");
    return;
  }

  dials.forEach((dial, i) => {
    const indicator = dial.querySelector(".dial-indicator");
    let isDragging = false;
    let cumulativeRotation = 0; // total degrees
    let lastVec = null;

    function getVec(e) {
      const rect = dial.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return { x: 0, y: -1 };
      return { x: dx / dist, y: dy / dist };
    }

    dial.addEventListener("mousedown", (e) => {
      e.preventDefault();
      isDragging = true;
      dial.style.cursor = "grabbing";
      lastVec = getVec(e);
//       console.group(`🟢 Dial ${i + 1} drag start`);
//       console.log("lastVec:", lastVec);
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const v = getVec(e);

      // compute signed angle delta between lastVec and v
      const dot = lastVec.x * v.x + lastVec.y * v.y;
      const det = lastVec.x * v.y - lastVec.y * v.x;
      const deltaRad = Math.atan2(det, dot);
      const deltaDeg = deltaRad * (180 / Math.PI);

      cumulativeRotation += deltaDeg;
      lastVec = v;

      const display = ((cumulativeRotation % 360) + 360) % 360;
      indicator.style.transform = `translateX(-50%) rotate(${display}deg)`;

      // --- Debug info ---
//       console.log({
//         mouse: { x: e.clientX, y: e.clientY },
//         vector: v,
//         dot: dot.toFixed(3),
//         det: det.toFixed(3),
//         deltaDeg: deltaDeg.toFixed(2),
//         cumulativeRotation: cumulativeRotation.toFixed(2),
//         display: display.toFixed(2)
//       });
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        dial.style.cursor = "grab";
        lastVec = null;
        // console.groupEnd();
        // console.log(`🔴 Dial ${i + 1} drag end\n`);
      }
    });

    dial.addEventListener("click", (e) => {
      if (isDragging) return; // skip accidental click after drag
      cumulativeRotation += 15;
      const display = ((cumulativeRotation % 360) + 360) % 360;
      indicator.style.transform = `translateX(-50%) rotate(${display}deg)`;
//       console.log(`⚙️ Dial ${i + 1} clicked → +15°, now ${display.toFixed(1)}°`);
    });
  });
});
