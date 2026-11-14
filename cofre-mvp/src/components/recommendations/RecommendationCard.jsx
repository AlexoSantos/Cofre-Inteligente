import { useState } from 'react';
import { ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import FatoresList from './FatoresList';
import SupplierTable from './SupplierTable';
import SimulatorPanel from './SimulatorPanel';
import { formatBRL, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const DECISAO = {
  comprar_agora: { label: 'Comprar agora', cls: 'bg-alert text-white' },
  repor: { label: 'Repor no ciclo', cls: 'bg-signal text-white' },
  monitorar: { label: 'Monitorar', cls: 'bg-secondary text-ink-soft' },
  nao_comprar: { label: 'Não comprar', cls: 'bg-ink text-white' },
};

function Metric({ label, value, tone }) {
  return (
    <div>
      <p className="label-xs text-ink-muted">{label}</p>
      <p className={cn('num mt-0.5 text-[13px]', tone || 'text-ink')}>{value}</p>
    </div>
  );
}

export default function RecommendationCard({ item, index, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const decisao = DECISAO[item.decisao] || DECISAO.monitorar;
  const selecionavel = item.quantidade > 0 && !item.bloqueadoPedido;

  return (
    <article
      className={cn(
        'rise overflow-hidden rounded-[20px] border bg-white transition-all duration-300',
        selected ? 'border-teal/40 shadow-[0_18px_40px_-30px_rgba(11,20,22,0.5)]' : 'border-line'
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      {item.bloqueadoPedido && <p className="px-5 py-2 bg-signal-soft text-signal text-xs">Já existe pedido aberto: {item.pedidosAbertos.map(p=>p.numero).join(", ")} · {item.quantidadeEmPedido} unidades pendentes. Receba ou cancele antes de gerar outra compra deste item.</p>}
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:gap-5 lg:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="num mt-0.5 hidden w-6 shrink-0 text-[11px] text-ink-muted/60 sm:block">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14.5px] font-medium leading-tight text-ink">{item.nome}</h3>
              <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', decisao.cls)}>
                {decisao.label}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-ink-muted">
              {item.apresentacao} · classe {item.classe_abc} · {item.criticidade}
              {!item.codigo_gtin && ' · sem código de barras'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-4 lg:w-[440px] lg:shrink-0">
          <Metric
            label="Cobertura"
            value={`${formatNumber(item.cobertura, 1)} d`}
            tone={item.cobertura <= item.prazoEscolhido ? 'text-alert' : item.cobertura < item.alvo ? 'text-signal' : 'text-teal-deep'}
          />
          <Metric label="Consumo/dia" value={`${formatNumber(item.demanda, 1)}`} />
          <Metric label="Saldo" value={formatNumber(item.saldoEfetivo)} />
          <Metric label="Ponto de pedido" value={formatNumber(item.pontoPedido)} />
        </div>
      </div>

      {(
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line bg-paper/40 px-4 py-2.5 text-[11.5px] lg:px-5">
          {item.qtdRisco > 0 && (
            <span className="inline-flex items-center gap-1.5 text-alert">
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.9} />
              {formatNumber(item.qtdRisco)} {item.unidade} em risco de vencimento · {formatBRL(item.valorRisco)}
            </span>
          )}
          {item.quantidade > 0 && (
            <span className="text-ink-muted">
              Sugestão <span className="num text-ink">{formatNumber(item.quantidade)} {item.unidade}</span> ·{' '}
              <span className="num text-ink">{formatBRL(item.valorSugerido)}</span>
              {item.fornecedor && <span> · {item.fornecedor.nome}</span>}
            </span>
          )}
          {item.capitalLiberavel > 0 && (
            <span className="text-teal-deep">
              Redução potencial de <span className="num">{formatBRL(item.capitalLiberavel)}</span> de capital
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-medium text-teal hover:underline"
          >
            {open ? 'ocultar fatores' : 'por que?'}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </div>
      )}

      {open && (
        <div className="space-y-4 border-t border-line px-4 py-4 lg:px-5">
          <p className="max-w-3xl text-[12.5px] leading-relaxed text-ink">{item.narrativa}</p>
          <FatoresList fatores={item.fatores} />
          <div>
            <p className="label-xs mb-2 text-ink-muted">Comparativo de fornecedores</p>
            <SupplierTable
              alternativas={item.alternativas}
              escolhido={item.fornecedor?.nome}
              quantidade={item.quantidade}
            />
          </div>
          <SimulatorPanel item={item} />
          {selecionavel && (
            <button
              type="button"
              onClick={() => onToggle(item)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium transition-colors',
                selected ? 'bg-teal-mist text-teal-deep' : 'bg-ink text-white'
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
              {selected ? 'No plano de compra' : 'Incluir no plano de compra'}
            </button>
          )}
        </div>
      )}

      {selecionavel && (
        <div className="flex items-center gap-2.5 border-t border-line px-4 py-2.5 lg:px-5">
          <Checkbox checked={selected} onCheckedChange={() => onToggle(item)} id={`sel-${item.medicamento_id}`} />
          <label htmlFor={`sel-${item.medicamento_id}`} className="cursor-pointer text-[11.5px] text-ink-muted">
            Incluir no plano de compra
          </label>
        </div>
      )}
    </article>
  );
}