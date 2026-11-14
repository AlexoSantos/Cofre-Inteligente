import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONE = {
  neutral: 'text-ink',
  teal: 'text-teal',
  signal: 'text-signal',
  alert: 'text-alert',
};

export default function KpiCard({ label, value, unit, hint, delta, deltaTone = 'neutral', tone = 'neutral', index = 0 }) {
  return (
    <div
      className="card-soft rise p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="label-xs text-ink-muted">{label}</p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn('num text-[26px] font-medium leading-none', TONE[tone])}>{value}</span>
        {unit && <span className="text-[12px] text-ink-muted">{unit}</span>}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11.5px]">
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 num',
              deltaTone === 'good' && 'bg-teal-mist text-teal-deep',
              deltaTone === 'bad' && 'bg-alert-soft text-alert',
              deltaTone === 'warn' && 'bg-signal-soft text-signal',
              deltaTone === 'neutral' && 'bg-secondary text-ink-muted',
            )}
          >
            {deltaTone === 'bad' ? (
              <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
            ) : deltaTone === 'good' ? (
              <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
            ) : null}
            {delta}
          </span>
        )}
        <span className="text-ink-muted/80">{hint}</span>
      </div>
    </div>
  );
}