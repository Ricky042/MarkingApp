// NavbarMenu.jsx
import React, { useEffect, useState } from "react";

export default function MenuItem({ menuOpen, onClose }) {
    // Close menu on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (menuOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, onClose]);


  return (<>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Side menu"
        className={`fixed top-16 left-56 z-50
                    w-56 min-h-[calc(100dvh-4rem)] bg-white p-4 font-['Inter'] shadow-lg
                    flex justify-center
                    transition-transform duration-300 ease-out
                    ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        Menu
        <div className="absolute bottom-12 px-2 text-xs text-gray-500 flex items-center gap-1">
            Press
            <span className="px-2 py-0.5 bg-gray-200 rounded border border-gray-300 text-gray-700 font-mono text-xs">
                ESC
            </span>
            to close
        </div>
      </div>
    </>
  );
}
