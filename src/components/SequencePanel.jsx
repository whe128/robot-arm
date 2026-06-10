
const axisMap = {
      X: "z",
      Y: "x",
      Z: "y",
      Roll: "roll",
      Pitch: "pitch",
      Yaw: "yaw"
};
const poseFields = ["X", "Y", "Z", "Roll", "Pitch", "Yaw"];
const templateSequence =[
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
  ];

const SequencePanel = ({
  sequenceList,
  setSequenceList,
  setShowSequence,
  isLoop,
  setIsLoop,
}) => {


  const addSequence = () => {
    setSequenceList(prev => {
      const last = prev[prev.length - 1];

      return [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: last?.x ?? 0,
          y: last?.y ?? 0.30,
          z: last?.z ?? 0.25,
          roll: last?.roll ?? 0,
          pitch: last?.pitch ?? 0,
          yaw: last?.yaw ?? 0
        }
      ];
    });
  };


  const removeSequence = (id) => {
    setSequenceList(prev => prev.filter(seq => seq.id !== id));
  };

  const updateSequence = (id, field, value) => {
    setSequenceList(prev =>
      prev.map(seq =>
        seq.id === id
          ? {
              ...seq,
              [field]: value,
            }
          : seq
      )
    );
  };



  return (
    <div className="relative w-[440px] bg-slate-900 border border-slate-700 rounded p-2 select-none">
      <button
        onClick={() => setShowSequence(v => !v)}
        className="absolute top-1 left-1 text-xs px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 hover:border-blue-500"
        >
        {"<"}
      </button>

      <button
        onClick={() => setSequenceList(templateSequence)}
        className="absolute top-1 left-60 text-xs px-3 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 hover:border-blue-500"
        >
        {"Template"}
      </button>

      <label className="absolute right-8 flex items-center gap-2 text-xs text-slate-400 mb-2">
        <input
          type="checkbox"
          checked={isLoop}
          onChange={(e) => setIsLoop(e.target.checked)}
          className="w-3 h-3 accent-blue-500"
        />
        Loop
      </label>

      <div className="text-xs text-slate-400 mb-2 px-10">
        SEQUENCE
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-0 text-xs text-slate-500">
          <span className="w-10 text-slate-400">#</span>
          <span className="w-15 text-center text-slate-400"> X </span>
          <span className="w-15 text-center text-slate-400"> Y </span>
          <span className="w-15 text-center text-slate-400"> Z </span>
          <span className="w-15 text-center text-slate-400"> Roll ° </span>
          <span className="w-15 text-center text-slate-400"> Pitch ° </span>
          <span className="w-15 text-center text-slate-400"> Yaw ° </span>

          <span className="w-9"></span>
        </div>

        {sequenceList.map((seq, index) => (
          <div
            key={seq.id}
            className="flex items-center gap-1 text-xs"
          >
            <span className="w-6 text-slate-400">
              #{index + 1}
            </span>

            {poseFields.map((field) => {
              const adjustAxis = axisMap[field] || field;

              return(
              <input
                key={`${seq.id}-${field}`}
                type="number"
                value={seq[adjustAxis]}
                onChange={(e) =>
                  updateSequence(
                    seq.id,
                    adjustAxis,
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-slate-100 text-right text-xs focus:outline-none focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none appearance-none"/>
            )})}

            <button
              onClick={() => removeSequence(seq.id)}
              className="px-2 py-0.5 rounded bg-red-900/40 border border-red-700"
            >
              🗑️
            </button>
          </div>
        ))}

        <button
          onClick={addSequence}
          className="w-1/2 mx-auto block py-1 rounded border border-slate-600 bg-slate-800 text-xs hover:border-blue-500 mt-2"
        >
          Add Sequence
        </button>
        {sequenceList.length > 0 && (
          <button
            onClick={() => setSequenceList([])}
            className="absolute bottom-2 right-2 px-3 py-1 rounded border border-red-700 bg-red-900/30 text-xs text-red-300 hover:border-red-500"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}


const SequencePanelMobile = ({
  sequenceList,
  setSequenceList,
  isLoop,
  setIsLoop,
}) => {


  const addSequence = () => {
    setSequenceList(prev => {
      const last = prev[prev.length - 1];

      return [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: last?.x ?? 0,
          y: last?.y ?? 0.30,
          z: last?.z ?? 0.25,
          roll: last?.roll ?? 0,
          pitch: last?.pitch ?? 0,
          yaw: last?.yaw ?? 0
        }
      ];
    });
  };


  const removeSequence = (id) => {
    setSequenceList(prev => prev.filter(seq => seq.id !== id));
  };

  const updateSequence = (id, field, value) => {
    setSequenceList(prev =>
      prev.map(seq =>
        seq.id === id
          ? {
              ...seq,
              [field]: value,
            }
          : seq
      )
    );
  };



  return (
    <div className="relative w-full rounded select-none mt-2">
      <button
        onClick={() => setSequenceList(templateSequence)}
        className="absolute bottom-0 left-2 text-xs px-3 py-1 bg-slate-800/30 border border-slate-700 rounded text-slate-300 hover:border-blue-500"
        >
        {"Template"}
      </button>

      <label className="absolute -top-1 right-2 flex items-center gap-1 text-xs text-slate-400 mb-2">
        <input
          type="checkbox"
          checked={isLoop}
          onChange={(e) => setIsLoop(e.target.checked)}
          className="w-4 h-4 accent-blue-500"
        />
        Loop
      </label>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center text-xs text-slate-500">
          <span className="w-6 text-slate-400">#</span>
          <span className="w-10 text-center text-slate-400"> X </span>
          <span className="w-15 text-center text-slate-400"> Y </span>
          <span className="w-15 text-center text-slate-400"> Z </span>
          <span className="w-13 text-center text-slate-400"> Roll ° </span>
          <span className="w-14 text-center text-slate-400"> Pitch ° </span>
          <span className="w-13 text-center text-slate-400"> Yaw ° </span>
        </div>

        {sequenceList.map((seq, index) => (
          <div
            key={seq.id}
            className="flex items-center text-xs"
          >
            <span className="w-3 text-slate-400">
              {index + 1}
            </span>

            {poseFields.map((field) => {
              const adjustAxis = axisMap[field] || field;

              return(
              <input
                key={`${seq.id}-${field}`}
                type="number"
                value={seq[adjustAxis]}
                onChange={(e) =>
                  updateSequence(
                    seq.id,
                    adjustAxis,
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-14 bg-slate-800/60 py-0.5 px-1 font-mono  border-0 border-x border-slate-700 text-slate-100 text-right text-xs focus:outline-none focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none appearance-none"/>
            )})}

            <button
              onClick={() => removeSequence(seq.id)}
              className="px-2 py-0.5 rounded bg-red-900/40 border border-red-700 ml-3"
            >
              X
            </button>
          </div>
        ))}

        <button
          onClick={addSequence}
          className="w-1/3 mx-auto block py-1 rounded border border-slate-600 bg-slate-800/30 text-xs hover:border-blue-500 mt-2"
        >
          Add
        </button>

        {sequenceList.length > 0 && (
          <button
            onClick={() => setSequenceList([])}
            className="absolute bottom-0 right-2 px-2 py-1 rounded border border-red-700 bg-red-900/30 text-xs text-red-300 hover:border-red-500"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export { SequencePanel, SequencePanelMobile };
