import React from 'react';

const DashboardCard = ({ 
  title, 
  value, 
  className = "" 
}) => {
  return (
    <div className={`w-full bg-white rounded-lg px-8 py-15 flex flex-col justify-center items-start gap-3 ${className}`}>
      <div className="text-[var(--deakinTeal)] text-4xl font-md font-['Inter'] leading-7">{value}</div>
      <div className="text-zinc-600 text-lg font-semibold font-['Inter'] leading-7">{title}</div>
    </div>
  );
};

export default DashboardCard;
