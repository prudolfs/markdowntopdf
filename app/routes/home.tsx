import { useEffect, useState } from 'react'
import { AppHeader } from '../components/app-header'
import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Markdown to PDF' },
    {
      name: 'description',
      content: 'Create PDFs from Markdown with a live preview.',
    },
  ]
}

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
      return
    }
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)',
    ).matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8fafc] text-[#0f172a] dark:bg-[#020617] dark:text-[#f1f5f9]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(251,191,36,0.25),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(167,139,250,0.25),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.2)_1px,transparent_1px)] bg-[size:52px_52px] opacity-30 dark:bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)]" />

      <div className="relative flex min-h-screen w-full flex-col">
        <div className="w-full pt-0">
          <AppHeader
            subtitle="Markdown Studio"
            title="Markdown to PDF"
            actions={
              <>
                <button
                  type="button"
                  onClick={() =>
                    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
                  }
                  aria-label="Toggle theme"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] shadow-lg transition hover:-translate-y-0.5 dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#f1f5f9]"
                >
                  {theme === 'dark' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="M4.93 4.93l1.41 1.41" />
                      <path d="M17.66 17.66l1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="M6.34 17.66l-1.41 1.41" />
                      <path d="M19.07 4.93l-1.41 1.41" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
                    </svg>
                  )}
                </button>
                <a
                  className="rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#22d3ee] px-5 py-2 text-sm font-semibold text-[#020617] shadow-[0_14px_30px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5"
                  href="/editor"
                >
                  Open Editor
                </a>
              </>
            }
          />
        </div>

        <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-6 pb-12 pt-10">
          <main className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <p className="text-xs uppercase tracking-[0.4em] text-[#64748b] dark:text-[#94a3b8]">
                Build clean docs fast
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
                Markdown writing with a studio-grade PDF export.
              </h2>
              <p className="mt-5 max-w-xl text-lg text-[#475569] dark:text-[#cbd5e1]">
                A focused writing space with realtime preview, document
                controls, and a clean export pipeline. Designed for docs, specs,
                and handoffs.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <a
                  className="rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#22d3ee] px-5 py-2 text-sm font-semibold text-[#020617] shadow-[0_14px_30px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5"
                  href="/editor"
                >
                  Start Writing
                </a>
                <span className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] backdrop-blur dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#cbd5e1]">
                  Realtime preview
                </span>
                <span className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] backdrop-blur dark:border-[#1e293b] dark:bg-[#0f172a] dark:text-[#cbd5e1]">
                  PDF ready
                </span>
              </div>
            </section>

            <section className="grid gap-4">
              {[
                {
                  title: 'Editor flow',
                  body: 'VS Code-inspired editor with line numbers and polished typography.',
                },
                {
                  title: 'Document controls',
                  body: 'Set page size, margins, and filename from a compact drawer.',
                },
                {
                  title: 'Export built-in',
                  body: 'Generate a PDF file directly, no print dialog needed.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-[0_22px_50px_rgba(15,23,42,0.16)] backdrop-blur dark:border-[#1e293b] dark:bg-[#0f172a] dark:shadow-[0_22px_50px_rgba(2,6,23,0.55)]"
                >
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm text-[#475569] dark:text-[#cbd5e1]">
                    {item.body}
                  </p>
                </div>
              ))}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
