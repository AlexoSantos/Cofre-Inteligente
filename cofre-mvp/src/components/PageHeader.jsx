export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="rise flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal" />
            {eyebrow}
          </div>
        )}
        <h1 className="mt-2 font-heading text-[32px] leading-[1.06] tracking-[-0.015em] text-ink lg:text-[38px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}