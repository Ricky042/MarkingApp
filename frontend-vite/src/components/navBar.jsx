import React, { useEffect, useState } from "react";

/**
 * Responsive NavBar
 * - Matches your provided layout on desktop (avatar initials "CE", name, hamburger icon, search pill)
 * - Collapses on mobile with a Menu button that toggles a slide-down panel
 * - Accessible (aria-labels, roles, focus rings, ESC to close menu)
 * - TailwindCSS only; no external UI libs required
 */
export default function NavBar() {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState("");

  // Close menu on ESC
    useEffect(() => {
        const onKey = (e) => {
        if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []
    );
 
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            console.log(user.username);
            console.log(user.id);
            setUsername(user.username);
        }
    }, [])

    return (
        <header className="w-full bg-white/90 backdrop-blur border-b border-slate-200">
        {/* Top bar */}
        <div className="px-4 w-full">
            <div className="h-16 flex items-center justify-between">
            {/* Menu Button */}
            <div className="flex-shrink-1 flex items-center gap-3 min-w-0">
                <button
                    aria-label={open ? "Close menu" : "Open menu"}
                    onClick={() => setOpen((v) => !v)}
                >
                <span className="sr-only">Menu</span>
                <img
                    src="/navBarIcon/navBar_threeLinesIcon.svg"
                    alt="Menu Icon"
                    className="h-6 w-6"
                />
                </button>
                <div className="relative w-8 h-8 shrink-0">
                    {/*<div className="absolute inset-0 rounded-full bg-slate-200" />*/}
                    <img
                        src="/navBarIcon/navBar_Ellipse 1.svg"
                        alt="User Avatar"
                        className="h-8 w-8"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-slate-900 text-[10px] leading-none font-normal font-['Inter'] tracking-wide select-none">
                            {username ? username.charAt(0).toUpperCase() : ""}
                        </span>
                    </div>
                </div>
                <span className="text-slate-900
                                text-sm
                                font-semibold
                                font-['Inter']
                                leading-normal">
                    {username}
                </span>
            </div>

            {/* Search */}
            <div className="flex-grow flex max-w-md">
                <div className="w-full min-h-8 px-3 py-1.5 bg-neutral-100 rounded-lg flex items-center gap-1.5 ring-1 ring-inset ring-neutral-200 focus-within:ring-slate-400">
                <img
                    src="/navBarIcon/navBar_searchIcon.svg"
                    alt="Menu Icon"
                    className="h-6 w-6"
                />
                <input
                    className="bg-transparent outline-none placeholder-zinc-500 text-sm w-full"
                    placeholder="Search"
                    aria-label="Search"
                />
                </div>
            </div>
            </div>
        </div>
        </header>
    );
}
