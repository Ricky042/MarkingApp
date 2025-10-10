import React from 'react';

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
      case 'marking':
        return 'bg-[var(--deakinTeal)] text-white';
      case 'complete':
        return 'bg-[var(--lime)] text-gray-800';
      case 'moderating':
        return 'bg-[var(--purple)] text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6 pb-4">
      {/* Header with ID and Status */}
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-zinc-400 font-medium">{id}</div>
        <div className={`px-3 pt-1 pb-1 rounded-full text-xs font-base ${getStatusColor(status)}`}>
          {status}
        </div>
      </div>

      {/* Profile and Details */}
      <div className="flex items-start gap-4 mb-8">
        {/* Profile Avatar */}
        <div className="w-12 h-12 bg-black rounded-full flex-shrink-0"></div>
        
        {/* Marker Details */}
        <div className="flex-1">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">{name}</h3>
          <div className="text-sm text-zinc-400">
            {gradedCount} / {totalCount} graded ({percentage}%)
          </div>
          <div className="text-sm text-zinc-400">
            Deviation: {deviation}↑
          </div>
        </div>
      </div>

      {/* Footer with Flags and Actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-bold text-zinc-400">
          {flagsRaised} flags Raised
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onSendEmail}
            className="text-sm text-zinc-400 hover:text-deakinTeal underline cursor-pointer"
          >
            Send Email
          </button>
          <button 
            onClick={onRemove}
            className="text-sm text-zinc-400 hover:text-deakinTeal underline cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkerCard;
