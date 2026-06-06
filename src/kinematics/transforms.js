
const identity = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
];

/**
 * rotate aroud x axis
 */
const rotationX = (rad) =>{
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
        1, 0,  0, 0,
        0, c, -s, 0,
        0, s,  c, 0,
        0, 0,  0, 1,
    ];
}

const rotationY = (rad) =>{
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
        c,  0, s, 0,
        0,  1, 0, 0,
        -s, 0, c, 0,
        0,  0, 0, 1,
    ];
}

const rotationZ = (rad) =>{
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return [
        c, -s, 0, 0,
        s,  c, 0, 0,
        0,  0, 1, 0,
        0,  0, 0, 1,
    ];
}

const rotationAxis = (axis, rad) => {

    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const t = 1 - c;
    const {x, y, z} = axis;

    if (x === 1 && y === 0 && z === 0) return rotationX(rad);
    if (x === 0 && y === 1 && z === 0) return rotationY(rad);
    if (x === 0 && y === 0 && z === 1) return rotationZ(rad);

    return [
        t*x*x + c,   t*x*y - s*z, t*x*z + s*y, 0,
        t*x*y + s*z, t*y*y + c,   t*y*z - s*x, 0,
        t*x*z - s*y, t*y*z + s*x, t*z*z + c,   0,
        0,           0,           0,           1,
    ];
}

const translation = (x, y, z) => {
    return [
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1,
    ];
}

const multiply = (A, B) => {
    const C = new Array(16).fill(0);

    for(let row = 0; row < 4; row++){
        for(let col = 0; col < 4; col++){
            let sum = 0;
            for(let k = 0; k < 4; k++){
                sum += A[row * 4 + k] * B[k * 4 + col];
            }

            C[row * 4 + col] = sum;
        }
    }

    return C;
}

const multiplyChain = (...matrices) => {
    let result = identity;

    for(const mat of matrices){
        result = multiply(result, mat);
    }

    return result;
}

const getPosition = (T) => {
    return {
        x: T[3],
        y: T[7],
        z: T[11],
    };
}

const getEulerZYX = (T) => {
    const r00 = T[0], r01 = T[1], r02 = T[2];
    const r10 = T[4], r11 = T[5], r12 = T[6];
    const r20 = T[8], r21 = T[9], r22 = T[10];

    const yaw = Math.atan2(r10, r00);
    const pitch = Math.atan2(-r20, Math.sqrt(r21 * r21 + r22 * r22));
    const roll = Math.atan2(r21, r22);

    return { yaw, pitch, roll };
}

const getPose = (T) => {
    const position = getPosition(T);
    const orientation = getEulerZYX(T);
    return { ...position, ...orientation };
}

const getQuaternion = (T) => {
    const r00=T[0], r01=T[1], r02=T[2];
    const r10=T[4], r11=T[5], r12=T[6];
    const r20=T[8], r21=T[9], r22=T[10];

    const trace = r00 + r11 + r22;
    let w, x, y, z;

    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1);
        w = 0.25 / s;
        x = (r21 - r12) * s;
        y = (r02 - r20) * s;
        z = (r10 - r01) * s;
    } else if (r00 > r11 && r00 > r22) {
        const s = 2 * Math.sqrt(1 + r00 - r11 - r22);
        w = (r21 - r12) / s;
        x = 0.25 * s;
        y = (r01 + r10) / s;
        z = (r02 + r20) / s;
    } else if (r11 > r22) {
        const s = 2 * Math.sqrt(1 + r11 - r00 - r22);
        w = (r02 - r20) / s;
        x = (r01 + r10) / s;
        y = 0.25 * s;
        z = (r21 + r12) / s;
    } else {
        const s = 2 * Math.sqrt(1 + r22 - r00 - r11);
        w = (r10 - r01) / s;
        x = (r02 + r20) / s;
        y = (r21 + r12) / s;
        z = 0.25 * s;
    }
    return { w, x, y, z };
}

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
    getPose
}
