export default function HomePage() {
  const services = [
    { name: 'PostgreSQL 16', role: 'Relational Database with Prisma ORM', port: '5432', badge: 'Active' },
    { name: 'Redis 7', role: 'In-Memory Cache & Session Broker', port: '6379', badge: 'Active' },
    { name: 'Meilisearch 1.11', role: 'Instant Millisecond Search & Filtering', port: '7700', badge: 'Active' },
    { name: 'Node.js / Express', role: 'REST & GraphQL Backend API', port: '4000', badge: 'apps/api' },
    { name: 'Next.js App Router', role: 'Server Components & Client UI', port: '3000', badge: 'apps/web' },
  ];

  const features = [
    { title: 'Local Payment Integration', desc: 'Pre-configured support for bKash, Nagad, SSLCommerz, and Cash on Delivery.' },
    { title: 'Sub-50ms Catalog Search', desc: 'Meilisearch indexing with typo tolerance in English and Banglish keywords.' },
    { title: 'Scalable Monorepo Architecture', desc: 'Clean separation between web frontend and headless backend services.' },
    { title: 'Type-Safe Data Layer', desc: 'Prisma schema covering Users, Categories, Products, Orders, and OrderItems.' },
  ];

  return (
    <main className="min-h-screen px-4 py-12 md:py-20 max-w-6xl mx-auto flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            BD Commerce Platform Architecture Initialized
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            High-Performance <span className="text-emerald-500">B2C E-Commerce</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Enterprise monorepo infrastructure ready for scale across Dhaka, Chittagong, and all 64 districts in Bangladesh.
          </p>
        </header>

        {/* Services Status Grid */}
        <section className="mb-12">
          <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Core Infrastructure Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{svc.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    :{svc.port}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{svc.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Highlights */}
        <section className="mb-12">
          <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-4">Architectural Pillars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feat) => (
              <div key={feat.title} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{feat.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>© 2026 BD Commerce Platform. Designed for high-volume consumer commerce.</p>
        <div className="flex items-center gap-4 mt-4 sm:mt-0 font-mono">
          <span>apps/web (Port 3000)</span>
          <span>•</span>
          <span>apps/api (Port 4000)</span>
        </div>
      </footer>
    </main>
  );
}
