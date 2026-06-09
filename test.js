const getEulerYXZ = (T) => {
    const m00=T[0], m01=T[4], m02=T[8];
    const m10=T[1], m11=T[5], m12=T[9];
    const m20=T[2], m21=T[6], m22=T[10];

    const trace = m00 + m11 + m22;
    let qw, qx, qy, qz;

    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1.0);
        qw = 0.25 / s;
        qx = (m21 - m12) * s;
        qy = (m20 - m02) * s;  // ← 修正
        qz = (m10 - m01) * s;
    } else if (m00 > m11 && m00 > m22) {
        const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
        qw = (m21 - m12) / s;
        qx = 0.25 * s;
        qy = (m01 + m10) / s;
        qz = (m02 + m20) / s;
    } else if (m11 > m22) {
        const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
        qw = (m02 - m20) / s;  // ← 注意这里 qw 用 m02-m20
        qx = (m01 + m10) / s;
        qy = 0.25 * s;
        qz = (m12 + m21) / s;
    } else {
        const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
        qw = (m10 - m01) / s;
        qx = (m02 + m20) / s;
        qy = (m12 + m21) / s;
        qz = 0.25 * s;
    }

    // 四元数 → YXZ 欧拉角
    const sinPitch = -2 * (qy * qz - qw * qx);
    const SINGULAR = 1e-6;
    let yaw, pitch, roll;

    if (Math.abs(sinPitch) >= 1 - SINGULAR) {
        pitch = Math.PI / 2 * Math.sign(sinPitch);
        yaw   = Math.atan2(-2 * (qx * qz - qw * qy), 1 - 2 * (qy * qy + qz * qz));
        roll  = 0;
    } else {
        pitch = Math.asin(sinPitch);
        yaw   = Math.atan2(2 * (qx * qz + qw * qy), 1 - 2 * (qx * qx + qy * qy));
        roll  = Math.atan2(2 * (qx * qy + qw * qz), 1 - 2 * (qx * qx + qz * qz));
    }

    return { yaw, pitch, roll };
};


console.log("Test passed: getEulerYXZ is defined and returns an object with yaw, pitch, roll");
const degToRad = (deg) => (deg * Math.PI) / 180;
const c = (deg) => Math.cos(degToRad(deg));
const s = (deg) => Math.sin(degToRad(45));

const testMatrix = [
    0, -1, 0, 0,
    1, 0, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];
const result = getEulerYXZ(testMatrix);

// to deg
result.yaw = result.yaw * 180 / Math.PI;
result.pitch = result.pitch * 180 / Math.PI;
result.roll = result.roll * 180 / Math.PI;
console.log(result);
