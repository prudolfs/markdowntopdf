import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Markdown to PDF' },
    { name: 'description', content: 'Create PDFs from Markdown with a live preview.' },
  ]
}

export default function Home() {
  return (
    <div className="app-shell">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-6 py-12">
        <header className="topbar fade-in">
          <div className="brand-chip">
            <span className="brand-dot" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Markdown Studio
              </p>
              <h1 className="text-lg font-semibold">Markdown to PDF</h1>
            </div>
          </div>
          <div className="action-row">
            <a className="action-btn-ghost" href="/editor">
              Open Editor
            </a>
          </div>
        </header>

        <main className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="fade-in delay-1">
            <h2 className="text-4xl font-semibold leading-tight">
              Write in Markdown. Export pixel-perfect PDFs.
            </h2>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              A focused writing space with realtime preview, document controls, and
              a clean export pipeline. Designed for docs, specs, and handoffs.
            </p>
            <div className="mt-8 action-row">
              <a className="action-btn" href="/editor">
                Start Writing
              </a>
              <span className="action-btn-ghost">Realtime preview</span>
              <span className="action-btn-ghost">PDF ready</span>
            </div>
          </section>

          <section className="fade-in delay-2 grid gap-4">
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
              <div key={item.title} className="panel p-6">
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{item.body}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}
