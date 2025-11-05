import React from 'react';

const DeadlineCard = ({ 
  dueIn, 
  title, 
  lastUpdated, 
  onClick,
  assignmentId 
}) => {
  
  // Format last updated string
  const formatLastUpdated = (dateString) => {
    if (!dateString) return "Recently updated";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `Updated ${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div 
      className="bg-gray-50 rounded-lg p-4 mb-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => onClick(assignmentId)} // Send assignmentId on click
    >
      <div className="flex-1">
        <div className="text-[var(--deakinTeal)] text-sm font-medium mb-1">{dueIn}</div>
        <div className="text-gray-800 font-semibold text-base mb-1">{title}</div>
        <div className="text-gray-500 text-sm">{formatLastUpdated(lastUpdated)}</div>
      </div>
      <div className="text-gray-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
      </div>
    </div>
  );
};

export default DeadlineCard;