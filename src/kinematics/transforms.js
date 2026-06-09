const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/**
 * rotate aroud x axis
 */
const rotationX = (rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
};

const rotationY = (rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
};

const rotationZ = (rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

const rotationAxis = (axis, rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const t = 1 - c;
  const { x, y, z } = axis;

  if (x === 1 && y === 0 && z === 0) return rotationX(rad);
  if (x === 0 && y === 1 && z === 0) return rotationY(rad);
  if (x === 0 && y === 0 && z === 1) return rotationZ(rad);

  return [
    t * x * x + c,
    t * x * y - s * z,
    t * x * z + s * y,
    0,
    t * x * y + s * z,
    t * y * y + c,
    t * y * z - s * x,
    0,
    t * x * z - s * y,
    t * y * z + s * x,
    t * z * z + c,
    0,
    0,
    0,
    0,
    1,
  ];
};

const translation = (x, y, z) => {
  return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
};

const multiply = (A, B) => {
  const C = new Array(16).fill(0);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += A[row * 4 + k] * B[k * 4 + col];
      }

      C[row * 4 + col] = sum;
    }
  }

  return C;
};

const multiplyChain = (...matrices) => {
  let result = identity;

  for (const mat of matrices) {
    result = multiply(result, mat);
  }

  return result;
};

const getPosition = (T) => {
  return {
    x: T[3],
    y: T[7],
    z: T[11],
  };
};

const getEulerZYX = (T) => {
  const r00 = T[0],
    r01 = T[1],
    r02 = T[2];
  const r10 = T[4],
    r11 = T[5],
    r12 = T[6];
  const r20 = T[8],
    r21 = T[9],
    r22 = T[10];

  const SINGULAR = 1e-6;
  let yaw, pitch, roll;

  const sinPitch = -r12;

  if (Math.abs(sinPitch) >= 1 - SINGULAR) {
    // Gimbal lock: pitch = ±90°
    roll = 0; // can set roll to 0

    if (sinPitch > 0) {
      // pitch = +90°
      yaw = Math.atan2(r02, r22);
      pitch = Math.PI / 2;
    } else {
      // pitch = -90°
      yaw = Math.atan2(-r02, -r22);
      pitch = -Math.PI / 2;
    }
  } else {
    yaw = Math.atan2(r02, r22);
    pitch = Math.atan2(-r12, Math.sqrt(r02 * r02 + r22 * r22));
    roll = Math.atan2(r10, r11);
  }

  return { yaw, pitch, roll };
};

const getPose = (T) => {
  const position = getPosition(T);
  const orientation = getEulerZYX(T);
  return { ...position, ...orientation };
};

const getQuaternionFromEular = ({ roll, pitch, yaw }) => {
  // yaw is the Y axis
  // pitch is the X axis
  // roll is the Z axis
  // three.js uses the order of rotation as YXZ, which is equivalent to ZYX in our case

  const cy = Math.cos(yaw * 0.5);
  const sy = Math.sin(yaw * 0.5);

  const cp = Math.cos(pitch * 0.5);
  const sp = Math.sin(pitch * 0.5);

  const cr = Math.cos(roll * 0.5);
  const sr = Math.sin(roll * 0.5);

  return {
    w: cy * cp * cr - sy * sp * sr,
    x: cy * sp * cr + sy * cp * sr,
    y: sy * cp * cr - cy * sp * sr,
    z: cy * cp * sr + sy * sp * cr,
  };
};

const quaternionSlerp = (a, b, t) => {
  let cosHalfTheta = a.w * b.w + a.x * b.x + a.y * b.y + a.z * b.z;

  if (cosHalfTheta < 0) {
    // reverse the second quaternion to take the shorter path
    b = { w: -b.w, x: -b.x, y: -b.y, z: -b.z };
    cosHalfTheta = -cosHalfTheta;
  }

  if (cosHalfTheta > 0.9995) {
    // quaternions are very close, use linear interpolation
    return {
      w: a.w + t * (b.w - a.w),
      x: a.x + t * (b.x - a.x),
      y: a.y + t * (b.y - a.y),
      z: a.z + t * (b.z - a.z),
    };
  }

  const theta0 = Math.acos(cosHalfTheta);
  const theta = theta0 * t;
  const sinT0 = Math.sin(theta0);

  const s0 = Math.cos(theta) - (cosHalfTheta * Math.sin(theta)) / sinT0;
  const s1 = Math.sin(theta) / sinT0;

  return {
    w: s0 * a.w + s1 * b.w,
    x: s0 * a.x + s1 * b.x,
    y: s0 * a.y + s1 * b.y,
    z: s0 * a.z + s1 * b.z,
  };
};

// get quaternion from rotation matrix
const matrixToQuat = (T) => {
  const m00 = T[0],
    m01 = T[1],
    m02 = T[2];
  const m10 = T[4],
    m11 = T[5],
    m12 = T[6];
  const m20 = T[8],
    m21 = T[9],
    m22 = T[10];

  const trace = m00 + m11 + m22;

  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    return {
      w: 0.25 / s,
      x: (m21 - m12) * s,
      y: (m02 - m20) * s,
      z: (m10 - m01) * s,
    };
  } else if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
    return {
      w: (m21 - m12) / s,
      x: 0.25 * s,
      y: (m01 + m10) / s,
      z: (m02 + m20) / s,
    };
  } else if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
    return {
      w: (m02 - m20) / s,
      x: (m01 + m10) / s,
      y: 0.25 * s,
      z: (m12 + m21) / s,
    };
  } else {
    const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
    return {
      w: (m10 - m01) / s,
      x: (m02 + m20) / s,
      y: (m12 + m21) / s,
      z: 0.25 * s,
    };
  }
};

export {
  identity,
  rotationX,
  rotationY,
  rotationZ,
  rotationAxis,
  translation,
  multiply,
  multiplyChain,
  getPosition,
  getEulerZYX,
  getPose,
  getQuaternionFromEular,
  quaternionSlerp,
  matrixToQuat,
};
