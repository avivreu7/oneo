import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-dvh bg-app-bg flex flex-col px-safe" dir="rtl">

      {/* Top accent */}
      <div className="h-1.5 bg-ps-blue w-full shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center gap-10 py-10">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-ps-blue/10 border-2 border-ps-blue/20 mb-5">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="text-5xl font-black text-app-text leading-tight tracking-tight">
            האחוזון<br />העליון
          </h1>
          <p className="text-app-muted mt-2 text-sm font-medium tracking-wider uppercase">The 1% Club</p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/play"
            className="flex items-center justify-center gap-3 h-14 rounded-xl bg-ps-blue text-white font-bold text-lg hover:bg-ps-mid transition-all shadow-[0_2px_8px_rgba(0,80,230,0.35)] active:scale-[0.98]"
          >
            📱 הצטרף למשחק
          </Link>
          <Link
            href="/projector"
            className="flex items-center justify-center gap-3 h-14 rounded-xl bg-app-surface text-app-text font-semibold text-base border-2 border-app-border card-shadow hover:border-ps-blue/40 transition-all active:scale-[0.98]"
          >
            🖥️ מסך פרויקטור
          </Link>
          <Link
            href="/admin"
            className="flex items-center justify-center gap-3 h-12 rounded-xl bg-app-surface text-app-muted font-medium border border-app-border hover:text-app-text hover:border-ps-blue/30 transition-all"
          >
            ⚙️ ניהול משחק
          </Link>
        </div>
      </div>

      <div className="pb-safe shrink-0">
        <p className="text-app-muted/40 text-xs text-center pb-4">גרסה 1.0</p>
      </div>
    </main>
  );
}
