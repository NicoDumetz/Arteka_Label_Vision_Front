// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : index.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Friday May 15 2026
//
// =============================================================

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "~/contexts/Auth";

interface GlobalHeaderProps {
  transparent?: boolean;
}

export function GlobalHeader({ transparent = false }: GlobalHeaderProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: "AI Models", path: "/global-models" },
  ];

  return (
    <header 
      className={`relative z-50 flex h-24 w-full shrink-0 items-center justify-between px-8 transition-colors duration-500 ${
        transparent 
          ? "border-transparent bg-gradient-to-b from-black/60 to-transparent" 
          : "border-b border-white/5 bg-background/80 backdrop-blur-2xl"
      }`}
    >
      <div className="flex items-center gap-12">
        <Link to="/" className="group flex items-center gap-4">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-tertiary-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-transform duration-300 group-hover:scale-105">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-manrope-extrabold text-base tracking-[0.25em] text-white uppercase drop-shadow-md">
            Arteka<span className="text-primary-300">Vision</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 border-l border-white/10 pl-8 md:flex h-10">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`group relative py-2 text-xs font-manrope-extrabold uppercase tracking-widest transition-colors drop-shadow-md ${
                  isActive ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {link.name}
                <span 
                  className={`absolute -bottom-4 left-0 h-0.5 bg-primary-400 transition-all duration-300 ease-out ${
                    isActive ? "w-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 pl-4 border-l border-white/10">
          <div className="flex flex-col items-end">
            <span className="text-sm font-manrope-extrabold text-white tracking-wider drop-shadow-md">
              {user?.username || "Operator"}
            </span>
            <button 
              onClick={(e) => { e.preventDefault(); logout(); }}
              className="text-[10px] font-manrope-bold text-white/50 hover:text-quaternary-300 transition-colors uppercase tracking-[0.15em] mt-0.5 drop-shadow-md"
            >
              Logout
            </button>
          </div>
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-md">
            <span className="text-sm font-manrope-extrabold text-white">
              {user?.username?.charAt(0).toUpperCase() || "O"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}