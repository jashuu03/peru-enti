import React from 'react';

const ProgressBar = ({ progress, className = '', showText = true }) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 p-[1px]">
        <div
          className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {showText && (
        <div className="flex justify-between text-xs font-semibold text-gray-400 px-1">
          <span>Uploading...</span>
          <span className="text-indigo-400">{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
