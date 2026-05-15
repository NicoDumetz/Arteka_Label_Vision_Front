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

import { useAuth } from "~/contexts/Auth";
import { Link } from "react-router-dom";
import { GlobalHeader } from "~/components/GlobalHeader";
import FloatingLines from "~/components/FloattingLines";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#050505] font-manrope text-white">
      <div className="absolute inset-0 z-0 opacity-80">
        <FloatingLines 
          enabledWaves={["top","middle","bottom"]}
          lineCount={8}
          lineDistance={8}
          bendRadius={8}
          bendStrength={-2}
          interactive={true}
          parallax={true}
          animationSpeed={1}
          linesGradient={["#4f46e5", "#8b5cf6", "#d946ef"]} 
          mixBlendMode="screen"
        />
      </div>

      <div className="absolute top-[-10%] left-[-5%] h-[600px] w-[50%] rounded-full bg-primary-600/10 blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[40%] rounded-full bg-tertiary-600/10 blur-[140px] pointer-events-none z-0" />

      <GlobalHeader transparent={true}/>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-12 text-center animate-in fade-in zoom-in-95 duration-1000 pointer-events-none">
        
        <div className="flex flex-col items-center justify-center pointer-events-auto">
         
          <h1 className="relative mb-8 text-6xl md:text-8xl lg:text-[8.5rem] font-manrope-extrabold tracking-tight leading-[1.05] text-white">
            
            <span className="drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
              Arteka Label
            </span>
            <br />

            <span className="relative inline-block mt-2">
              <span className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-400 to-tertiary-500 blur-3xl opacity-60 rounded-full scale-110"></span>
              
              <span className="relative bg-gradient-to-r from-white via-primary-200 to-tertiary-300 bg-clip-text text-transparent drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                VISION.
              </span>
            </span>

          </h1>

          <p className="mx-auto max-w-2xl text-base md:text-lg font-manrope-medium leading-relaxed text-contrast-300 drop-shadow-lg">
            Welcome back, <span className="text-white underline underline-offset-8 decoration-primary/50">{user?.username || "Commander"}</span>. 
            All systems are nominal. Ready to orchestrate your computer vision datasets.
          </p>

          <div className="mt-12 flex items-center gap-6">
            <Link 
                to="/projects/new" 
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white px-10 py-5 text-xs font-manrope-extrabold uppercase tracking-[0.2em] text-background transition-all hover:scale-105 hover:bg-primary-100 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            >
                Initialize New Project
            </Link>

            <Link 
                to="/projects" 
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-10 py-5 text-xs font-manrope-extrabold uppercase tracking-[0.2em] text-white backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/20"
            >
                Launch Workspace
            </Link>
          </div>
        </div>

      </main>

    </div>
  );
}