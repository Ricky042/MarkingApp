import React from "react";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export default function AssignmentRow({
  title,
  updatedText,
  labelText,
  completedText,
  percentText,
  progressValue,
  flagsText,
  onViewDetails,
}) {
  return (
    <div className="flex flex-row items-center justify-between assignment-row w-full h-fit hover:bg-[#f8f8f8] rounded-lg px-4 py-4">
      <div>
        <div className="text-slate-900 text-sm">{title}</div>
        <div className="text-zinc-400 text-xs">{updatedText}</div>
      </div>
      <Label className="text-2xs font-light rounded-xl bg-white shadow-sm px-3 py-1">{labelText}</Label>
      <div>
        <div className="justify-between flex flex-row">
          <div className="text-xs text-zinc-400">{completedText}</div>
          <div className="text-xs text-zinc-400">{percentText}</div>
        </div>
        <Progress className="w-[196px]" value={progressValue} />
      </div>
      <div className="text-[var(--deakinTeal)] text-sm">{flagsText}</div>
      <button
        className="bg-[var(--deakinTeal)] text-white text-sm font-light rounded-lg px-4 py-2"
        onClick={onViewDetails}
      >
        <div>View Details</div>
      </button>
    </div>
  );
}


