import { useState, useCallback } from "react";

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

const JointSlider = ({ label, value, min, max, onChange }) => {
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
          onChange(e.target.value)
        }
      }
        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

const AnimBtn = ({ label, active, stop, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left py-1.5 px-2.5 text-xs rounded-md border transition-colors duration-150
        ${active
          ? "bg-slate-800 border-slate-600 text-slate-100"
          : "bg-transparent border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700"
        }
        ${stop && !active ? "text-slate-400" : ""}
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
  onJointReset,
  onJointClear,
  onAnimation,
  endEffector = { x: 0, y: 0, z: 0 }
}) => {

  // degree state for sliders

  const [activeAnim, setActiveAnim] = useState(null);


  const handleJ = (index, v) => {
    const deg = parseFloat(v);
    onJointChangeSingle?.(index, degToRad(deg));
  };

  const handleAnim = useCallback((mode) => {
    const next = activeAnim === mode ? null : mode;
    setActiveAnim(next);
    onAnimation?.(next);
  }, [activeAnim, onAnimation]);

  const anims = [
    { id: "wave",  label: "Wave" },
    { id: "sweep", label: "Sweep" },
    { id: "dance", label: "Dance" },
  ];

  const jointsInfo = [
    { label: "Joint 1 — Base yaw",    min: -180,  max: 180, index: 0},
    { label: "Joint 2 — Arm pitch",   min: -90,   max: 90,  index: 1},
    { label: "Joint 3 — Arm pitch",   min: -115,  max: 115, index: 2},
    { label: "Joint 4 — Elbow roll", min: -180,  max: 180, index: 3},
    { label: "Joint 5 — Wrist pitch", min: -115,  max: 115, index: 4},
    { label: "Joint 6 — Wrist roll",  min: -180,  max: 180, index: 5},
  ];

  const buttonInfo = [
    { label: "Reset Joints", onClick: onJointReset },
    { label: "Clear Joints", onClick: onJointClear },
  ];

  return (
    <div className="flex flex-col gap-3 w-[280px]">

      {/* End Effector */}
      <Panel title="END POINT">
        <div className="flex gap-18">
          <div className="flex flex-col gap-1 w-1/2">
            {["X", "Y", "Z"].map((axis) => (
              <div key={axis} className="flex justify-between text-xs">
                <span className="text-slate-400">{axis}</span>
                <span className="font-mono text-slate-100">
                  {(endEffector[axis] ?? 0).toFixed(3)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 w-1/2">
            {["Roll", "Pitch", "Yaw"].map((axis) => (
              <div key={axis} className="flex justify-between text-xs">
                <span className="text-slate-400">{axis}</span>
                <span className="font-mono text-slate-100">
                  {(endEffector[axis] ?? 0).toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Joint Control */}
      <Panel title="JOINT">
        {
          jointsInfo.map(({ label, min, max, index }) => (
            <JointSlider
              key={index}
              label={label}
              value={radToDeg(joints[index])}
              min={min}
              max={max}
              onChange={(v) => handleJ(index, v)}
            />
          ))
        }
      </Panel>

      {/* Animation */}
      <Panel title="CONTROL">
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
          />
        </div>
      </Panel>
    </div>
  );
}


export default RobotControl;
