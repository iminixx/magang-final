import React from "react";
import { X } from "lucide-react";

const JurusanFilter = ({
  selectedJurusan,
  onJurusanChange,
  className = "",
  placeholder = "Pilih jurusan...",
  showClearButton = true,
}) => {
  const jurusanOptions = ["RPL", "DKV", "TKJ"];

  const handleClear = () => {
    onJurusanChange("");
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedJurusan}
        onChange={(e) => onJurusanChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none pr-10"
      >
        <option value="">{placeholder}</option>
        {jurusanOptions.map((jurusan) => (
          <option key={jurusan} value={jurusan}>
            {jurusan}
          </option>
        ))}
      </select>

      {/* Clear button */}
      {showClearButton && selectedJurusan && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Dropdown arrow */}
      {(!showClearButton || !selectedJurusan) && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default JurusanFilter;
