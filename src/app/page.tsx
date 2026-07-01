const quickActions = [
  "Create Invoice",
  "Create Delivery Challan",
  "Create Material Quotation",
  "Create Rental Quotation",
  "Create AMC Letter",
];

const modules = [
  "Customer Management",
  "Product Management",
  "GST Invoice",
  "Delivery Challan",
  "Quotation",
  "AMC",
  "Reports",
  "Audit Logs",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Surya Power ERP</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Enterprise Document Dashboard</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Responsive foundation for invoices, quotations, challans, AMC letters, storage backup, reports, and audit-ready operations.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today&apos;s Revenue" value="₹0.00" />
        <MetricCard label="Invoices Generated" value="0" />
        <MetricCard label="Pending Quotations" value="0" />
        <MetricCard label="Monthly Revenue" value="₹0.00" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Quick Actions">
          <ul className="grid gap-2 sm:grid-cols-2">
            {quickActions.map((action) => (
              <li key={action} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                {action}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Core Modules">
          <ul className="grid gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <li key={module} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                {module}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </article>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </article>
  );
}
