import type { ReactNode } from 'react'

type AppHeaderProps = {
  subtitle?: string
  title: string
  backHref?: string
  actions?: ReactNode
}

export function AppHeader({
  subtitle,
  title,
  backHref,
  actions,
}: AppHeaderProps) {
  return (
    <header>
      <div className="border border-slate-200 bg-white/80 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {backHref ? (
              <a className="flex items-center gap-3 text-left" href={backHref}>
                <span className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-400 via-cyan-400 to-violet-400 shadow-[0_0_18px_rgba(34,211,238,0.6)]" />
                <div>
                  {subtitle ? (
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                      {subtitle}
                    </p>
                  ) : null}
                  <h1 className="text-lg font-semibold">{title}</h1>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-3 text-left">
                <span className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-400 via-cyan-400 to-violet-400 shadow-[0_0_18px_rgba(34,211,238,0.6)]" />
                <div>
                  {subtitle ? (
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                      {subtitle}
                    </p>
                  ) : null}
                  <h1 className="text-lg font-semibold">{title}</h1>
                </div>
              </div>
            )}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
