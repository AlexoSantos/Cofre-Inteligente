import { formatCompactBRL } from '@/lib/format';

const BUCKETS = [
  { key: 'vencidos', label: 'vencidos', tone: 'bg-alert' },
  { key: 'd30', label: '0–30', tone: 'bg-alert' },
  { key: 'd60', label: '31–60', tone: 'bg-signal' },
  { key: 'd90', label: '61–90', tone: 'bg-teal-ice' },
  { key: 'd120', label: '90+', tone: 'bg-teal/25' },
];

export default function ExpiryCurve({ buckets }) {
  const max = Math.max(...BUCKETS.map((b) => buckets[b.key] || 0), 1);

  return (
    <div className="space-y-4">
      {BUCKETS.map((b) => {
        const value = buckets[b.key] || 0;
        return (
          <div key={b.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[11.5px] text-ink-muted">{b.label}{b.key==='vencidos'?'':' dias'}</span>
              <span className="num text-[12px] text-ink">{formatCompactBRL(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${b.tone} transition-all duration-700`}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
        Lotes com validade curta pressionam a decisão: repor antes de vencer pode gerar perda dupla.
      </p>
    </div>
  );
}