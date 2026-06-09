import * as Math3D from "@/kinematics/transforms";

const ROBOT_CONFIG = {
  joints: [
    {
      name: "joint1",
      parent: "base_link",
      child: "link1",
      origin: { x: 0, y: 0.03, z: 0 },
      axis: { x: 0, y: 1, z: 0 }, // Y axis
      limit: { lower: -Math.PI, upper: Math.PI },
    },
    {
      name: "joint2",
      parent: "link1",
      child: "link2",
      origin: { x: 0, y: 0.041, z: 0 },
      axis: { x: 1, y: 0, z: 0 }, // X axis
      limit: { lower: -1.57, upper: 1.57 },
    },
    {
      name: "joint3",
      parent: "link2",
      child: "link3",
      origin: { x: 0, y: 0.25, z: 0 },
      axis: { x: 1, y: 0, z: 0 }, // X axis
      limit: { lower: -2.007, upper: 2.007 },
    },
    {
      name: "joint4",
      parent: "link3",
      child: "link4",
      origin: { x: 0, y: 0.1, z: 0.019 },
      axis: { x: 0, y: 0, z: 1 }, // Z axis
      limit: { lower: -Math.PI, upper: Math.PI },
    },
    {
      name: "joint5",
      parent: "link4",
      child: "link5",
      origin: { x: 0, y: 0, z: 0.15 },
      axis: { x: 1, y: 0, z: 0 }, // X axis
      limit: { lower: -2.007, upper: 2.007 },
    },
    {
      name: "joint6",
      parent: "link5",
      child: "link6",
      origin: { x: 0, y: 0, z: 0.125 },
      axis: { x: 0, y: 0, z: 1 }, // Z axis
      limit: { lower: -Math.PI, upper: Math.PI },
    },
  ],
};

const forwardKinematics = (joints_angles) => {
  // calculate the tf of each joint
  const frames = [Math3D.identity]; // base frame

  for (let i = 0; i < ROBOT_CONFIG.joints.length; i++) {
    const { origin, axis, limit } = ROBOT_CONFIG.joints[i];

    const angle = Math.max(
      limit.lower,
      Math.min(limit.upper, joints_angles[i]),
    );

    const T_origin = Math3D.translation(origin.x, origin.y, origin.z);
    const R_joint = Math3D.rotationAxis(axis, angle);
    const transform = Math3D.multiply(T_origin, R_joint);

    frames.push(Math3D.multiply(frames[i], transform));
  }

  return frames;
};

const endEffectorPose = (joints_angles) => {
  const frames = forwardKinematics(joints_angles);
  const endEffectorFrame = frames[frames.length - 1];

  const T_tip = Math3D.translation(0, 0, 0.028); // from last joint to end effector
  const tipFrame = Math3D.multiply(endEffectorFrame, T_tip);

  return Math3D.getPose(tipFrame);
};

const quatError = (current, target) => {
  const cInv = { w: current.w, x: -current.x, y: -current.y, z: -current.z };
  const qe = {
    w:
      target.w * cInv.w -
      target.x * cInv.x -
      target.y * cInv.y -
      target.z * cInv.z,
    x:
      target.w * cInv.x +
      target.x * cInv.w +
      target.y * cInv.z -
      target.z * cInv.y,
    y:
      target.w * cInv.y -
      target.x * cInv.z +
      target.y * cInv.w +
      target.z * cInv.x,
    z:
      target.w * cInv.z +
      target.x * cInv.y -
      target.y * cInv.x +
      target.z * cInv.w,
  };
  const sign = qe.w >= 0 ? 1 : -1;
  return { x: sign * 2 * qe.x, y: sign * 2 * qe.y, z: sign * 2 * qe.z };
};

// jacobian from joint frames
const computeJacobianFromFrames = (frames) => {
  const T_tip = Math3D.translation(0, 0, 0.028);
  const tipFrame = Math3D.multiply(frames[frames.length - 1], T_tip);
  const endPos = Math3D.getPosition(tipFrame);

  const J = [];

  for (let i = 0; i < ROBOT_CONFIG.joints.length; i++) {
    const cfg = ROBOT_CONFIG.joints[i];

    // frames[i+1] is i th joint frame (frames[0] is base frame), which is the origin of joint axis in world coordinate
    const jointFrame = frames[i + 1];
    const jointPos = Math3D.getPosition(jointFrame);

    // in the world coordinate, the joint axis direction is the rotation of the local joint axis by the joint frame rotation
    const ax = cfg.axis;
    const worldAxis = {
      x: jointFrame[0] * ax.x + jointFrame[1] * ax.y + jointFrame[2] * ax.z,
      y: jointFrame[4] * ax.x + jointFrame[5] * ax.y + jointFrame[6] * ax.z,
      z: jointFrame[8] * ax.x + jointFrame[9] * ax.y + jointFrame[10] * ax.z,
    };

    // vector from joint to end effector
    const r = {
      x: endPos.x - jointPos.x,
      y: endPos.y - jointPos.y,
      z: endPos.z - jointPos.z,
    };

    // position：axis × r
    const Jv = {
      x: worldAxis.y * r.z - worldAxis.z * r.y,
      y: worldAxis.z * r.x - worldAxis.x * r.z,
      z: worldAxis.x * r.y - worldAxis.y * r.x,
    };

    J.push([Jv.x, Jv.y, Jv.z, worldAxis.x, worldAxis.y, worldAxis.z]);
  }

  return J;
};

const solve6x6 = (A, b) => {
  const n = 6;

  // augmented matrix
  const M = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    // pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }
    [M[i], M[maxRow]] = [M[maxRow], M[i]];

    // normalize pivot row
    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-9) continue;

    for (let j = i; j <= n; j++) {
      M[i][j] /= pivot;
    }

    // eliminate
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = M[k][i];
      for (let j = i; j <= n; j++) {
        M[k][j] -= factor * M[i][j];
      }
    }
  }

  return M.map(row => row[n]);
};

const inverseKinematics = (
  targetPosition,
  targetOrientation,
  currentJoints,
  {
    maxIter = 20,
    posTol = 0.0001,
    rotTol = 0.001,
    stepSize = 0.5,
    lambda = 0.01,
  } = {},
) => {
  let joints = [...currentJoints];

  for (let iter = 0; iter < maxIter; iter++) {
    // calculate current end effector pose by forward kinematics
    const frames = forwardKinematics(joints);

    // add tip translation
    const T_tip = Math3D.translation(0, 0, 0.028);
    const tipFrame = Math3D.multiply(frames[frames.length - 1], T_tip);

    // get current end effector position
    const currentPos = Math3D.getPosition(tipFrame);

    // get current end effector orientation (quaternion)
    const currentQuat = Math3D.matrixToQuat(tipFrame);

    // position error
    const posErr = {
      x: targetPosition.x - currentPos.x,
      y: targetPosition.y - currentPos.y,
      z: targetPosition.z - currentPos.z,
    };

    // rotation error
    const rotErr = quatError(currentQuat, targetOrientation);

    // converge detection
    const posErrMag = Math.sqrt(posErr.x ** 2 + posErr.y ** 2 + posErr.z ** 2);
    const rotErrMag = Math.sqrt(rotErr.x ** 2 + rotErr.y ** 2 + rotErr.z ** 2);
    if (posErrMag < posTol && rotErrMag < rotTol) break;

    const e = [posErr.x, posErr.y, posErr.z, rotErr.x, rotErr.y, rotErr.z];

    // jacobian matrix, avoid forward kinematics redundant calculation by reusing the joint frames
    const J = computeJacobianFromFrames(frames);

    // damped least squares
    const m = 6,
      n = joints.length;
    const A = Array.from({ length: m }, () => new Array(m).fill(0));
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) {
        for (let k = 0; k < n; k++) A[r][c] += J[k][r] * J[k][c];
        if (r === c) A[r][c] += lambda * lambda;
      }
    }

    const alpha = solve6x6(A, e);
    const dq = joints.map((_, i) =>
      J[i].reduce((sum, Jij, j) => sum + Jij * alpha[j], 0),
    );

    joints = joints.map((q, i) => {
      const newQ = q + stepSize * dq[i];
      const { lower, upper } = ROBOT_CONFIG.joints[i].limit;
      return Math.max(lower, Math.min(upper, newQ));
    });
  }

  return joints;
};

export { forwardKinematics, endEffectorPose, inverseKinematics };
