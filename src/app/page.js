"use client";

import RobotViewer from "@/components/RobotViewer";
import RobotControl from "@/components/RobotControl";
import { useState } from "react";

const Home = () => {
  // rad
  const [joints, setJoints] = useState([0, -0.31, 0.4, -0.78, -0.78, 0]); // j1 ~ j6

  // rad
  const handleJointChangeSingle = (joint_index, value) => {
    setJoints((prev) => {
      const next = [...prev];
      next[joint_index] = value;
      return next;
    });
  };

  const handleJointChangeWhole = (joints) => {
    setJoints(joints);
  };

  const handleJointReset = () => {
    setJoints([0, -0.31, 0.4, -0.78, -0.78, 0]);
  };

  const handleJointClear = () => {
    setJoints(Array(6).fill(0));
  };

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-[#e6edf3] font-sans">
      <div className="px-4 py-3 border-b border-[#21262d] text-sm font-semibold">
        🦾 Robot Arm Simulation
      </div>

      <div className="flex-1 relative w-full h-full">
        <RobotViewer joints={joints} />

        <div className="absolute bottom-15 left-4 z-10 max-h-[calc(100vh-80px)] overflow-y-auto pointer-events-auto">
          <RobotControl
            joints={joints}
            onJointChangeSingle={handleJointChangeSingle}
            onJointReset={handleJointReset}
            onJointClear={handleJointClear}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
