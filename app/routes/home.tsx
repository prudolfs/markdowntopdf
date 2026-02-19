import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Markdown to PDF' },
    { name: 'description', content: 'Create PDFs from Markdown with a live preview.' },
  ]
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0d12] dark:text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-6 py-16">
        <header className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-3xl bg-gradient-to-br from-sky-500 via-emerald-400 to-yellow-300" />
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Markdown Studio
              </p>
              <h1 className="text-3xl font-semibold">Markdown to PDF</h1>
            </div>
          </div>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            A focused space to write Markdown and export a polished PDF. Real-time
            preview, VS Code-inspired editor, and one-click download.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-slate-900"
              href="/editor"
            >
              Open Editor
            </a>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Light & Dark modes
            </span>
          </div>
        </header>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Realtime Editing',
              body: 'Type in a VS Code-like editor with line numbers and fast rendering.',
            },
            {
              title: 'Instant Preview',
              body: 'See exactly how your document will look as a PDF.',
            },
            {
              title: 'One-Click Export',
              body: 'Download a clean, print-ready PDF from the top bar.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {item.body}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
