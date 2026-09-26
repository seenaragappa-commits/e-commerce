/** A card with an icon + title heading, used for the information panels of the order pages. */
export default function InfoCard({ icon: Icon, title, children, className = '' }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
        <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-4 text-sm">{children}</div>
    </section>
  );
}
