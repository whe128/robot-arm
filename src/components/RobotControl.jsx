import { useState, useRef } from "react";
import { moveToTarget, moveToOrigin, moveWave, moveSweep, moveDance, moveSequence, moveManual, moveCircle } from "@/animation/animation";
import { endEffectorPose } from "@/kinematics/kinematics";


const Panel = ({ title, children }) => {
  return (
    <div className="bg-slate-900 rounded-md border border-slate-800 p-3">
      <div className="text-[11px] text-slate-500 tracking-wider mb-2.5 font-medium">
        {title}
      </div>
      {children}
    </div>
  );
}

const JointSlider = ({ label, value, min, max, onChange, disabled }) => {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-medium">{value.toFixed(2)}°</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={0.01}
        value={(Math.round(value * 100) / 100).toFixed(2)}
        onChange={(e) => {
          if (disabled) return;
          onChange(e.target.value)
        }
      }
      className={`
        w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500
        ${disabled ? "pointer-events-none" : ""}
      `}
      />
    </div>
  );
}

const AnimBtn = ({ label, active, onClick, stop = false }) => {
  return (
    <button
      onClick={onClick}

      className={`
        w-full py-1.5 px-2.5 text-xs rounded-md border transition-colors duration-150
        ${active
          ? "bg-slate-800 border-slate-600 text-slate-100"
          : "bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700"
        }
        ${stop ? "text-center":"text-left"}
      `}
    >
      <span className="inline-block w-3 mr-1 text-[10px]">
        {stop ? "■" : "▶"}
      </span>
      {label}
    </button>
  );
}

const degToRad = deg => deg * (Math.PI / 180);
const radToDeg = rad => rad * (180 / Math.PI);

const RobotControl = ({
  joints,
  onJointChangeSingle,
  onJointChangeWhole,
  showSequence,
  setShowSequence,
  sequenceList,
  isLoop,
  setIsTracing,
  handleClearTrace
}) => {

  // degree state for sliders

  const [activeAnim, setActiveAnim] = useState(null);
  const lastActiveAnim = useRef(null);
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
    setIsTracing(true)
  };

  const handleTargetChange = (axis, value) => {
    const next = { ...target, [axis]: value };
    setTarget(next);
  };

  const onStop = () => setActiveAnim(null);

  const animationHandleMap = useRef({
    target: moveToTarget(onJointChangeWhole, onStop),
    origin: moveToOrigin(onJointChangeWhole, onStop),
    wave: moveWave(onJointChangeWhole),
    sweep: moveSweep(onJointChangeWhole),
    dance: moveDance(onJointChangeWhole),
    sequence: moveSequence(onJointChangeWhole, onStop, setIsTracing),
    circle: moveCircle(onJointChangeWhole, setIsTracing),
  }).current;

  const handleAnim = (mode, sameModeContinue = false) => {
    // if same mode clicked, stop. else start new mode
    const next = (mode === activeAnim && !sameModeContinue) ? null : mode;

    // stop current
    animationHandleMap[activeAnim]?.stop();

    // set new active mode
    setActiveAnim(next);

    if (next) {
      if (lastActiveAnim.current && lastActiveAnim.current !== next) {
        handleClearTrace();
      }
      lastActiveAnim.current = next;
    }

    switch (next) {
      case "target":
        setIsTracing(true);
        animationHandleMap[next]?.start(joints, target);
        break;
      case "sequence":
        animationHandleMap[next]?.start(joints, sequenceList, isLoop);
        break;
      case "circle":
        animationHandleMap[next]?.start(joints);
        break;
      case "origin":
        setIsTracing(false);
        animationHandleMap[next]?.start(joints);
        break;
      default:
    }
  };

  const handleManualMove = useRef(moveManual(onJointChangeWhole)).current;

  const handleManualMoveStart = (moveField, isAdd) => {
    if (activeAnim && activeAnim !== "manual") {
      return;
    }

    animationHandleMap[activeAnim]?.stop();

    if (activeAnim) {
      if (lastActiveAnim.current && lastActiveAnim.current !== next) {
        handleClearTrace();
      }
      lastActiveAnim.current = activeAnim;
    }

    setActiveAnim("manual");
    handleManualMove.start(joints, moveField, isAdd);
    setIsTracing(true);
  }

  const handleManualMoveStop = () => {
    if (activeAnim !== "manual") {
      return;
    }
    handleManualMove.stop();
    setActiveAnim(null);
  }

  const endEffector = endEffectorPose(joints);

  const anims = [
    { id: "origin",     label: "Origin" },
    { id: "target",     label: "Target" },
    { id: "circle",     label: "Circle" },
    { id: "sequence",   label: "Sequence"},
  ];

  const jointsInfo = [
    { label: "Joint 1 — Base yaw",    min: -180,  max: 180, index: 0},
    { label: "Joint 2 — Arm pitch",   min: -90,   max: 90,  index: 1},
    { label: "Joint 3 — Arm pitch",   min: -115,  max: 115, index: 2},
    { label: "Joint 4 — Elbow roll",  min: -180,  max: 180, index: 3},
    { label: "Joint 5 — Wrist pitch", min: -115,  max: 115, index: 4},
    { label: "Joint 6 — Wrist roll",  min: -180,  max: 180, index: 5},
  ];

  const axisMap = {
      X: "z",
      Y: "x",
      Z: "y",
    };

  return (
    <div className="flex flex-col relative gap-2 w-[280px] select-none">

      {/* End Effector */}
      <Panel title="END_POINT">
        <div className="flex gap-3 justify-between items-center">
          <div className="flex flex-col gap-1">
            {["X", "Y", "Z"].map((axis) => {
              const adjustAxis = axisMap[axis];

              const value = (Math.round((endEffector[adjustAxis] ?? 0) * 1000) / 1000).toFixed(3);

              return (
              <div key={axis} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 mr-2">{axis}</span>

                <button
                  disabled={isAnimating}
                  className={`w-5 h-5 flex items-center justify-center rounded bg-slate-700 text-slate-100 ${isAnimating?"":"hover:bg-slate-600 active:bg-slate-500"}`}
                  onPointerDown={() => handleManualMoveStart(adjustAxis, false)}
                  onPointerUp={handleManualMoveStop}
                  onPointerLeave={handleManualMoveStop}
                >
                  -
                </button>

                <span className="font-mono text-slate-100 w-11 text-right">
                  {value}
                </span>

                <button
                  disabled={isAnimating}
                  className={`w-5 h-5 ml-1 flex items-center justify-center rounded bg-slate-700 text-slate-100 ${isAnimating?"":"hover:bg-slate-600 active:bg-slate-500"}`}
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

          <div className="flex flex-col gap-1">
            {["Roll", "Pitch", "Yaw"].map((axis) => {
              const adjustAxis = axis.toLowerCase();
              const deg = (Math.round(radToDeg(endEffector[adjustAxis] ?? 0) * 100) / 100).toFixed(2);

              return (
              <div key={axis} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 w-7 mr-2">{axis}</span>

                <button
                  disabled={isAnimating}
                  className={`w-5 h-5 flex items-center justify-center rounded bg-slate-700 text-slate-100 ${isAnimating?"":"hover:bg-slate-600 active:bg-slate-500"}`}
                  onPointerDown={() => handleManualMoveStart(adjustAxis, false)}
                  onPointerUp={handleManualMoveStop}
                  onPointerLeave={handleManualMoveStop}
                >
                  -
                </button>

                <span className="font-mono text-slate-100 w-15 text-right">
                  {deg}°
                </span>

                <button
                  disabled={isAnimating}
                  className={`w-5 h-5 flex items-center justify-center rounded bg-slate-700 text-slate-100 ${isAnimating?"":"hover:bg-slate-600 active:bg-slate-500"}`}
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
      </Panel>


      {/* Joint Control */}
      <Panel>
        {
          jointsInfo.map(({ label, min, max, index }) => (
            <JointSlider
              key={index}
              label={label}
              value={radToDeg(joints[index])}
              min={min}
              max={max}
              disabled={isAnimating}
              onChange={(v) => handleJ(index, v)}
            />
          ))
        }
      </Panel>

      {/* Animation */}
      <Panel title="CONTROL">
        <div className = "relative">
          <div className="flex gap-10 mb-3">
            <div className="flex flex-col gap-1 w-1/2">
              {["X", "Y", "Z"].map((axis) => {
                const adjustAxis = axisMap[axis];

                return (
                  <div key={axis} className="flex items-center gap-8 flex-1">
                    <span className="text-slate-400 text-xs">{axis}</span>
                    <input
                      type="number"
                      step="0.1"
                      value={target[adjustAxis]}
                      onChange={(e) => handleTargetChange(adjustAxis, parseFloat(e.target.value) || 0)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAnim("target", true);
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-100 text-right text-xs focus:outline-none focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none appearance-none"/>
                  </div>
              )})}
            </div>

            <div className="flex flex-col gap-1 w-1/2">
              {["Roll", "Pitch", "Yaw"].map((axis) => {
                const adjustAxis = axis.toLowerCase();

              return (
                <div key={axis} className="flex items-center gap-1 flex-1">
                  <span className="w-13 text-slate-400 text-xs">{axis}</span>
                  <input
                    type="number"
                    step="1"
                    value={target[adjustAxis]}
                    onChange={(e) => handleTargetChange(adjustAxis, parseFloat(e.target.value || 0))}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAnim("target", true);
                        }
                      }}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-100 text-right text-xs focus:outline-none focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none appearance-none"/>
                  <span className="text-slate-400 text-xs">°</span>
                </div>
              )})}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-2">
              {anims.map(({ id, label }) => (
                <AnimBtn
                  key={id}
                  label={label}
                  active={activeAnim === id}
                  onClick={() => handleAnim(id)}
                />
              ))}
            </div>
            <AnimBtn
              label="Stop"
              active={!activeAnim}
              onClick={() => handleAnim(null)}
              stop = {true}
            />
          </div>

          <button
            onClick={() => setShowSequence(v => !v)}
            className="absolute -top-8 right-2 text-xs px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 hover:border-blue-500"
          >
            {showSequence ? "Sequence_List <" : "Sequence_List >"}
          </button>

        </div>
      </Panel>
    </div>
  );
}


export default RobotControl;
