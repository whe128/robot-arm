"use client";

import RobotViewer from "@/components/RobotViewer";
import RobotControl from "@/components/RobotControl";
import SequencePanel from "@/components/SequencePanel";
import { useState } from "react";

const Home = () => {
  // rad
  const [joints, setJoints] = useState([0, -0.4089, 0.9453, 0, -0.5364, 0]); // j1 ~ j6

  const [sequenceList, setSequenceList] = useState([
    {
      id: crypto.randomUUID(),
      x: 0,
      y: 0.3,
      z: 0.4,
      roll: 0,
      pitch: 0,
      yaw: 0,
    },
  ]);

  const [isLoop, setIsLoop] = useState(false);
  const [showSequence, setShowSequence] = useState(false);

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

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-[#e6edf3] font-sans">
      <div className="px-4 py-3 border-b border-[#21262d] text-sm font-semibold">
        🦾 Robot Arm Simulation
      </div>

      <div className="flex-1 relative w-full h-full">
        <RobotViewer joints={joints} />

        <div className="absolute bottom-12 left-4 z-10 max-h-[calc(100vh-80px)] overflow-y-auto pointer-events-auto">
          <RobotControl
            joints={joints}
            onJointChangeSingle={handleJointChangeSingle}
            onJointChangeWhole={handleJointChangeWhole}
            showSequence={showSequence}
            setShowSequence={setShowSequence}
            sequenceList={sequenceList}
            isLoop={isLoop}
          />
        </div>
        {showSequence && (
          <div className="absolute top-20 left-[302px]">
            <SequencePanel
              sequenceList={sequenceList}
              setSequenceList={setSequenceList}
              setShowSequence={setShowSequence}
              isLoop={isLoop}
              setIsLoop={setIsLoop}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
