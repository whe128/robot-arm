const moveToOrigin = (joints, onUpdate, onStop, duration = 3500) => {
  if (joints.every((angle) => angle === 0)) {
    onStop();
    return;
  }

  const startTime = performance.now();
  const startAngles = [...joints];

  const tick = (now) => {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 2);

    const newJoints = startAngles.map((a) => a * (1 - ease));

    onUpdate(newJoints);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onStop();
    }
  };

  requestAnimationFrame(tick);
};

const moveWave = (joints, onUpdate, duration = 2000) => {
  const startTime = performance.now();
  const startAngles = [...joints];

  let stopped = false;

  const tick = (now) => {
    if (stopped) return;

    const t = (now - startTime) / duration;

    const wave = Math.sin(t * Math.PI * 2);

    const newJoints = startAngles.map((a, i) => {
      if (i === 1) return a + wave * 0.5;
      return a;
    });

    onUpdate(newJoints);

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);

  // stop function to end the animation
  return () => {
    stopped = true;
  };
};

export { moveToOrigin, moveWave };
