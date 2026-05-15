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

import { useState } from "react";
import { useAuth } from "~/contexts/Auth";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";
import { GridScan } from "~/components/GridScan";
export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      console.error("Auth Error:", err);
      const message = err.response?.data?.error?.message || "Une erreur est survenue.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 z-0 opacity-80">
         <GridScan
            sensitivity={0.55}
            lineThickness={1}
            linesColor="#E0E7FF"
            gridScale={0.1}
            scanColor="#4F46E5"
            scanOpacity={0.7}
            enablePost
            bloomIntensity={0.6}
            chromaticAberration={0}
            noiseIntensity={0.1}
            lineJitter={0}
            scanGlow={0.5}
            scanSoftness={2}
            enableWebcam={false}
            showPreview={false}
        />
      </div>

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-primary/40 to-tertiary/40 opacity-20 blur-xl" />

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f11] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-dark-shade border border-white/5 shadow-inner">
              <svg className="h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h1 className="text-xl font-manrope-extrabold text-white tracking-[0.2em] uppercase">
              Arteka Label <span className="text-primary-400">Vision</span>
            </h1>
            <p className="mt-2 text-[10px] font-manrope-bold text-subtitle-color tracking-[0.3em] uppercase">
              Secure Access Terminal
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-error/20 bg-error/5 p-3 text-[11px] text-error animate-shake flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-error animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-4">
              <Input
                label="Identifiant Réseau (Email)"
                type="email"
                placeholder="nom@arteka.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="!bg-black/40 !border-white/5 focus:!border-primary/50"
              />

              <Input
                label="Code d'Accès"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="!bg-black/40 !border-white/5 focus:!border-primary/50"
              />
            </div>

            <Button 
              type="submit" 
              className="mt-4 h-12 !bg-primary hover:!bg-primary-600 !border-none !text-[12px] !font-manrope-extrabold tracking-[0.2em] transition-all duration-300" 
              isLoading={isLoading}
            >
              START THE SESSION
            </Button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-[9px] text-contrast-600 leading-relaxed uppercase tracking-tighter">
              Access restricted to authorized personnel.<br/>
              Contact your administrator to obtain your access credentials.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-8 left-8 pointer-events-none opacity-20">
        <div className="h-8 w-8 border-t-2 border-l-2 border-primary" />
      </div>
      <div className="absolute bottom-8 right-8 pointer-events-none opacity-20">
        <div className="h-8 w-8 border-b-2 border-r-2 border-primary" />
      </div>
    </div>
  );
}