import {useCofre} from '@/lib/CofreContext';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Download, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import KpiCard from '@/components/dashboard/KpiCard';
import ConsumptionChart from '@/components/dashboard/ConsumptionChart';
import ExpiryCurve from '@/components/dashboard/ExpiryCurve';
import CofreVitals from '@/components/dashboard/CofreVitals';
import RecommendationPreview from '@/components/dashboard/RecommendationPreview';
import { base44 } from '@/api/base44Client';
import { fetchRecomendacoes } from '@/lib/api';
import { formatBRL, formatDateTime, formatNumber, daysUntil } from '@/lib/format';
import { cn } from '@/lib/utils';

const TIPO_TONE = {
  entrada: 'bg-teal-mist text-teal-deep',
  saida: 'bg-secondary text-ink-soft',
  ajuste: 'bg-signal-soft text-signal',
  perda: 'bg-alert-soft text-alert',
  vencimento: 'bg-alert-soft text-alert',
  transferencia: 'bg-purple-50 text-purple-700',
};

export default function Dashboard() {
  const {view}=useCofre();
  const [data, setData] = useState(view.recommendations);
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{setData(view.recommendations);setMovs([...view.state.Movimentacao].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,6));setLoading(false);},[view.state.revision]);

  const resumo = data?.resumo;
  const recs = data?.recomendacoes || [];

  const topo = useMemo(() => [...recs].sort((a, b) => b.score - a.score).slice(0, 3), [recs]);
  const destaque = recs.find((r) => r.decisao === 'comprar_agora') || recs[0];

  const chartData = useMemo(() => {
    if (!destaque) return [];
    const pontos = [];
    for (let i = 0; i <= 40; i += 4) {
      pontos.push({
        dia: `D${i}`,
        saldo: Math.max(0, Math.round(destaque.saldoEfetivo - destaque.demanda * i)),
        consumo: Math.round(destaque.demanda),
      });
    }
    return pontos;
  }, [destaque]);

  const vencimentos = useMemo(() => {
    const buckets = { d30: 0, d60: 0, d90: 0, d120: 0 };
    view.state.Lote.forEach(l=>{const dias=daysUntil(l.validade);const valor=l.quantidade*l.valor_unitario;if(dias<=0)buckets.vencidos=(buckets.vencidos||0)+valor;else if(dias<=30)buckets.d30+=valor;else if(dias<=60)buckets.d60+=valor;else if(dias<=90)buckets.d90+=valor;else buckets.d120+=valor;});
    return buckets;
  }, [view.state.revision]);

  return (
    <div className="mx-auto max-w-[1340px] px-5 pb-16 pt-7 lg:px-10 lg:pt-10">
      <header className="rise flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal" />
            Unidade Centro · {loading ? 'calculando…' : 'atualizado agora'}
          </div>
          <h1 className="mt-2 font-heading text-[34px] leading-[1.05] tracking-[-0.015em] text-ink lg:text-[42px]">
            Painel de disponibilidade
          </h1>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-muted">
            Estoque, movimentação e conservação dos cofres refrigerados traduzidos em decisões de reposição.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='cofre-inteligente-recomendacoes.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/20"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.9} />
            Exportar
          </button>
          <Link
            to="/recomendacoes"
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-[12.5px] font-medium text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-ice" strokeWidth={1.9} />
            Plano de compra + SAI
          </Link>
        </div>
      </header>

      <section className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Capital imobilizado"
          value={resumo ? formatBRL(resumo.capital_imobilizado) : '—'}
          hint="em estoque nos cofres"
          index={0}
        />
        <KpiCard
          label="Cobertura média"
          value={resumo ? formatNumber(resumo.cobertura_media) : '—'}
          unit="dias"
          hint="média simples dos itens"
          index={1}
        />
        <KpiCard
          label="Risco de desabastecimento"
          value={resumo ? String(resumo.comprar_agora) : '—'}
          unit={resumo ? `de ${resumo.total_itens} itens` : ''}
          tone="alert"
          hint="sem cobertura para o prazo"
          index={2}
        />
        <KpiCard
          label="Em risco de vencimento"
          value={resumo ? formatBRL(resumo.valor_em_risco) : '—'}
          tone="signal"
          hint="vence antes do consumo"
          index={3}
        />
      </section>

      <section className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="card-soft rise p-5 lg:col-span-2" style={{ animationDelay: '180ms' }}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-[15px] font-medium text-ink">Recomendações prioritárias</h2>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                Ordenadas por risco de falta ponderado pela criticidade clínica
              </p>
            </div>
            <Link
              to="/recomendacoes"
              className="inline-flex items-center gap-1 whitespace-nowrap text-[11.5px] font-medium text-teal hover:underline"
            >
              ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-[12px] text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Calculando cobertura e validade…
            </div>
          ) : (
            <RecommendationPreview items={topo} />
          )}
        </div>

        <div className="rise" style={{ animationDelay: '240ms' }}>
          <CofreVitals />
        </div>
      </section>

      <section className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="card-soft rise p-5 lg:col-span-2" style={{ animationDelay: '300ms' }}>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-medium text-ink">
                Projeção de saldo{destaque ? ` · ${destaque.nome}` : ''}
              </h2>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                {destaque
                  ? `Consumo de ${formatNumber(destaque.demanda, 1)} ${destaque.unidade}/dia contra ponto de pedido de ${formatNumber(destaque.pontoPedido)}`
                  : 'Sem dados de consumo suficientes'}
              </p>
            </div>
            {destaque && (
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10.5px] font-medium',
                  destaque.cobertura <= destaque.prazoEscolhido ? 'bg-alert-soft text-alert' : 'bg-signal-soft text-signal'
                )}
              >
                ruptura em {Math.round(destaque.cobertura)} dias
              </span>
            )}
          </div>
          <ConsumptionChart data={chartData} reorderPoint={destaque?.pontoPedido || 0} />
        </div>

        <div className="card-soft rise p-5" style={{ animationDelay: '360ms' }}>
          <h2 className="text-[15px] font-medium text-ink">Capital por faixa de validade</h2>
          <p className="mb-4 mt-0.5 text-[11.5px] text-ink-muted">Onde o dinheiro está imobilizado</p>
          <ExpiryCurve buckets={vencimentos} />
        </div>
      </section>

      <section className="card-soft rise mt-3.5 overflow-hidden" style={{ animationDelay: '420ms' }}>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-[15px] font-medium text-ink">Últimas movimentações</h2>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">Movimentações simuladas, rastreadas por lote</p>
          </div>
          <Link to="/movimentacoes" className="text-[11.5px] font-medium text-teal hover:underline">
            histórico
          </Link>
        </div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-y border-line bg-paper/60 text-left">
                {['Tipo', 'Medicamento', 'Lote', 'Qtd.', 'Origem', 'Horário'].map((h) => (
                  <th key={h} className="px-5 py-2.5 label-xs text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movs.map((m) => (
                <tr key={m.id} className="border-b border-line/70 last:border-0 hover:bg-paper/50">
                  <td className="px-5 py-3">
                    <span className={cn('rounded-md px-2 py-0.5 text-[10.5px] font-medium', TIPO_TONE[m.tipo])}>
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12.5px] text-ink">{m.medicamento_nome}</td>
                  <td className="px-5 py-3 num text-[11.5px] text-ink-muted">{m.lote || '—'}</td>
                  <td className={cn('px-5 py-3 num text-[12.5px]', m.quantidade < 0 ? 'text-ink-muted' : 'text-teal-deep')}>
                    {m.quantidade > 0 ? `+${formatNumber(m.quantidade)}` : formatNumber(m.quantidade)}
                  </td>
                  <td className="px-5 py-3 text-[11.5px] text-ink-muted">{m.origem_destino || m.cofre || '—'}</td>
                  <td className="px-5 py-3 num text-[11.5px] text-ink-muted">{formatDateTime(m.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}