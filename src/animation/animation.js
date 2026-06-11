import { endEffectorPose, inverseKinematics } from "@/kinematics/kinematics";
import {
  getQuaternionFromEular,
  quaternionSlerp,
} from "@/kinematics/transforms";

const originalJoints = [0, -0.4089, 0.9453, 0, -0.5364, 0];

const degToRad = (deg) => (deg * Math.PI) / 180;

const wave = (t, deg, freq = 1) =>
  (Math.sin(t * Math.PI * 2 * freq) * (deg * Math.PI)) / 180;

const resetJoint = (now, startTime, startAngles, duration = 500) => {
  const t = Math.min((now - startTime) / duration, 1);
  const ease = 1 - Math.pow(1 - t, 2);

  const newJoints = startAngles.map((a) => a * (1 - ease));

  return { newJoints, t };
};

const moveToOrigin = (onUpdate, onStop, duration = 2000) => {
  let stopped = true;
  let startTime = 0;
  let startAngles = [];

  const tick = (now) => {
    if (stopped) return;

    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 2);
    const newJoints = startAngles.map(
      (a, i) => a + (originalJoints[i] - a) * ease,
    );

    onUpdate(newJoints);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onStop();
    }
  };

  const start = (joints) => {
    stopped = true;
    if (
      joints.every((angle) => {
        const originAngle = originalJoints[joints.indexOf(angle)];
        return Math.abs(angle - originAngle) < 0.001;
      })
    ) {
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

const moveAnimation = (animationNewJontsFunc, onUpdate, duration = 2500) => {
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

    const newJoints = animationNewJontsFunc(startAngles, t);

    onUpdate(newJoints);

    requestAnimationFrame(tick);
  };

  const start = (joints) => {
    stopped = true;
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

const moveWave = (onUpdate, duration = 2500) => {
  const waveNewJoints = (startAngles, t) => {
    return startAngles.map((a, i) => {
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
  };
  return moveAnimation(waveNewJoints, onUpdate, duration);
};

const moveSweep = (onUpdate, duration = 2500) => {
  const sweepNewJoints = (startAngles, t) => {
    return startAngles.map((a, i) => {
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
  };
  return moveAnimation(sweepNewJoints, onUpdate, duration);
};

const moveDance = (onUpdate, duration = 2500) => {
  const danceNewJoints = (startAngles, t) => {
    return startAngles.map((a, i) => {
      switch (i) {
        case 0:
          return a + wave(t, 180, 0.4);
        case 1:
          return a - wave(t, 50, 0.6);
        case 2:
          return a + wave(t, 50, 0.7);
        case 3:
          return a - wave(t, 180, 0.7);
        case 4:
          return a + wave(t, 60, 0.8);
        case 5:
          return a - wave(t, 90);
        default:
          return a;
      }
    });
  };
  return moveAnimation(danceNewJoints, onUpdate, duration);
};

const moveToTarget = (onUpdate, onStop, duration = 2000) => {
  let stopped = true;
  let startTime = 0;
  let currentJoints = [];
  let startPose = null;
  let startQuat = null;
  let targetPose = null;
  let targetQuat = null;

  const tick = (now) => {
    if (stopped) return;

    // the ratio of move progress, from 0 to 1
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 2);

    const middleTargetPosition = {
      x: startPose.x + (targetPose.x - startPose.x) * ease,
      y: startPose.y + (targetPose.y - startPose.y) * ease,
      z: startPose.z + (targetPose.z - startPose.z) * ease,
    };

    const middleTargetQuat = quaternionSlerp(startQuat, targetQuat, ease);

    currentJoints = inverseKinematics(
      middleTargetPosition,
      middleTargetQuat,
      currentJoints,
    );

    onUpdate(currentJoints);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onStop();
    }
  };

  const start = (joints, targetPoseInput) => {
    stopped = true;
    startPose = endEffectorPose(joints);
    startQuat = getQuaternionFromEular(startPose);

    targetPose = { ...targetPoseInput };
    targetQuat = getQuaternionFromEular({
      roll: degToRad(targetPose.roll),
      pitch: degToRad(targetPose.pitch),
      yaw: degToRad(targetPose.yaw),
    });

    const cosHalfTheta =
      startQuat.w * targetQuat.w +
      startQuat.x * targetQuat.x +
      startQuat.y * targetQuat.y +
      startQuat.z * targetQuat.z;

    const posClose =
      Math.abs(targetPose.x - startPose.x) < 0.001 &&
      Math.abs(targetPose.y - startPose.y) < 0.001 &&
      Math.abs(targetPose.z - startPose.z) < 0.001;

    // if already at target, stop
    if (posClose && Math.abs(cosHalfTheta) > 0.99999) {
      onStop();
      return;
    }

    currentJoints = [...joints];

    startTime = performance.now();
    stopped = false;
    requestAnimationFrame(tick);
  };

  const stop = () => {
    stopped = true;
  };

  return { start, stop };
};

const moveCircle = (onUpdate, onTrace, duration = 1800, radius = 0.09) => {
  const startCicrcleJoints = [0, 0.33545228, 0.77510072, 0, -1.110553, 0];
  let stopped = true;
  let startTime = 0;
  let currentJoints = [];
  let startPose = null;
  let startQuat = null;
  let hasResetOrigin = false;
  let startAngles = [];

  let drawBigCircle = false; // control to draw big circle or two small circles, start with two small circles

  const tick = (now) => {
    if (stopped) return;

    // move to origin first if not yet, then start the sequence animation
    if (!hasResetOrigin) {
      const t = Math.min((2 * (now - startTime)) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 1.5);

      const newJoints = startAngles.map(
        (a, i) => a + (startCicrcleJoints[i] - a) * ease,
      );

      onUpdate(newJoints);

      if (t >= 1) {
        // already reset to origin, then set the start time and start pose/quat for next animation
        hasResetOrigin = true;
        startTime = now;
        startPose = endEffectorPose(newJoints);
        startQuat = getQuaternionFromEular(startPose);
        currentJoints = newJoints;
        onTrace(true);
      }

      requestAnimationFrame(tick);
      return;
    }

    const t = Math.min((now - startTime) / duration, 1);

    const angle = -Math.PI / 4; // circle plane angle, fixed to 45 degree for better visual effect, can be changed to other angle or even animation

    let middleTargetPosition;

    if (drawBigCircle) {
      //
      const dy = radius + radius * -Math.cos(t * 2 * Math.PI);
      middleTargetPosition = {
        x: startPose.x + radius * -Math.sin(t * 2 * Math.PI),
        y: startPose.y + dy * Math.cos(angle),
        z: startPose.z + dy * Math.sin(angle),
      };
    } else {
      // two small circles
      const r = radius / 2;
      const localT = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      let dx, dy;

      if (t < 0.25) {
        // √
        dx = r * -Math.sin(localT * 2 * Math.PI);
        dy = r - r * Math.cos(localT * 2 * Math.PI);
      } else if (t < 0.5) {
        dx = r * -Math.sin(localT * 2 * Math.PI);
        dy = 3 * r + r * Math.cos(localT * 2 * Math.PI);
      } else if (t < 0.75) {
        dx = r * -Math.sin(localT * 2 * Math.PI);
        dy = 3 * r + r * Math.cos(localT * 2 * Math.PI);
      } else {
        dx = r * -Math.sin(localT * 2 * Math.PI);
        dy = r - r * Math.cos(localT * 2 * Math.PI);
      }

      middleTargetPosition = {
        x: startPose.x + dx,
        y: startPose.y + dy * Math.cos(angle),
        z: startPose.z + dy * Math.sin(angle),
      };

      middleTargetPosition = {
        x: startPose.x + dx,
        y: startPose.y + dy * Math.cos(angle),
        z: startPose.z + dy * Math.sin(angle),
      };
    }

    const middleTargetQuat = { ...startQuat };

    currentJoints = inverseKinematics(
      middleTargetPosition,
      middleTargetQuat,
      currentJoints,
    );

    onUpdate(currentJoints);

    requestAnimationFrame(tick);

    if (t >= 1) {
      startTime = now;
      drawBigCircle = !drawBigCircle;
    }
  };

  const start = (joints) => {
    stopped = true;

    // check the start joint is already at the circle start position, if not, need reset to origin first
    if (
      joints.every((angle) => {
        const originAngle = startCicrcleJoints[joints.indexOf(angle)];
        return Math.abs(angle - originAngle) < 0.0001;
      })
    ) {
      hasResetOrigin = true;
    } else {
      hasResetOrigin = false;
    }
    onTrace(hasResetOrigin);

    startPose = endEffectorPose(joints);
    startQuat = getQuaternionFromEular(startPose);

    currentJoints = [...joints];
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

const moveSequence = (onUpdate, onStop, onTrace, duration = 800) => {
  let sequenceList = null;
  let isLoop = false;
  let currentJoints = [];
  let currentIndex = -1;
  let startTime = 0;
  let stopped = true;

  let startPose = null;
  let startQuat = null;

  let hasResetOrigin = false;
  let startAngles = [];

  const tick = (now) => {
    if (stopped) return;

    // the ratio of move progress
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 1.5);

    // move to origin first if not yet, then start the sequence animation
    if (!hasResetOrigin) {
      const newJoints = startAngles.map(
        (a, i) => a + (originalJoints[i] - a) * ease,
      );

      onUpdate(newJoints);

      if (t >= 1) {
        // already reset to origin, then set the start time and start pose/quat for next animation
        hasResetOrigin = true;
        startTime = now;
        startPose = endEffectorPose(newJoints);
        startQuat = getQuaternionFromEular(startPose);
        currentJoints = newJoints;
        onTrace(true);
      }

      requestAnimationFrame(tick);
      return;
    }

    const targetPose = sequenceList[currentIndex];
    const targetQuat = getQuaternionFromEular({
      roll: degToRad(targetPose.roll),
      pitch: degToRad(targetPose.pitch),
      yaw: degToRad(targetPose.yaw),
    });

    const middleTargetPosition = {
      x: startPose.x + (targetPose.x - startPose.x) * t,
      y: startPose.y + (targetPose.y - startPose.y) * t,
      z: startPose.z + (targetPose.z - startPose.z) * t,
    };

    const cosHalfTheta =
      startQuat.w * targetQuat.w +
      startQuat.x * targetQuat.x +
      startQuat.y * targetQuat.y +
      startQuat.z * targetQuat.z;

    const posClose =
      Math.abs(targetPose.x - startPose.x) < 0.0001 &&
      Math.abs(targetPose.y - startPose.y) < 0.0001 &&
      Math.abs(targetPose.z - startPose.z) < 0.0001;

    const closeEnough = posClose && Math.abs(cosHalfTheta) > 0.99999;

    if (closeEnough || t >= 1) {
      // close enough to target, go to next sequence
      // move to next sequence
      currentIndex += 1;
      // update the start time of next sequence
      startTime = now;
      // update the start pose and quat of next sequence
      startPose = { ...targetPose };
      startQuat = { ...targetQuat };

      if (currentIndex >= sequenceList.length) {
        // loop retuen back to the first sequence
        if (isLoop) {
          currentIndex = 0;
        } else {
          onStop();
          return;
        }
      }
    } else {
      const middleTargetQuat = quaternionSlerp(startQuat, targetQuat, ease);

      currentJoints = inverseKinematics(
        middleTargetPosition,
        middleTargetQuat,
        currentJoints,
      );

      onUpdate(currentJoints);
    }

    requestAnimationFrame(tick);
  };

  const start = (joints, sequenceListInput, isLoopInput) => {
    stopped = true;
    // no sequence, stop immediately
    if (!sequenceListInput || sequenceListInput.length === 0) {
      onStop();
      return;
    }

    if (
      joints.every((angle) => {
        const originAngle = originalJoints[joints.indexOf(angle)];
        return Math.abs(angle - originAngle) < 0.0001;
      })
    ) {
      hasResetOrigin = true;
    } else {
      hasResetOrigin = false;
    }

    onTrace(hasResetOrigin);

    sequenceList = sequenceListInput;
    isLoop = isLoopInput;
    currentIndex = 0;
    currentJoints = [...joints];
    startAngles = [...joints];

    // initial iteration's start pose and quaternion
    startPose = endEffectorPose(joints);
    startQuat = getQuaternionFromEular(startPose);

    startTime = performance.now();
    stopped = false;

    requestAnimationFrame(tick);
  };

  const stop = () => {
    stopped = true;
  };

  return { start, stop };
};

const moveManual = (onUpdate, speedPos = 0.15, speedRad = 1.3) => {
  let stopped = true;
  let startTime = 0;
  let currentJoints = [];

  let startPose = null;
  let startQuat = null;

  let moveSpeed = null;

  const tick = (now) => {
    if (stopped) {
      return;
    }

    const elapsed = (now - startTime) / 1000; // in seconds

    const targetPose = {
      x: startPose.x + moveSpeed.x * elapsed,
      y: startPose.y + moveSpeed.y * elapsed,
      z: startPose.z + moveSpeed.z * elapsed,
      roll: startPose.roll + moveSpeed.roll * elapsed,
      pitch: startPose.pitch + moveSpeed.pitch * elapsed,
      yaw: startPose.yaw + moveSpeed.yaw * elapsed,
    };

    currentJoints = inverseKinematics(
      targetPose,
      getQuaternionFromEular(targetPose),
      currentJoints,
    );

    onUpdate(currentJoints);
    requestAnimationFrame(tick);
  };

  const start = (joints, moveField, isAdd) => {
    stopped = true;
    // record the start pose
    startPose = endEffectorPose(joints);
    startQuat = getQuaternionFromEular(startPose);
    currentJoints = [...joints];

    const sign = isAdd ? 1 : -1;
    moveSpeed = { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 };

    if (["x", "y", "z"].includes(moveField)) {
      moveSpeed[moveField] = sign * speedPos;
    } else {
      moveSpeed[moveField] = sign * speedRad;
    }

    startTime = performance.now();
    stopped = false;
    requestAnimationFrame(tick);
  };

  const stop = () => {
    stopped = true;
  };

  return { start, stop };
};

export {
  moveToOrigin, // all trace
  moveWave, // all trace
  moveSweep, // all trace
  moveDance, // all trace
  moveToTarget, // all trace
  moveCircle, // first move start - notrace, circle trace
  moveSequence, // first move start - notrace, sequence trace
  moveManual, // all trace
};
