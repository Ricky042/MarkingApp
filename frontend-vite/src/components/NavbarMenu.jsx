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
        className={`fixed top-16 left-56 z-40
                    w-56 min-h-[calc(100dvh-4rem)] bg-white p-6 font-['Inter'] shadow-lg
                    transition-transform duration-300 ease-out
                    ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="relative flex flex-col justify-start items-start gap-2">
          <div className="text-xs text-gray-500 leading-tight">Semester {assignmentSemester}</div>
          <div className="text-offical-black text-xl font-medium font-['Inter'] leading-tight">
            {assignmentName}
          </div>
          <div
            className="w-16 h-9 text-offical-black text-sm font-normal font-['Inter'] leading-tight
                      cursor-pointer underline underline-offset-4"
            onClick={() => navigate(`/team/${teamId}/assignments/${assignmentId}/assignmentmarkers`)}
          >
            Makers
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1">
            Press <span className="px-2 py-0.5 bg-gray-200 rounded border border-gray-300 text-gray-700 font-mono text-xs">ESC</span> to close
          </div>
        </div>
      </div>
    </>
  );
}
