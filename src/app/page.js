"use client";

import RobotViewer from "@/components/RobotViewer";
import RobotControl from "@/components/RobotControl";
import RobotControlMobile from "@/components/RobotControlMobile";
import { SequencePanel } from "@/components/SequencePanel";
import { useState } from "react";

const Home = () => {
  // rad
  const [joints, setJoints] = useState([0, -0.4089, 0.9453, 0, -0.5364, 0]); // j1 ~ j6

  const [sequenceList, setSequenceList] = useState([
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.4, roll: 0, pitch: 0, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.1, roll: 0, pitch: 0, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 0, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0.2, y: 0.3, z: 0.25, roll: 0, pitch: 0, yaw: 0 },
    { id: Date.now() + Math.random(), x: -0.2, y: 0.3, z: 0.25, roll: 0, pitch: 0, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 0, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 0, yaw: 45 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 0, yaw: -45 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 0, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 45, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 45, yaw: 45 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 45, yaw: -45 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 45, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0, y: 0.422, z: 0.321, roll: 0, pitch: 0, yaw: 0 },
    { id: Date.now() + Math.random(), x: 0, y: 0.3, z: 0.25, roll: 0, pitch: 0, yaw: 0 },
  ]);

  const [isLoop, setIsLoop] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(true);

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
    <div className="relative sm:static flex flex-col h-screen bg-[#0d1117] text-[#e6edf3] font-sans">
      <button
        onClick={() => setShowMobilePanel((v) => !v)}
        className={`absolute -top-2.5 right-12 text-2xl px-1.5 py-4 bg-slate-800/60 border border-slate-700 rounded text-slate-300 hover:border-blue-500
          ${showMobilePanel ? "rotate-90" : "rotate-270"}`}
      >
        {"<"}
      </button>

      <div className="px-4 py-3 border-b border-[#21262d] text-sm font-semibold select-none">
        🦾 Robot Arm Simulation
      </div>

      <div className="flex-1 relative w-full h-full">
        <RobotViewer joints={joints} />

        <div className="hidden sm:block">
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

        <div className="block sm:hidden absolute top-0 w-full z-10 max-h-[calc(100vh-80px)] overflow-y-auto pointer-events-auto">
          <RobotControlMobile
            joints={joints}
            onJointChangeSingle={handleJointChangeSingle}
            onJointChangeWhole={handleJointChangeWhole}
            sequenceList={sequenceList}
            setSequenceList={setSequenceList}
            showSequence={showSequence}
            setShowSequence={setShowSequence}
            isLoop={isLoop}
            setIsLoop={setIsLoop}
            showMobilePanel={showMobilePanel}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
