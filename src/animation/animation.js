import { endEffectorPose, inverseKinematics } from "@/kinematics/kinematics";
import {
  getQuaternionFromEular,
  quaternionSlerp,
} from "@/kinematics/transforms";

import { useEffect, useRef } from "react";

const degToRad = (deg) => (deg * Math.PI) / 180;

const wave = (t, deg, freq = 1) =>
  (Math.sin(t * Math.PI * 2 * freq) * (deg * Math.PI)) / 180;

const resetJoint = (now, startTime, startAngles, duration = 500) => {
  const t = Math.min((now - startTime) / duration, 1);
  const ease = 1 - Math.pow(1 - t, 2);

  const newJoints = startAngles.map((a) => a * (1 - ease));

  return { newJoints, t };
};

const moveToOrigin = (onUpdate, onStop, duration = 2500) => {
  let stopped = true;
  let startTime = 0;
  let startAngles = [];

  const tick = (now) => {
    if (stopped) return;

    const { newJoints, t } = resetJoint(now, startTime, startAngles, duration);

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

const moveToTarget = (onUpdate, onStop, duration = 2500) => {


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
    startPose = endEffectorPose(joints);
    startQuat = getQuaternionFromEular(startPose);

    targetPose = {...targetPoseInput};
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

export { moveToOrigin, moveWave, moveSweep, moveDance, moveToTarget };
