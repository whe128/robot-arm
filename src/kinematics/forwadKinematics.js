import * as Math3D from "@/kinematics/transforms"


const ROBOT_CONFIG = {
  joints: [
    {
      name:   'joint1',
      parent: 'base_link',
      child:  'link1',
      origin: { x: 0,     y: 0.03,  z: 0     },
      axis:   { x: 0,     y: 1,     z: 0     },   // Y axis
      limit:  { lower: -Math.PI, upper: Math.PI },
    },
    {
      name:   'joint2',
      parent: 'link1',
      child:  'link2',
      origin: { x: 0,     y: 0.041, z: 0     },
      axis:   { x: 1,     y: 0,     z: 0     },   // X axis
      limit:  { lower: -1.57,       upper: 1.57   },
    },
    {
      name:   'joint3',
      parent: 'link2',
      child:  'link3',
      origin: { x: 0,     y: 0.25,  z: 0     },
      axis:   { x: 1,     y: 0,     z: 0     },   // X axis
      limit:  { lower: -2.007,      upper: 2.007  },
    },
    {
      name:   'joint4',
      parent: 'link3',
      child:  'link4',
      origin: { x: 0,     y: 0.1,   z: 0.019 },
      axis:   { x: 0,     y: 0,     z: 1     },   // Z axis
      limit:  { lower: -Math.PI, upper: Math.PI },
    },
    {
      name:   'joint5',
      parent: 'link4',
      child:  'link5',
      origin: { x: 0,     y: 0,     z: 0.15  },
      axis:   { x: 1,     y: 0,     z: 0     },   // X axis
      limit:  { lower: -2.007,      upper: 2.007  },
    },
    {
      name:   'joint6',
      parent: 'link5',
      child:  'link6',
      origin: { x: 0,     y: 0,     z: 0.125 },
      axis:   { x: 0,     y: 0,     z: 1     },   // Z axis
      limit:  { lower: -Math.PI, upper: Math.PI },
    },
  ],
};

const forwardKinematics = (joints_angles) => {
    // calculate the tf of each joint
    const frames = [Math3D.identity]; // base frame

    for(let i = 0; i < ROBOT_CONFIG.joints.length; i++){
        const {origin, axis, limit } = ROBOT_CONFIG.joints[i];

        const angle = Math.max(
        limit.lower,
        Math.min(limit.upper, joints_angles[i])
        );

        const T_origin = Math3D.translation(origin.x, origin.y, origin.z);
        const R_joint = Math3D.rotationAxis(axis, angle);
        const transform = Math3D.multiply(T_origin, R_joint);

        frames.push(Math3D.multiply(frames[i], transform));
    }

    return frames;
}

const endEffectorPose = (joints_angles) => {
    const frames = forwardKinematics(joints_angles);
    const endEffectorFrame = frames[frames.length - 1];


    const T_tip = Math3D.translation(0, 0, 0.028); // from last joint to end effector
    const tipFrame = Math3D.multiply(endEffectorFrame, T_tip);

    return Math3D.getPose(tipFrame);
}



export {
    forwardKinematics,
    endEffectorPose
}
