import React from "react";

const MarkerCard = ({
  id,
  name,
  status,
  gradedCount,
  totalCount,
  percentage,
  deviation,
  flagsRaised,
  onRemove,
  onSendEmail
}) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "marking":
        return "bg-[var(--deakinTeal)] text-white";
      case "complete":
        return "bg-[var(--lime)] text-gray-800";
      case "moderating":
        return "bg-[var(--purple)] text-white";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-slate-200 px-6 pt-3.5 pb-4 hover:shadow-md transition cursor-pointer overflow-hidden">
      {/* Header with ID and Status */}
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-zinc-400 truncate max-w-[60%]" title={id}>
          {id}
        </div>
        <div
          className={`px-3 pt-1 pb-1 rounded-full text-xs font-base ${getStatusColor(
            status
          )}`}
        >
          <div className="justify-start text-xs font-medium font-['Inter'] leading-normal">{status.charAt(0) + status.slice(1).toLowerCase()}</div>
        </div>
      </div>

      {/* Profile and Details */}
      <div className="flex items-start gap-4 mb-4 min-w-0">
        {/* Profile Avatar */}
        <div className="w-12 h-12 bg-black rounded-full flex-shrink-0"></div>

        {/* Marker Details */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-offical-black text-2xl font-medium font-['Inter'] leading-7 mb-2 truncate"
            title={name}
          >
            {name}
          </h3>
          <div className="text-xs text-zinc-400 truncate mb-1">
            {gradedCount} / {totalCount} graded ({percentage}%)
          </div>
          <div className="text-xs text-zinc-400 truncate">
            Deviation: {deviation}↑
          </div>
        </div>
      </div>

      {/* Footer with Flags and Actions */}
      <div className="flex justify-between items-center mt-15">
        <div className="text-xs text-zinc-400 truncate">
          {flagsRaised} flags Raised
        </div>
        <div className="flex gap-4 flex-shrink-0 underline underline-offset-4 decoration-1 decoration-zinc-400">
          {/* <button
            onClick={onSendEmail}
            className="text-xs text-zinc-400 hover:text-deakinTeal cursor-pointer"
          >
            Send Email
          </button> */}
          <button
            onClick={onRemove}
            className="text-xs text-zinc-400 hover:text-deakinTeal cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkerCard;
