import React from "react";
import {UserCircle2Icon } from "lucide-react";

const Navbar = () => (
  <nav className="w-full fixed top-0 left-0 right-0 h-14 px-4 flex items-center justify-between z-50
    bg-slate-50/95 border-b border-blue-100 shadow-md
    dark:bg-darkPrimary dark:border-slate-800 transition-colors">
    {/* Logo and title */}
    <div className="flex items-center cursor-pointer select-none">
      <span className="ml-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white">
        EDRS{" "}
        <span
          className="bg-clip-text text-transparent text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600"
        >
          powered by AI
        </span>
      </span>
    </div>
    {/* Right side: user icon */}
    <div className="flex items-center gap-3 sm:gap-4">
   👤
    </div>
  </nav>
);

export default Navbar;