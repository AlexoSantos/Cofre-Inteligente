import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function SupplierTable({ alternativas = [], escolhido, quantidade }) {
  if (!alternativas.length) {
    return <p className="text-[11.5px] text-ink-muted">Sem ofertas registradas para este item.</p>;
  }

  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="border-b border-line text-left">
            {['Fornecedor', 'Preço un.', 'Prazo', 'Custo total', 'Situação'].map((h) => (
              <th key={h} className="pb-2 pr-4 label-xs text-ink-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alternativas.map((a) => {
            const isChosen = a.fornecedor_nome === escolhido;
            return (
              <tr
                key={a.fornecedor_nome}
                className={cn('border-b border-line/60 last:border-0', isChosen && 'bg-teal-mist/40')}
              >
                <td className="py-2 pr-4 text-[12px] text-ink">
                  {a.fornecedor_nome}
                  {isChosen && <span className="ml-1.5 text-[10px] font-medium text-teal">selecionado</span>}
                </td>
                <td className="py-2 pr-4 num text-[12px] text-ink">{formatBRL(a.preco, 2)}</td>
                <td className="py-2 pr-4 num text-[12px] text-ink-muted">{a.prazo} d</td>
                <td className="py-2 pr-4 num text-[12px] text-ink">
                  {quantidade > 0 ? formatBRL(a.custo_total) : '—'}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                      a.viavel ? 'bg-teal-mist text-teal-deep' : 'bg-alert-soft text-alert'
                    )}
                  >
                    {a.viavel ? 'chega a tempo' : 'após a ruptura'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-[10.5px] leading-relaxed text-ink-muted">
        Custo total inclui o capital imobilizado pelo prazo de entrega (0,035%/dia). Oferta mais barata nem sempre é a
        melhor decisão quando o prazo ultrapassa a cobertura.
      </p>
    </div>
  );
}