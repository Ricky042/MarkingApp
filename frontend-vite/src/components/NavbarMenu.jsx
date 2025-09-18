// NavbarMenu.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function MenuItem({ menuOpen, onClose, assignmentName, assignmentSemester }) {
  const navigate = useNavigate();
  const { teamId, assignmentId } = useParams();

    // Close menu on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (menuOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, onClose]);
  console.log(assignmentName);


  return (<>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Side menu"
        className={`fixed top-16 left-56 z-40
                    w-56 min-h-[calc(100dvh-4rem)] bg-white p-4 font-['Inter'] shadow-lg
                    flex justify-center
                    transition-transform duration-300 ease-out
                    ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
      <div className = "px-3 pt-3.5 pb-2 bg-white flex-col justify-start items-start gap-6">
          Semester {assignmentSemester}
        <div className = "justify-start text-offical-black text-xl font-medium font-['Inter'] leading-normal">
          {assignmentName}
        </div>
        <div
          className="absolute bottom-250 w-16 h-9 justify-start text-offical-black text-sm font-normal font-['Inter'] leading-7
          cursor-pointer underline underline-offset-4"
          onClick={() => navigate(`/team/${teamId}/assignments/${assignmentId}/assignmentmarkers`)}
        >
          Makers
        </div>
        <div className="absolute bottom-12 px-2 text-xs text-gray-500 flex items-center gap-1">
            Press
            <span className="px-2 py-0.5 bg-gray-200 rounded border border-gray-300 text-gray-700 font-mono text-xs">
                ESC
            </span>
            to close
        </div>
      </div>
      </div>
    </>
  );
}
