import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { fetchRecomendacoes } from '@/lib/api';
import { formatBRL, formatNumber } from '@/lib/format';

export default function SimulatorPanel({ item }) {
  const [demandaPct, setDemandaPct] = useState(0);
  const [prazo, setPrazo] = useState(item.prazoEscolhido);
  const [alvo, setAlvo] = useState(item.alvo);
  const [sim, setSim] = useState(null);

  const payload = useMemo(
    () => ({
      medicamento_id: item.medicamento_id,
      demanda_pct: demandaPct,
      prazo_dias: prazo,
      cobertura_alvo: alvo,
    }),
    [item.medicamento_id, demandaPct, prazo, alvo]
  );

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const data = await fetchRecomendacoes(payload);
        if (alive) setSim(data.simulacao);
      } catch (e) {
        if (alive) setSim(null);
      }
    }, 420);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [payload]);

  return (
    <div className="rounded-xl border border-line bg-paper/50 p-4">
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="h-3.5 w-3.5 text-teal" strokeWidth={1.9} />
        <p className="label-xs text-ink-muted">E se o cenário mudar</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex justify-between text-[11px]">
            <span className="text-ink-muted">Variação do consumo</span>
            <span className="num text-ink">{demandaPct > 0 ? '+' : ''}{demandaPct}%</span>
          </div>
          <Slider value={[demandaPct]} min={-40} max={80} step={5} onValueChange={(v) => setDemandaPct(v[0])} />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-[11px]">
            <span className="text-ink-muted">Prazo de entrega</span>
            <span className="num text-ink">{prazo} dias</span>
          </div>
          <Slider value={[prazo]} min={2} max={30} step={1} onValueChange={(v) => setPrazo(v[0])} />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1.5 flex justify-between text-[11px]">
            <span className="text-ink-muted">Cobertura alvo</span>
            <span className="num text-ink">{alvo} dias</span>
          </div>
          <Slider value={[alvo]} min={10} max={60} step={5} onValueChange={(v) => setAlvo(v[0])} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
        <div>
          <p className="label-xs text-ink-muted">Compra</p>
          <p className="num mt-0.5 text-[14px] text-ink">
            {sim ? `${formatNumber(sim.quantidade)}` : '—'}{' '}
            <span className="text-[10px] text-ink-muted">{item.unidade}</span>
          </p>
        </div>
        <div>
          <p className="label-xs text-ink-muted">Valor</p>
          <p className="num mt-0.5 text-[14px] text-ink">{sim ? formatBRL(sim.valor) : '—'}</p>
        </div>
        <div>
          <p className="label-xs text-ink-muted">Cobertura</p>
          <p className={`num mt-0.5 text-[14px] ${sim?.risco_ruptura ? 'text-alert' : 'text-ink'}`}>
            {sim ? `${formatNumber(sim.cobertura, 1)} d` : '—'}
          </p>
        </div>
      </div>
      {sim?.risco_ruptura && (
        <p className="mt-2 text-[10.5px] leading-relaxed text-alert">
          Neste cenário a entrega chega depois da ruptura: é preciso antecipar o pedido ou usar um fornecedor mais
          rápido.
        </p>
      )}
    </div>
  );
}