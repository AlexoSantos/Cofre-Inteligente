import { AlertTriangle, CheckCircle2, Equal, TrendingDown } from 'lucide-react';

const TONE = {
  critico: { cls: 'border-alert/25 bg-alert-soft/60', icon: AlertTriangle, iconCls: 'text-alert' },
  atencao: { cls: 'border-signal/25 bg-signal-soft/60', icon: TrendingDown, iconCls: 'text-signal' },
  ok: { cls: 'border-teal/20 bg-teal-mist/60', icon: CheckCircle2, iconCls: 'text-teal' },
  neutro: { cls: 'border-line bg-paper/60', icon: Equal, iconCls: 'text-ink-muted' },
};

export default function FatoresList({ fatores = [] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {fatores.map((f) => {
        const tone = TONE[f.tom] || TONE.neutro;
        const Icon = tone.icon;
        return (
          <div key={f.titulo} className={`rounded-xl border p-3 ${tone.cls}`}>
            <div className="flex items-center gap-1.5">
              <Icon className={`h-3.5 w-3.5 ${tone.iconCls}`} strokeWidth={1.9} />
              <p className="label-xs text-ink-muted">{f.titulo}</p>
            </div>
            <p className="num mt-1 text-[12.5px] font-medium text-ink">{f.valor}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{f.detalhe}</p>
          </div>
        );
      })}
    </div>
  );
}