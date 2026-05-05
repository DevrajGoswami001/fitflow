export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen overflow-hidden bg-grid-fade">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.12),_transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Premium workout OS
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-foreground xl:text-6xl">
              Build stronger habits with a calm, high-performance training stack.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
              FitFlow combines workout tracking, realtime sync, analytics, and templates in a dark-first dashboard designed for daily use.
            </p>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="rounded-3xl border border-white/8 bg-white/4 p-5">Realtime syncing</div>
              <div className="rounded-3xl border border-white/8 bg-white/4 p-5">Streak analytics</div>
              <div className="rounded-3xl border border-white/8 bg-white/4 p-5">Template workflows</div>
            </div>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
