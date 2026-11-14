import { Link } from 'react-router-dom';
import { ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBRL, formatNumber } from '@/lib/format';

const DECISAO = {
  comprar_agora: { label: 'Comprar agora', cls: 'bg-alert-soft text-alert border-alert/20' },
  repor: { label: 'Repor no ciclo', cls: 'bg-signal-soft text-signal border-signal/20' },
  monitorar: { label: 'Monitorar', cls: 'bg-teal-mist text-teal-deep border-teal/20' },
  nao_comprar: { label: 'Não comprar', cls: 'bg-secondary text-ink-muted border-line' },
};

export default function RecommendationPreview({ items = [] }) {
  if (!items.length) {
    return <p className="py-6 text-center text-[12px] text-ink-muted">Sem recomendações no momento.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => {
        const tone = DECISAO[item.decisao] || DECISAO.monitorar;
        return (
          <Link
            key={item.nome}
            to="/recomendacoes"
            className="group rise rounded-2xl border border-line bg-white px-4 py-3.5 transition-all duration-300 hover:border-teal/30 hover:shadow-[0_16px_36px_-28px_rgba(11,20,22,0.55)]"
            style={{ animationDelay: `${120 + i * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-ink">{item.nome}</p>
                <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                  {item.lote ? `Lote ${item.lote} · ` : ''}saldo {formatNumber(item.saldoEfetivo)} {item.unidade} ·
                  cobertura {formatNumber(item.cobertura, 1)} dias
                </p>
              </div>
              <span className={cn('shrink-0 rounded-md border px-2 py-0.5 text-[10.5px] font-medium', tone.cls)}>
                {tone.label}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-teal" strokeWidth={1.8} />
                consumo {item.tendencia === 0 ? 'estável' : `${item.tendencia > 0 ? '+' : ''}${item.tendencia}%`}
              </span>
              {item.validadeProximaDias !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-signal" strokeWidth={1.8} />
                  lote vence em {item.validadeProximaDias} d
                </span>
              )}
              {item.fornecedor && <span>{item.fornecedor.nome} · {item.fornecedor.prazo} dias</span>}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
              <span className="text-[11.5px] text-ink-muted">
                {item.quantidade > 0 ? (
                  <>
                    Sugestão <span className="num text-ink">{formatNumber(item.quantidade)} {item.unidade}</span> ·{' '}
                    <span className="num text-ink">{formatBRL(item.valorSugerido)}</span>
                  </>
                ) : (
                  <>
                    Libera <span className="num text-teal-deep">{formatBRL(item.capitalLiberavel)}</span> de capital
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal opacity-0 transition-opacity group-hover:opacity-100">
                ver fatores <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}