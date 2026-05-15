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
import { NavLink, Outlet } from "react-router-dom";
import { GlobalHeader } from "~/components/GlobalHeader";

const ADMIN_NAV = [
  { 
    name: "Identity & Access", 
    path: "/admin/users", 
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
  },
  { 
    name: "Infrastructure", 
    path: "/admin/infrastructure", 
    icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" 
  },
  { 
    name: "Neural Engine", 
    path: "/admin/engine", 
    icon: "M13 10V3L4 14h7v7l9-11h-7z" 
  },
];

export function AdminLayout() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#08080c] font-manrope text-white selection:bg-primary-500/30">
      
      {/* --- BACKGROUND --- */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#08080c_100%)] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_80%_at_50%_0%,#000_50%,transparent_100%)] pointer-events-none" />
      <div className="fixed top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-error-600/10 blur-[150px] mix-blend-screen pointer-events-none z-0" />
      
      <GlobalHeader transparent={true} />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        
        {/* --- SIDEBAR ADMIN --- */}
        <aside className="w-72 flex-shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="flex h-full flex-col px-6 py-8">
            <div className="mb-8 flex items-center gap-3 px-2">
              <span className="h-2 w-2 rounded-full bg-error animate-pulse shadow-[0_0_8px_rgba(255,0,77,0.8)]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-error">
                Admin Privileges
              </span>
            </div>

            <nav className="flex flex-col gap-2">
              {ADMIN_NAV.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    group flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300
                    ${isActive 
                      ? "bg-white/10 border border-white/10 text-white shadow-inner" 
                      : "border border-transparent text-white/50 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  <span className="text-xs font-manrope-extrabold uppercase tracking-widest">{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* --- MAIN CONTENT (OUTLET) --- */}
        <main className="flex-1 overflow-y-auto px-10 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}