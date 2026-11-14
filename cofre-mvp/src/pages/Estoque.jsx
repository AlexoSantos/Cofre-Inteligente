import {useCofre} from '@/lib/CofreContext';
import {perform} from '@/lib/cofreApi';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import CodeLookup from '@/components/estoque/CodeLookup';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { daysUntil, formatBRL, formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function Estoque() {
  const {view}=useCofre();
  useEffect(()=>{setLotes(view.state.Lote);setMedicamentos(view.state.Medicamento);setLoading(false);},[view.state.revision]);
  const [lotes, setLotes] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationError,setOperationError]=useState('');
  const [busca, setBusca] = useState('');
  const [cofre, setCofre] = useState('todos');
  const [faixa, setFaixa] = useState('todas');

  useEffect(() => {
    (async () => {
      const [l, m] = await Promise.all([
        base44.entities.Lote.filter({}, { sort: 'validade', limit: 400 }),
        base44.entities.Medicamento.filter({ ativo: true }, { limit: 300 }),
      ]);
      setLotes(l.items || l);
      setMedicamentos(m.items || m);
      setLoading(false);
    })();
  }, []);

  const filtrados = useMemo(() => {
    return lotes
      
      .filter((l) => (cofre === 'todos' ? true : l.cofre === cofre))
      .filter((l) => {
        if (faixa === 'todas') return true;
        const d = daysUntil(l.validade);
        if (faixa === 'critica') return d !== null && d <= 30;
        if (faixa === 'atencao') return d !== null && d > 30 && d <= 90;
        return d !== null && d > 90;
      })
      .filter((l) =>
        busca
          ? `${l.medicamento_nome} ${l.lote} ${l.codigo_unico}`.toLowerCase().includes(busca.toLowerCase())
          : true
      );
  }, [lotes, cofre, faixa, busca]);

  const totalUnidades = filtrados.reduce((s, l) => s + Number(l.quantidade || 0), 0);
  const totalValor = filtrados.reduce((s, l) => s + Number(l.quantidade || 0) * Number(l.valor_unitario || 0), 0);
  const vencendo = filtrados.filter((l) => {
    const d = daysUntil(l.validade);
    return d !== null && d <= 30;
  });

  return (
    <div className="mx-auto max-w-[1340px] px-5 pb-16 pt-7 lg:px-10 lg:pt-10">
      <PageHeader
        eyebrow={`${lotes.length} lotes rastreados`}
        title="Estoque por lote"
        description="Cada unidade dentro do cofre é rastreável por lote, validade e posição. A tabela mostra o saldo físico e o status de cada lote. Vencidos e lotes em quarentena são excluídos das recomendações."
      />

      {operationError&&<p role="alert" className="text-alert bg-alert-soft p-3 mt-4 rounded-xl text-sm">{operationError}</p>}
      <section className="mt-7 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="grid grid-cols-2 gap-3.5 lg:col-span-2">
          <div className="card-soft p-4">
            <p className="label-xs text-ink-muted">Unidades em estoque</p>
            <p className="num mt-2 text-[24px] leading-none text-ink">{formatNumber(totalUnidades)}</p>
          </div>
          <div className="card-soft p-4">
            <p className="label-xs text-ink-muted">Valor imobilizado</p>
            <p className="num mt-2 text-[24px] leading-none text-ink">{formatBRL(totalValor)}</p>
          </div>
          <div className="card-soft p-4">
            <p className="label-xs text-ink-muted">Lotes</p>
            <p className="num mt-2 text-[24px] leading-none text-ink">{filtrados.length}</p>
          </div>
          <div className="card-soft p-4">
            <p className="label-xs text-ink-muted">Vencendo em 30 dias</p>
            <p className="num mt-2 text-[24px] leading-none text-alert">{vencendo.length}</p>
            <p className="mt-1 text-[11px] text-ink-muted">
              {formatBRL(vencendo.reduce((s, l) => s + Number(l.quantidade || 0) * Number(l.valor_unitario || 0), 0))} nesses lotes
            </p>
          </div>
        </div>
        <CodeLookup medicamentos={medicamentos} lotes={lotes} />
      </section>

      <section className="card-soft mt-3.5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:px-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar medicamento, lote ou código do cofre"
              className="h-9 rounded-lg border-line bg-paper/60 pl-9 text-[12.5px]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'todos', label: 'Todos os cofres' },
              { key: 'Cofre A', label: 'Cofre A' },
              { key: 'Cofre B', label: 'Cofre B' },
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCofre(c.key)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
                  cofre === c.key ? 'bg-ink text-white' : 'border border-line text-ink-muted hover:text-ink'
                )}
              >
                {c.label}
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-line" />
            {[
              { key: 'todas', label: 'Todas' },
              { key: 'critica', label: '≤ 30 d' },
              { key: 'atencao', label: '31–90 d' },
              { key: 'ok', label: '> 90 d' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFaixa(f.key)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
                  faixa === f.key ? 'bg-ink text-white' : 'border border-line text-ink-muted hover:text-ink'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-5 py-8 text-[12.5px] text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando lotes…
          </div>
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left">
                  {['Medicamento', 'Lote / código', 'Qtd.', 'Validade', 'Dias', 'Cofre · posição', 'Valor', 'Controle'].map((h) => (
                    <th key={h} className="px-5 py-2.5 label-xs text-ink-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l) => {
                  const d = daysUntil(l.validade);
                  return (
                    <tr key={l.id} className="border-b border-line/60 last:border-0 hover:bg-paper/40">
                      <td className="px-5 py-3">
                        <p className="text-[12.5px] text-ink">{l.medicamento_nome}</p>
                        <p className="num text-[10.5px] text-ink-muted">{l.codigo_unico} · {l.status}</p>
                      </td>
                      <td className="px-5 py-3 num text-[11.5px] text-ink-muted">{l.lote}</td>
                      <td className="px-5 py-3 num text-[12.5px] text-ink">{formatNumber(l.quantidade)}</td>
                      <td className="px-5 py-3 num text-[11.5px] text-ink-muted">{formatDate(l.validade)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'num rounded-md px-1.5 py-0.5 text-[10.5px]',
                            d !== null && d <= 30
                              ? 'bg-alert-soft text-alert'
                              : d !== null && d <= 90
                                ? 'bg-signal-soft text-signal'
                                : 'bg-secondary text-ink-muted'
                          )}
                        >
                          {d} d
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[11.5px] text-ink-muted">
                        {l.cofre} · {l.posicao}
                      </td>
                      <td className="px-5 py-3 num text-[12px] text-ink">
                        {formatBRL(Number(l.quantidade || 0) * Number(l.valor_unitario || 0))}
                      </td>
                      <td className="px-4 py-2 text-xs"><button onClick={async()=>{const motivo=window.prompt(l.status==='quarentena'?'Justificativa da revisão para liberar o lote:':'Motivo do bloqueio preventivo:');if(!motivo)return;setOperationError('');try{await perform(l.status==='quarentena'?'release':'quarantine',{id:l.id,motivo});}catch(e){setOperationError(e.message);}}} className="underline text-teal">{l.status==='quarentena'?'Revisar e liberar':'Bloquear lote'}</button></td>
                    </tr>
                  );
                })}
                {!filtrados.length && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-[12.5px] text-ink-muted">
                      Nenhum lote neste filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}