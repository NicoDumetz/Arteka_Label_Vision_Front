import { Link, Outlet, useLocation } from "react-router-dom";
import { WorkspaceProvider, useWorkspace } from "~/contexts/Workspace";

function WorkspaceContent() {
  const { project, role, isLoading, canManageProject, canAnnotate, canReview, canManageModels } = useWorkspace();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#08080c]">
        <span className="text-xs font-mono uppercase tracking-widest text-white/50 animate-pulse">
          Loading Workspace Environment...
        </span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#08080c] text-white">
        <h2 className="text-2xl font-manrope-extrabold">Workspace Not Found</h2>
        <Link to="/projects" className="mt-4 text-sm text-primary-400 hover:text-primary-300 underline">Return to Hub</Link>
      </div>
    );
  }

  const baseUrl = `/workspaces/${project.id}`;

  // Définition dynamique des onglets selon les permissions
  const tabs = [
    { name: "Overview", path: baseUrl, isVisible: true },
    { name: "Assets", path: `${baseUrl}/assets`, isVisible: true },
    { name: "Items", path: `${baseUrl}/items`, isVisible: true },
    { name: "Annotation", path: `${baseUrl}/annotate`, isVisible: canAnnotate },
    { name: "Validation", path: `${baseUrl}/review`, isVisible: canReview },
    { name: "Labels", path: `${baseUrl}/labels`, isVisible: canManageProject },
    { name: "Models", path: `${baseUrl}/models`, isVisible: canManageModels },
    { name: "Exports", path: `${baseUrl}/exports`, isVisible: true },
    { name: "Settings", path: `${baseUrl}/settings`, isVisible: canManageProject },
  ].filter(tab => tab.isVisible);

  return (
    <div className="relative isolate min-h-screen w-full bg-[#08080c] font-manrope text-white selection:bg-primary-500/30">
      
      {/* BACKGROUND DISCRET */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary-600/5 blur-[120px] pointer-events-none" />

      {/* HEADER COMPACT (Sticky) */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#08080c]/80 backdrop-blur-xl">
        
        {/* Ligne 1 : Fil d'ariane & Info rapide */}
        <div className="flex items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3 text-sm">
            <Link to="/projects" className="text-white/40 hover:text-white transition-colors flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Hub
            </Link>
            <span className="text-white/20">/</span>
            <span className="font-manrope-extrabold text-white">{project.name}</span>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-primary-300 border border-white/10">
              {project.task_type}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Role: <span className="text-white">{role}</span></span>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
              {role?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>

        {/* Ligne 2 : Navigation par Onglets (Tabs) */}
        <nav className="flex px-8 gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`relative py-3 text-xs font-manrope-extrabold uppercase tracking-widest transition-colors ${
                  isActive ? "text-white" : "text-white/40 hover:text-white/80"
                }`}
              >
                {tab.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* CONTENU DE LA PAGE (Outlet) */}
      <main className="relative w-full">
        <Outlet />
      </main>

    </div>
  );
}

export default function Workspace() {
  return (
    <WorkspaceProvider>
      <WorkspaceContent />
    </WorkspaceProvider>
  );
}
