import { useState, useRef } from "react";
import { moveToOrigin, moveWave, moveSweep, moveDance } from "@/animation/animation";

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
    <div className="mb-2.5 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-medium">{value.toFixed(2)}°</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={0.01}
        value={value}
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

const NumInput = ({ label, value, onChange }) => {
  return (
    <div className="flex justify-between items-center text-xs mb-1.5 last:mb-0">
      <span className="text-slate-400 w-6">{label}</span>
      <input
        type="number"
        step={0.001}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-28 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 font-mono text-slate-100 text-right focus:outline-none focus:border-blue-500"
      />
    </div>
  );
};

const AnimBtn = ({ label, active, onClick, stop = false }) => {
  return (
    <button
      onClick={onClick}

      className={`
        w-full text-left py-1.5 px-2.5 text-xs rounded-md border transition-colors duration-150
        ${active
          ? "bg-slate-800 border-slate-600 text-slate-100"
          : "bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700"
        }
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
  endEffector = { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 }
}) => {

  // degree state for sliders

  const [activeAnim, setActiveAnim] = useState(null);
  const isAnimating = activeAnim !== null;

  const [target, setTarget] = useState({ x: 0.3, y: 0, z: 0.3 });


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
    origin: moveToOrigin(onJointChangeWhole, onStop),
    wave: moveWave(onJointChangeWhole),
    sweep: moveSweep(onJointChangeWhole),
    dance: moveDance(onJointChangeWhole),
  }).current;

  const handleAnim = (mode) => {
    // if same mode clicked, stop. else start new mode
    const next = mode === activeAnim ? null : mode;

    // stop current
    animationHandleMap[activeAnim]?.stop();

    // set new active mode
    setActiveAnim(next);

    // start new mode
    animationHandleMap[next]?.start(joints);

  };

  const anims = [
    { id: "target",   label: "Move to Target" },
    { id: "origin",   label: "Move to Origin" },
    { id: "wave",     label: "Wave" },
    { id: "sweep",    label: "Sweep" },
    { id: "dance",    label: "Dance" },
  ];

  const jointsInfo = [
    { label: "Joint 1 — Base yaw",    min: -180,  max: 180, index: 0},
    { label: "Joint 2 — Arm pitch",   min: -90,   max: 90,  index: 1},
    { label: "Joint 3 — Arm pitch",   min: -115,  max: 115, index: 2},
    { label: "Joint 4 — Elbow roll",  min: -180,  max: 180, index: 3},
    { label: "Joint 5 — Wrist pitch", min: -115,  max: 115, index: 4},
    { label: "Joint 6 — Wrist roll",  min: -180,  max: 180, index: 5},
  ];


  return (
    <div className="flex flex-col gap-3 w-[280px]">

      {/* End Effector */}
      <Panel title="END POINT">
        <div className="flex gap-18">
          <div className="flex flex-col gap-1 w-1/2">
            {["X", "Y", "Z"].map((axis) => {
              const axisMap = {
                X: "z",
                Y: "x",
                Z: "y",
              };
              const key = axisMap[axis];

              return (
              <div key={axis} className="flex justify-between text-xs">
                <span className="text-slate-400">{axis}</span>
                <span className="font-mono text-slate-100">
                  {(endEffector[key] ?? 0).toFixed(3)}
                </span>
              </div>
            );
            })}
          </div>

          <div className="flex flex-col gap-1 w-1/2">
            {["Roll", "Pitch", "Yaw"].map((axis) => {
              const axisMap = {
                Roll: "yaw",
                Pitch: "roll",
                Yaw: "pitch"
              };
              const key = axisMap[axis];

              const deg = radToDeg(endEffector[key] ?? 0);

              return (
              <div key={axis} className="flex justify-between text-xs">
                <span className="text-slate-400">{axis}</span>
                <span className="font-mono text-slate-100">
                  {(deg ?? 0).toFixed(2)}°
                </span>
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
        <div className="flex gap-2 mb-2">
          {["X", "Y", "Z"].map((axis) => (
            <div key={axis} className="flex items-center gap-1 flex-1">
              <span className="text-slate-400 text-xs">{axis}</span>
              <input
                type="number"
                step={0.001}
                value={target[axis.toLowerCase()]}
                onChange={(e) => handleTargetChange(axis.toLowerCase(), parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-100 text-right text-xs focus:outline-none focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none appearance-none"              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {anims.map(({ id, label }) => (
            <AnimBtn
              key={id}
              label={label}
              active={activeAnim === id}
              onClick={() => handleAnim(id)}
            />
          ))}
          <AnimBtn
            label="Stop"
            active={!activeAnim}
            onClick={() => handleAnim(null)}
            stop = {true}
          />
        </div>
      </Panel>
    </div>
  );
}


export default RobotControl;
