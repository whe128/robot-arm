import {SequencePanelMobile} from "@/components/SequencePanel";

import { useState, useRef } from "react";
import { moveToTarget, moveToOrigin, moveWave, moveSweep, moveDance, moveSequence, moveManual, moveCircle } from "@/animation/animation";

import { endEffectorPose } from "@/kinematics/kinematics";

const JointSlider = ({ label, value, min, max, onChange, disabled }) => (
  <div className="">
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200 font-medium tabular-nums">{value.toFixed(2)}°</span>
    </div>
    <input
      type="range" min={min} max={max} step={0.01} value={value}
      onChange={(e) => { if (!disabled) onChange(e.target.value); }}
      className={`
        w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500
        ${disabled ? "pointer-events-none" : ""}
      `}
      />
  </div>
);

const AnimBtn = ({ label, active, onClick, stop = false }) => (
  <button
    onClick={onClick}
    className={`
      w-full
      ${stop ? "text-center":"text-left"}
      py-2 px-3 text-xs rounded-md border transition-colors duration-150
      ${active
        ? "bg-slate-800/50 border-slate-500 text-slate-100"
        : "bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700"}
    `}
  >
    <span className="inline-block w-3 mr-1 text-[10px]">{stop ? "■" : "▶"}</span>
    {label}
  </button>
);


// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "joints",   label: "JOINT" },
  { id: "endpoint", label: "END_POINT"},
  { id: "control",  label: "CONTROL"},
  { id: "sequence",  label: "SEQUENCE"},
];

const TabBar = ({ active, onChange }) => (
  <div className="flex border-b border-slate-800">
    {TABS.map(({ id, label }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`
          flex-1 py-2 text-xs font-medium tracking-wide transition-colors duration-150
          ${active === id
            ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
            : "text-slate-500 hover:text-slate-300"}
        `}
      >

        {label}
      </button>
    ))}
  </div>
);

const degToRad = deg => deg * (Math.PI / 180);
const radToDeg = rad => rad * (180 / Math.PI);

const RobotControlMobile = ({
  joints,
  onJointChangeSingle,
  onJointChangeWhole,
  sequenceList,
  setSequenceList,
  isLoop,
  setIsLoop,
  showMobilePanel
}) => {
  const [activeTab, setActiveTab]   = useState("joints");
  const [activeAnim, setActiveAnim] = useState(null);
  const isAnimating = activeAnim !== null;

  // true position of target in world coordinate, not the show position of input box
  const [target, setTarget] = useState({
    id: Date.now() + Math.random(),
    x: 0,
    y: 0.30,
    z: 0.25,
    roll: 0,
    pitch: 0,
    yaw: 0});

  const handleJ = (index, v) => {
    const deg = parseFloat(v);
    onJointChangeSingle?.(index, degToRad(deg));
  };

  const handleTargetChange = (axis, value) => {
    const next = { ...target, [axis]: value };
    setTarget(next);
  };
  const onStop = () => setActiveAnim(null);

  const animationHandleMap = useRef({
    target:   moveToTarget(onJointChangeWhole, onStop),
    origin:   moveToOrigin(onJointChangeWhole, onStop),
    wave:     moveWave(onJointChangeWhole),
    sweep:    moveSweep(onJointChangeWhole),
    dance:    moveDance(onJointChangeWhole),
    sequence: moveSequence(onJointChangeWhole, onStop),
    circle:   moveCircle(onJointChangeWhole),
  }).current;

  const handleAnim = (mode, sameModeContinue = false) => {
    // if same mode clicked, stop. else start new mode
    const next = (mode === activeAnim && !sameModeContinue) ? null : mode;

    // stop current
    animationHandleMap[activeAnim]?.stop();

    // set new active mode
    setActiveAnim(next);

    // start new mode
    if (next === "target"){
      animationHandleMap[next]?.start(joints, target);
    } else if (next === "sequence") {
      animationHandleMap[next]?.start(joints, sequenceList, isLoop);
    } else {
      animationHandleMap[next]?.start(joints);
    }
  };

  const handleManualMove = useRef(moveManual(onJointChangeWhole)).current;

  const handleManualMoveStart = (moveField, isAdd) => {
    handleManualMove.start(joints, moveField, isAdd);
    setActiveAnim("manual");
  }

  const handleManualMoveStop = () => {
    handleManualMove.stop();
    setActiveAnim(null);
  }
  const endEffector = endEffectorPose(joints);

  const axisMap  = { X: "z", Y: "x", Z: "y" };

  const jointsInfo = [
    { label: "Joint 1 — Base yaw",    min: -180, max: 180, index: 0 },
    { label: "Joint 2 — Arm pitch",   min: -90,  max: 90,  index: 1 },
    { label: "Joint 3 — Arm pitch",   min: -115, max: 115, index: 2 },
    { label: "Joint 4 — Elbow roll",  min: -180, max: 180, index: 3 },
    { label: "Joint 5 — Wrist pitch", min: -115, max: 115, index: 4 },
    { label: "Joint 6 — Wrist roll",  min: -180, max: 180, index: 5 },
  ];

  const anims = [
    { id: "origin",   label: "Origin"  },
    { id: "target",   label: "Target"  },
    { id: "circle",   label: "Circle"  },
    { id: "sequence", label: "Sequence"},
  ];

  const EndPointPanel = (
    <div className="flex flex-col px-4 mt-3">
        <div className="flex gap-3 justify-between items-center">
          <div className="flex flex-col gap-3">
            {["X", "Y", "Z"].map((axis) => {
              const adjustAxis = axisMap[axis];

              const value = (Math.round((endEffector[adjustAxis] ?? 0) * 1000) / 1000).toFixed(3);

              return (
              <div key={axis} className="flex items-center justify-between text-s">
                <span className="text-slate-400 mr-2">{axis}</span>

                <button
                  disabled={isAnimating}
                  className={`w-8 h-8 flex items-center justify-center rounded bg-slate-700 text-slate-100 ${isAnimating?"":"hover:bg-slate-600 active:bg-slate-500"}`}
                  onPointerDown={() => handleManualMoveStart(adjustAxis, false)}
                  onPointerUp={handleManualMoveStop}
                  onPointerLeave={handleManualMoveStop}
                >
                  -
                </button>

                <span className="font-mono text-slate-100 w-15 text-right">
                  {value}
                </span>

                <button
                  disabled={isAnimating}
                  className={`w-8 h-8 ml-1 flex items-center justify-center rounded bg-slate-700 text-slate-100 ${isAnimating?"":"hover:bg-slate-600 active:bg-slate-500"}`}
                  onPointerDown={() => handleManualMoveStart(adjustAxis, true)}
                  onPointerUp={handleManualMoveStop}
                  onPointerLeave={handleManualMoveStop}
                >
                  +
                </button>

              </div>
              )}
            )}
          </div>

            <div className="flex flex-col gap-3">
            {["Roll", "Pitch", "Yaw"].map((axis) => {
              const adjustAxis = axis.toLowerCase();
              const deg = (Math.round(radToDeg(endEffector[adjustAxis] ?? 0) * 100) / 100).toFixed(2);

              return (
              <div key={axis} className="flex items-center justify-between text-s">
                <span className="text-slate-400 w-8 mr-2">{axis}</span>

                <button
                  disabled={isAnimating}
                  className={`w-8 h-8 flex items-center justify-center rounded bg-slate-700 text-slate-100 ${isAnimating?"":"hover:bg-slate-600 active:bg-slate-500"}`}
                  onPointerDown={() => handleManualMoveStart(adjustAxis, false)}
                  onPointerUp={handleManualMoveStop}
                  onPointerLeave={handleManualMoveStop}
                >
                  -
                </button>

                <span className="font-mono text-slate-100 w-19 text-right">
                  {deg}°
                </span>

                <button
                  disabled={isAnimating}
                  className={`w-8 h-8 flex items-center justify-center rounded bg-slate-700 text-slate-100 ${isAnimating?"":"hover:bg-slate-600 active:bg-slate-500"}`}
                  onPointerDown={() => handleManualMoveStart(adjustAxis, true)}
                  onPointerUp={handleManualMoveStop}
                  onPointerLeave={handleManualMoveStop}
                >
                  +
                </button>
              </div>
            );
            })}
          </div>
        </div>
    </div>
  );

  const JointsPanel = (
    <div className="flex flex-col px-2 mt-3">
      {jointsInfo.map(({ label, min, max, index }) => (
        <JointSlider
          key={index} label={label}
          value={radToDeg(joints[index])}
          min={min} max={max}
          disabled={isAnimating}
          onChange={(v) => handleJ(index, v)}
        />
      ))}
    </div>
  );

  const ControlPanel = (
    <div className="flex flex-col gap-3 px-4 mt-1">
      {/* target inputs */}
      <div>
        <p className="text-[10px] text-slate-500 tracking-wider mb-2 font-medium uppercase">Target</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {[
            { display: "X",     field: axisMap["X"],    unit: "" },
            { display: "Roll",  field: "roll",          unit: "°" },
            { display: "Y",     field: axisMap["Y"],    unit: "" },
            { display: "Pitch", field: "pitch",         unit: "°" },
            { display: "Z",     field: axisMap["Z"],    unit: "" },
            { display: "Yaw",   field: "yaw",           unit: "°" },
          ].map(({ display, field, unit }) => (
            <div key={display} className="flex items-center gap-1.5 px-2 py-0.5">
              <span className="text-slate-400 text-xs w-8 shrink-0">{display}</span>

              <input
                type="number"
                value={target[field]}
                onChange={(e) => handleTargetChange(field, parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAnim("target", true); }}
                className="w-full bg-slate-800/30 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-100 text-right text-xs focus:outline-none focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none appearance-none"
              />
              {unit && <span className="text-slate-500 text-xs">{unit}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* anim buttons */}
      <div>
        <p className="text-[10px] text-slate-500 tracking-wider mb-2 font-medium uppercase">Action</p>
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          {anims.map(({ id, label }) => (
            <AnimBtn key={id} label={label} active={activeAnim === id} onClick={() => handleAnim(id)} />
          ))}
        </div>
        <AnimBtn label="Stop" active={!activeAnim} onClick={() => handleAnim(null)} stop />
      </div>
    </div>
  );

  const panelContent = {
    endpoint: EndPointPanel,
    joints:   JointsPanel,
    control:  ControlPanel,
    sequence: <SequencePanelMobile
                sequenceList={sequenceList}
                setSequenceList={setSequenceList}
                isLoop={isLoop}
                setIsLoop={setIsLoop}
              />,
  };

  return (
    <div className="relative w-full select-none rounded-lg">
      <TabBar active={activeTab} onChange={setActiveTab} />
      {showMobilePanel && panelContent[activeTab]}
    </div>
  );
};

export default RobotControlMobile;
