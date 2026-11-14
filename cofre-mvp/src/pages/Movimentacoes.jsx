import {useCofre} from '@/lib/CofreContext';
import {perform} from '@/lib/cofreApi';
import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MovementForm from '@/components/movimentacoes/MovementForm';
import { base44 } from '@/api/base44Client';
import { formatDateTime, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const TIPO_STYLE = {
  entrada: 'bg-teal-mist text-teal-deep',
  saida: 'bg-secondary text-ink-soft',
  ajuste: 'bg-signal-soft text-signal',
  perda: 'bg-alert-soft text-alert',
  vencimento: 'bg-alert-soft text-alert',
  transferencia: 'bg-purple-50 text-purple-700',
};

const LEITURA_LABEL = {
  cofre_automatico: 'cofre',
  codigo_barras: 'código de barras',
  qr_lote: 'QR do lote',
  manual: 'manual',
};

export default function Movimentacoes() {
  const {view}=useCofre();
  useEffect(()=>{setLotes(view.state.Lote);setMedicamentos(view.state.Medicamento);setMovs([...view.state.Movimentacao].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,60));setLoading(false);},[view.state.revision]);
  const [movs, setMovs] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const carregar = async () => {
    const [mv, l, m] = await Promise.all([
      base44.entities.Movimentacao.filter({}, { sort: '-data', limit: 60 }),
      base44.entities.Lote.filter({}, { limit: 400 }),
      base44.entities.Medicamento.filter({ ativo: true }, { limit: 300 }),
    ]);
    setMovs(mv.items || mv);
    setLotes(l.items || l);
    setMedicamentos(m.items || m);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const hoje = new Date().toDateString();
  const doDia = movs.filter((m) => new Date(m.data).toDateString() === hoje);
  const saidas = doDia.filter((m) => m.tipo === 'saida').length;
  const entradas = doDia.filter((m) => m.tipo === 'entrada').length;
  const auto = movs.filter((m) => m.metodo_leitura === 'cofre_automatico').length;
  const pctAuto = movs.length ? Math.round((auto / movs.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-[1340px] px-5 pb-16 pt-7 lg:px-10 lg:pt-10">
      <PageHeader
        eyebrow="Rastreabilidade por lote"
        title="Movimentações"
        description="Todo evento de entrada, consumo, perda ou descarte é registrado com lote, cofre e operador. É essa base que alimenta o cálculo de consumo e a recomendação de compra."
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[12.5px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Nova movimentação
        </button>
      </PageHeader>

      <section className="mt-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="card-soft p-4">
          <p className="label-xs text-ink-muted">Saídas hoje (amostra)</p>
          <p className="num mt-2 text-[24px] leading-none text-ink">{formatNumber(saidas)}</p>
        </div>
        <div className="card-soft p-4">
          <p className="label-xs text-ink-muted">Entradas hoje (amostra)</p>
          <p className="num mt-2 text-[24px] leading-none text-teal">{formatNumber(entradas)}</p>
        </div>
        <div className="card-soft p-4">
          <p className="label-xs text-ink-muted">Registro automático</p>
          <p className="num mt-2 text-[24px] leading-none text-ink">{pctAuto}%</p>
          <p className="mt-1 text-[11px] text-ink-muted">na amostra · integração simulada</p>
        </div>
        <div className="card-soft p-4">
          <p className="label-xs text-ink-muted">Eventos rastreados</p>
          <p className="num mt-2 text-[24px] leading-none text-ink">{formatNumber(movs.length)}</p>
          <p className="mt-1 text-[11px] text-ink-muted">últimos 60 registros</p>
        </div>
      </section>

      <section className="card-soft mt-3.5 overflow-hidden">
        <div className="border-b border-line px-5 py-3">
          <h2 className="text-[14px] font-medium text-ink">Livro de movimentações</h2>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 px-5 py-8 text-[12.5px] text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando registros…
          </div>
        ) : (
          <div className="max-h-[620px] overflow-auto scroll-thin">
            <table className="w-full min-w-[820px] border-collapse">
              <thead className="sticky top-0 bg-paper/95 backdrop-blur">
                <tr className="border-b border-line text-left">
                  {['Data', 'Tipo', 'Medicamento', 'Lote', 'Qtd.', 'Destino', 'Leitura', 'Operador'].map((h) => (
                    <th key={h} className="px-4 py-2.5 label-xs text-ink-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id} className="border-b border-line/60 last:border-0 hover:bg-paper/40">
                    <td className="px-4 py-2.5 num text-[11px] text-ink-muted">{formatDateTime(m.data)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', TIPO_STYLE[m.tipo])}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-ink">{m.medicamento_nome}</td>
                    <td className="px-4 py-2.5 num text-[10.5px] text-ink-muted">{m.lote || '—'}</td>
                    <td className={cn('px-4 py-2.5 num text-[12px]', m.quantidade < 0 ? 'text-ink-muted' : 'text-teal-deep')}>
                      {m.quantidade > 0 ? `+${formatNumber(m.quantidade)}` : formatNumber(m.quantidade)}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-ink-muted">{m.origem_destino || m.cofre || '—'}</td>
                    <td className="px-4 py-2.5 text-[10.5px] text-ink-muted">{LEITURA_LABEL[m.metodo_leitura] || '—'}</td>
                    <td className="px-4 py-2.5 text-[11px] text-ink-muted">{m.operador}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <MovementForm
        open={open}
        onOpenChange={setOpen}
        medicamentos={medicamentos}
        lotes={lotes}
        onCreated={carregar}
      />
    </div>
  );
}