import { useState } from 'react';
import { ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDate, daysUntil } from '@/lib/format';

export default function CodeLookup({ medicamentos, lotes }) {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);

  const buscar = (e) => {
    e.preventDefault();
    const termo = codigo.trim().toLowerCase();
    if (!termo) return;

    const lote = lotes.find(
      (l) => (l.codigo_unico || '').toLowerCase() === termo || (l.lote || '').toLowerCase() === termo
    );
    if (lote) {
      const med = medicamentos.find((m) => m.id === lote.medicamento_id);
      setResultado({ tipo: 'lote', lote, med });
      return;
    }
    const med = medicamentos.find((m) => (m.codigo_gtin || '').toLowerCase() === termo);
    if (med) {
      setResultado({ tipo: 'medicamento', med });
      return;
    }
    setResultado({ tipo: 'nao_encontrado' });
  };

  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-2">
        <ScanLine className="h-4 w-4 text-teal" strokeWidth={1.8} />
        <h2 className="text-[14px] font-medium text-ink">Identificar item no cofre</h2>
      </div>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
        Leia o código de barras do fabricante ou o código do lote impresso pelo cofre. Itens sem código legível caem na
        conferência assistida, sem redigitação.
      </p>
      <form onSubmit={buscar} className="mt-3 flex gap-2">
        <Input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Ex.: 7891234500017 ou MS-01-IM-1000"
          className="num h-10 rounded-xl border-line bg-paper/60 text-[12.5px]"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-ink px-3.5 text-[12px] font-medium text-white"
        >
          Ler
        </button>
      </form>

      {resultado?.tipo === 'lote' && (
        <div className="mt-3 rounded-xl border border-teal/25 bg-teal-mist/60 p-3">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-deep">
            <CheckCircle2 className="h-3.5 w-3.5" /> Lote identificado
          </p>
          <p className="mt-1 text-[12.5px] text-ink">{resultado.lote.medicamento_nome}</p>
          <p className="num mt-0.5 text-[11px] text-ink-muted">
            Lote {resultado.lote.lote} · {resultado.lote.quantidade} un · validade {formatDate(resultado.lote.validade)} (
            {daysUntil(resultado.lote.validade)} d) · {resultado.lote.cofre}
          </p>
        </div>
      )}

      {resultado?.tipo === 'medicamento' && (
        <div className="mt-3 rounded-xl border border-teal/25 bg-teal-mist/60 p-3">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-deep">
            <CheckCircle2 className="h-3.5 w-3.5" /> Medicamento identificado
          </p>
          <p className="mt-1 text-[12.5px] text-ink">{resultado.med.nome}</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            Selecione o lote no registro de movimentação para manter o rastreio por lote.
          </p>
        </div>
      )}

      {resultado?.tipo === 'nao_encontrado' && (
        <div className="mt-3 rounded-xl border border-signal/30 bg-signal-soft p-3">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-signal">
            <AlertCircle className="h-3.5 w-3.5" /> Código não localizado
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
            Pode ser um item sem código de barras legível (ampola fracionada ou embalagem hospitalar). Use a seleção
            assistida do medicamento na movimentação: o lançamento fica vinculado ao lote e ao operador.
          </p>
        </div>
      )}
    </div>
  );
}