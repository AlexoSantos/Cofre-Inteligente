import {useCofre} from '@/lib/CofreContext';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Timer, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { fetchRecomendacoes } from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function Fornecedores() {
  const {view}=useCofre();
  useEffect(()=>{setFornecedores(view.state.Fornecedor);setData(view.recommendations);setLoading(false);},[view.state.revision]);
  const [fornecedores, setFornecedores] = useState([]);
  const [data, setData] = useState(null);
  const [sel, setSel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [f, rec] = await Promise.all([
        base44.entities.Fornecedor.filter({ ativo: true }, { sort: 'prazo_entrega_dias', limit: 50 }),
        fetchRecomendacoes(),
      ]);
      const lista = f.items || f;
      setFornecedores(lista);
      setData(rec);
      setSel(rec?.recomendacoes?.[0]?.medicamento_id || '');
      setLoading(false);
    })();
  }, []);

  const item = useMemo(
    () => data?.recomendacoes?.find((r) => r.medicamento_id === sel),
    [data, sel]
  );

  return (
    <div className="mx-auto max-w-[1340px] px-5 pb-16 pt-7 lg:px-10 lg:pt-10">
      <PageHeader
        eyebrow="Rede de abastecimento"
        title="Fornecedores"
        description="Preço isolado não decide a compra. O motor compara preço, prazo, disponibilidade e uma hipótese de custo financeiro — e escolhe quem entrega antes da ruptura."
      />

      <section className="mt-7 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        {fornecedores.map((f, i) => (
          <div key={f.id} className="card-soft rise p-4" style={{ animationDelay: `${i * 50}ms` }}>
            <p className="text-[13px] font-medium leading-tight text-ink">{f.nome}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-muted">{f.regiao}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <Timer className="h-3.5 w-3.5 text-teal" strokeWidth={1.8} />
              <span className="num text-[18px] leading-none text-ink">{f.prazo_entrega_dias}</span>
              <span className="text-[10.5px] text-ink-muted">dias</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-teal-ice"
                style={{ width: `${Math.round((f.confiabilidade || 0) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10.5px] text-ink-muted">
              {Math.round((f.confiabilidade || 0) * 100)}% no prazo (fictício) · mín. {formatBRL(f.pedido_minimo)}
            </p>
            <p className="mt-1 text-[10.5px] text-ink-muted">{f.condicao_pagamento}</p>
          </div>
        ))}
      </section>

      <section className="card-soft mt-3.5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-ink">Comparativo de ofertas</h2>
            <p className="mt-0.5 text-[11.5px] text-ink-muted">
              Custo comparativo = preço × quantidade + hipótese financeira de 0,035% ao dia. Não inclui frete ou tributos.
            </p>
          </div>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger className="h-9 w-full rounded-lg border-line bg-white text-[12px] sm:w-[320px]">
              <SelectValue placeholder="Selecionar medicamento" />
            </SelectTrigger>
            <SelectContent>
              {(data?.recomendacoes || []).map((r) => (
                <SelectItem key={r.medicamento_id} value={r.medicamento_id} className="text-[12.5px]">
                  {r.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-6 text-[12.5px] text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando ofertas…
          </div>
        )}

        {item && (
          <>
            <div className="mt-4 overflow-x-auto scroll-thin">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-line text-left">
                    {['Fornecedor', 'Preço un.', 'Prazo', 'Capital no trânsito', 'Custo total', 'Chega antes da ruptura?'].map(
                      (h) => (
                        <th key={h} className="pb-2 pr-5 label-xs text-ink-muted">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {item.alternativas.map((a) => {
                    const isChosen = a.fornecedor_nome === item.fornecedor?.nome;
                    const capital = item.quantidade * a.preco * a.prazo * 0.00035;
                    return (
                      <tr
                        key={a.fornecedor_nome}
                        className={cn('border-b border-line/60 last:border-0', isChosen && 'bg-teal-mist/40')}
                      >
                        <td className="py-2.5 pr-5 text-[12px] text-ink">
                          {a.fornecedor_nome}
                          {isChosen && <span className="ml-1.5 text-[10px] font-medium text-teal">recomendado</span>}
                        </td>
                        <td className="py-2.5 pr-5 num text-[12px] text-ink">{formatBRL(a.preco, 2)}</td>
                        <td className="py-2.5 pr-5 num text-[12px] text-ink-muted">{a.prazo} d</td>
                        <td className="py-2.5 pr-5 num text-[12px] text-ink-muted">{formatBRL(capital)}</td>
                        <td className="py-2.5 pr-5 num text-[12px] text-ink">
                          {item.quantidade > 0 ? formatBRL(a.custo_total) : '—'}
                        </td>
                        <td className="py-2.5 pr-5">
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                              a.viavel ? 'bg-teal-mist text-teal-deep' : 'bg-alert-soft text-alert'
                            )}
                          >
                            {a.viavel ? 'sim' : `não · ruptura em ${Math.round(item.cobertura)} d`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-paper/50 p-4 sm:flex-row sm:items-center">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal" strokeWidth={1.9} />
              <p className="text-[11.5px] leading-relaxed text-ink-muted">
                Para <span className="text-ink">{item.nome}</span>, a cobertura atual é de{' '}
                <span className="num text-ink">{Math.round(item.cobertura)} dias</span>.{' '}
                {item.fornecedor
                  ? `A recomendação usa ${item.fornecedor.nome} (${item.fornecedor.prazo} dias). ${item.semOfertaViavel ? "Nenhuma oferta confirmada chega a tempo; consultar compra emergencial ou remanejamento." : "Chega antes da ruptura projetada."}`
                  : 'Nenhuma oferta chega antes da ruptura.'}{' '}
                {item.premioFornecedor > 0 && (
                  <>
                    O prêmio de <span className="num text-ink">{formatBRL(item.premioFornecedor)}</span> é o custo de
                    antecipar a entrega em relação à oferta mais barata.
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}