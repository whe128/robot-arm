const wave = (t, deg, freq = 1) =>
  (Math.sin(t * Math.PI * 2 * freq) * (deg * Math.PI)) / 180;

const resetJoint = (now, startTime, startAngles, duration = 300) => {
  const t = Math.min((now - startTime) / duration, 1);
  const ease = 1 - Math.pow(1 - t, 2);

  const newJoints = startAngles.map((a) => a * (1 - ease));

  return { newJoints, t };
};

const moveToOrigin = (onUpdate, onStop, duration = 3500) => {
  let stopped = true;
  let startTime = 0;
  let startAngles = [];

  const tick = (now) => {
    if (stopped) return;

    const { newJoints, t } = resetJoint(now, startTime, startAngles);

    onUpdate(newJoints);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onStop();
    }
  };

  const start = (joints) => {
    if (joints.every((angle) => angle === 0)) {
      onStop();
      return;
    }
    startAngles = [...joints];
    startTime = performance.now();
    stopped = false;
    requestAnimationFrame(tick);
  };

  const stop = () => {
    stopped = true;
  };

  return { start, stop };
};

const moveWave = (onUpdate, duration = 2000) => {
  let stopped = true;
  let startTime = 0;
  let startAngles = [];

  const tick = (now) => {
    if (stopped) return;

    // need reset to origin before wave
    if (!startAngles.every((angle) => angle === 0)) {
      const { newJoints, t } = resetJoint(now, startTime, startAngles);
      onUpdate(newJoints);
      // still in reset process
      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      } else {
        // set the start time and startAngle
        startTime = performance.now();
        startAngles = newJoints;
      }
    }

    // already reset to origin, then do the wave motion
    const t = (now - startTime) / duration;

    const newJoints = startAngles.map((a, i) => {
      switch (i) {
        case 1:
          return a + wave(t, 45);
        case 2:
          return a + wave(t, 45);
        case 4:
          return a + wave(t, 45);
        default:
          return a;
      }
    });

    onUpdate(newJoints);

    requestAnimationFrame(tick);
  };

  const start = (joints) => {
    // then add the wave motion
    startAngles = [...joints];
    startTime = performance.now();
    stopped = false;
    requestAnimationFrame(tick);
  };

  const stop = () => {
    stopped = true;
  };

  return { start, stop };
};

const moveSweep = (onUpdate, duration = 2000) => {
  let stopped = true;
  let startTime = 0;
  let startAngles = [];

  const tick = (now) => {
    if (stopped) return;

    // need reset to origin before wave
    if (!startAngles.every((angle) => angle === 0)) {
      const { newJoints, t } = resetJoint(now, startTime, startAngles);
      onUpdate(newJoints);
      // still in reset process
      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      } else {
        // set the start time and startAngle
        startTime = performance.now();
        startAngles = newJoints;
      }
    }

    // already reset to origin, then do the wave motion
    const t = (now - startTime) / duration;

    const newJoints = startAngles.map((a, i) => {
      switch (i) {
        case 0:
          return a + wave(t, 180, 0.6);
        case 2:
          return a + wave(t, 45, 0.75);
        case 4:
          return a + wave(t, 45);
        default:
          return a;
      }
    });

    onUpdate(newJoints);

    requestAnimationFrame(tick);
  };

  const start = (joints) => {
    // then add the wave motion
    startAngles = [...joints];
    startTime = performance.now();
    stopped = false;
    requestAnimationFrame(tick);
  };

  const stop = () => {
    stopped = true;
  };

  return { start, stop };
};

const moveDance = (onUpdate, duration = 2000) => {
  let stopped = true;
  let startTime = 0;
  let startAngles = [];

  const tick = (now) => {
    if (stopped) return;

    // need reset to origin before wave
    if (!startAngles.every((angle) => angle === 0)) {
      const { newJoints, t } = resetJoint(now, startTime, startAngles);
      onUpdate(newJoints);
      // still in reset process
      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      } else {
        // set the start time and startAngle
        startTime = performance.now();
        startAngles = newJoints;
      }
    }

    // already reset to origin, then do the wave motion
    const t = (now - startTime) / duration;

    const newJoints = startAngles.map((a, i) => {
      switch (i) {
        case 0:
          return a + wave(t, 180, 0.4);
        case 1:
          return a + wave(t, 50, 0.6);
        case 2:
          return a + wave(t, 40, 0.7);
        case 3:
          return a + wave(t, 180, 0.7);
        case 4:
          return a + wave(t, 60, 0.8);
        case 5:
          return a + wave(t, 90);
        default:
          return a;
      }
    });

    onUpdate(newJoints);

    requestAnimationFrame(tick);
  };

  const start = (joints) => {
    // then add the wave motion
    startAngles = [...joints];
    startTime = performance.now();
    stopped = false;
    requestAnimationFrame(tick);
  };

  const stop = () => {
    stopped = true;
  };

  return { start, stop };
};

export { moveToOrigin, moveWave, moveSweep, moveDance };
