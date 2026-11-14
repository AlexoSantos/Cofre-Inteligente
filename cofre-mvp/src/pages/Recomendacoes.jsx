import {perform} from '@/lib/cofreApi';
import {useCofre} from '@/lib/CofreContext';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, ShoppingCart } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import RecommendationCard from '@/components/recommendations/RecommendationCard';
import SaiDecisionPanel from '@/components/recommendations/SaiDecisionPanel';
import { fetchRecomendacoes } from '@/lib/api';
import { base44 } from '@/api/base44Client';
import { formatBRL, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const FILTROS = [
  { key: 'todas', label: 'Todas' },
  { key: 'comprar_agora', label: 'Comprar agora' },
  { key: 'repor', label: 'Repor no ciclo' },
  { key: 'monitorar', label: 'Monitorar' },
  { key: 'nao_comprar', label: 'Não comprar' },
];

export default function Recomendacoes() {
  const {view,refresh}=useCofre();
  const requestKey=useRef(null);
  const [data, setData] = useState(view.recommendations);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [selecionados, setSelecionados] = useState({});
  const [gerando, setGerando] = useState(false);
  const [pedidoGerado, setPedidoGerado] = useState(null);

  const carregar = async () => {
    setError('');
    setSelecionados({});
    setLoading(true);
    try {
      await refresh();
      const res = await fetchRecomendacoes();
      setData(res);
    } catch(e) {
      setError(e.response?.data?.error || 'Não foi possível atualizar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {setData(view.recommendations);setLoading(false);}, [view.state.revision]);

  const lista = useMemo(() => {
    const itens = data?.recomendacoes || [];
    return filtro === 'todas' ? itens : itens.filter((i) => i.decisao === filtro);
  }, [data, filtro]);

  const selecionadosLista = useMemo(
    () => Object.values(selecionados),
    [selecionados]
  );

  const totalSelecionado = selecionadosLista.reduce((s, i) => s + i.valorSugerido, 0);

  const toggle = (item) => {
    setSelecionados((prev) => {
      const next = { ...prev };
      if (next[item.medicamento_id]) delete next[item.medicamento_id];
      else next[item.medicamento_id] = item;
      return next;
    });
  };

  const gerarPedido = async () => {
    if (!selecionadosLista.length) return;

    setGerando(true);setError('');
    try{const res=await perform('create_orders',{ids:selecionadosLista.map(i=>i.medicamento_id)});setPedidoGerado({pedidos:res.result.orders.length,itens:selecionadosLista.length,valor:res.result.orders.reduce((n,p)=>n+p.valor_total,0)});setSelecionados({});requestKey.current=null;}
    catch(e){setError(e.message);if(e.code!=='NETWORK')requestKey.current=null;}
    finally{setGerando(false);}
  };

  const resumo = data?.resumo;

  return (
    <div className="mx-auto max-w-[1340px] px-5 pb-28 pt-7 lg:px-10 lg:pt-10">
      <PageHeader
        eyebrow="Motor de decisão · atualizado agora"
        title="Recomendações de reposição"
        description="Cada sugestão parte do consumo registrado na demonstração, cruza saldo, estoque de segurança, validade e condições de cada fornecedor — e mostra os fatores que sustentam a decisão."
      >
        <button
          type="button"
          onClick={carregar}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/20"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.9} />}
          Recalcular
        </button>
      </PageHeader>

      <SaiDecisionPanel recommendations={data?.recomendacoes || []} onInclude={(id,saiReview)=>{const item=data?.recomendacoes.find(r=>r.medicamento_id===id);if(item&&item.quantidade>0&&!item.bloqueadoPedido)setSelecionados(prev=>({...prev,[id]:{...item,saiReview}}));}} />
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 text-red-800 p-4 text-sm">{error}</p>}
      {resumo && (
        <section className="mt-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <div className="card-soft p-4">
            <p className="label-xs text-ink-muted">Comprar agora</p>
            <p className="num mt-2 text-[24px] leading-none text-alert">{resumo.comprar_agora}</p>
            <p className="mt-2 text-[11px] text-ink-muted">itens sem cobertura para o prazo</p>
          </div>
          <div className="card-soft p-4">
            <p className="label-xs text-ink-muted">Repor no ciclo</p>
            <p className="num mt-2 text-[24px] leading-none text-signal">{resumo.repor}</p>
            <p className="mt-2 text-[11px] text-ink-muted">abaixo do ponto de pedido</p>
          </div>
          <div className="card-soft p-4">
            <p className="label-xs text-ink-muted">Valor sugerido</p>
            <p className="num mt-2 text-[24px] leading-none text-ink">{formatBRL(resumo.valor_sugerido)}</p>
            <p className="mt-2 text-[11px] text-ink-muted">compra para cobrir alvo + segurança</p>
          </div>
          <div className="card-soft p-4">
            <p className="label-xs text-ink-muted">Em risco de vencimento</p>
            <p className="num mt-2 text-[24px] leading-none text-alert">{formatBRL(resumo.valor_em_risco)}</p>
            <p className="mt-2 text-[11px] text-ink-muted">capital que vence sem consumo</p>
          </div>
        </section>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {FILTROS.filter((f) => f.key === 'todas' || !resumo || resumo[f.key] > 0).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
              filtro === f.key ? 'bg-ink text-white' : 'bg-white text-ink-muted border border-line hover:text-ink'
            )}
          >
            {f.label}
            {resumo && (
              <span className="num ml-1.5 opacity-60">
                {f.key === 'todas' ? resumo.total_itens : resumo[f.key] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {pedidoGerado && (
        <div className="mt-4 rounded-xl border border-teal/25 bg-teal-mist px-4 py-3 text-[12.5px] text-teal-deep">
          Plano gerado: {pedidoGerado.pedidos} pedido(s), {pedidoGerado.itens} item(ns), {formatBRL(pedidoGerado.valor)}.{' '}
          <Link to="/pedidos" className="font-medium underline">
            Ver pedidos de compra
          </Link>
        </div>
      )}

      <section className="mt-4 flex flex-col gap-2.5">
        {loading && !data && (
          <div className="card-soft flex items-center gap-3 p-6 text-[12.5px] text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculando recomendações a partir das movimentações…
          </div>
        )}
        {lista.map((item, i) => (
          <RecommendationCard
            key={item.medicamento_id}
            item={item}
            index={i}
            selected={!!selecionados[item.medicamento_id]}
            onToggle={toggle}
          />
        ))}
        {!loading && !lista.length && (
          <div className="card-soft p-8 text-center text-[12.5px] text-ink-muted">
            Nenhuma recomendação neste filtro.
          </div>
        )}
      </section>

      {selecionadosLista.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-5 py-3 backdrop-blur lg:left-[264px] lg:px-10">
          <div className="mx-auto flex max-w-[1340px] flex-wrap items-center gap-3">
            <div className="text-[12px] text-ink-muted">
              <span className="num text-ink">{selecionadosLista.length}</span> item(ns) ·{' '}
              <span className="num text-ink">{formatBRL(totalSelecionado)}</span>
            </div>
            <button
              type="button"
              onClick={gerarPedido}
              disabled={gerando}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white disabled:opacity-60"
            >
              {gerando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.9} />}
              {gerando?'Analisando com SAI…':'Analisar e gerar pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}