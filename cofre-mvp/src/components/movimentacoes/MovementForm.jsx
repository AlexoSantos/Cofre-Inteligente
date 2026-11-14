import {useCofre} from '@/lib/CofreContext';
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { registrarMovimentacao } from '@/lib/api';
import { formatDate, daysUntil } from '@/lib/format';

const TIPOS = [
  { value: 'saida', label: 'Saída (consumo)' },
  { value: 'entrada', label: 'Entrada (recebimento)' },
  { value: 'perda', label: 'Perda / avaria' },
  { value: 'vencimento', label: 'Descarte por vencimento' },
  { value: 'transferencia', label: 'Transferência entre cofres' },
  { value: 'ajuste', label: 'Ajuste de inventário (quantidade com sinal)' },
];

export default function MovementForm({ open, onOpenChange, medicamentos, lotes, onCreated }) {
  const [medicamentoId, setMedicamentoId] = useState('');
  const [loteId, setLoteId] = useState('');
  const [tipo, setTipo] = useState('saida');
  const [quantidade, setQuantidade] = useState('1');
  const {operatorLabel}=useCofre();
  const operador=operatorLabel;
  const [destino,setDestino]=useState('Cofre B');
  const [codigo,setCodigo]=useState('');
  const [metodo, setMetodo] = useState('codigo_barras');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!open) {
      setMedicamentoId('');
      setLoteId('');
      setTipo('saida');
      setQuantidade('1');
      setObservacao('');
      setErro('');
    }
  }, [open]);

  const lotesDoMed = useMemo(
    () => lotes.filter((l) => l.medicamento_id === medicamentoId),
    [lotes, medicamentoId]
  );

  const loteSel = lotesDoMed.find((l) => l.id === loteId);

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    const qtd = Number(quantidade);
    if (!medicamentoId) return setErro('Selecione o medicamento.');
    if (!loteId) return setErro('Selecione o lote.');
    if (!Number.isSafeInteger(qtd) || qtd === 0 || (tipo !== 'ajuste' && qtd < 0)) return setErro('Informe uma quantidade maior que zero.');
    setSalvando(true);
    try {
      await registrarMovimentacao({
        medicamento_id: medicamentoId,
        lote_id: loteId || undefined,
        tipo,
        quantidade: qtd,
        destino,
        metodo_leitura: metodo,
        observacao,
      });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      setErro(err.message || 'Não foi possível registrar a movimentação.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-line bg-paper sm:max-w-[460px]">
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading text-[24px] font-normal tracking-[-0.01em]">
            Registrar movimentação
          </SheetTitle>
          <SheetDescription className="text-[12px] text-ink-muted">
            O lançamento atualiza o saldo do lote e alimenta o motor de recomendação.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={salvar} className="mt-5 space-y-4">
          <label className="block text-xs text-ink-muted">Código do lote ou GTIN
            <div className="flex gap-2 mt-1"><Input value={codigo} onChange={e=>setCodigo(e.target.value)} placeholder="Leia ou digite o código"/><button type="button" className="border border-line px-3 rounded-xl text-ink" onClick={()=>{const l=lotes.find(l=>l.codigo_unico===codigo.trim()||l.lote===codigo.trim());const m=medicamentos.find(m=>m.codigo_gtin&&m.codigo_gtin===codigo.trim());if(l){setMedicamentoId(l.medicamento_id);setLoteId(l.id);setMetodo('qr_lote');setErro('');}else if(m){setMedicamentoId(m.id);setLoteId('');setMetodo('codigo_barras');setErro('Produto identificado. Confirme o lote abaixo.');}else setErro('Código não localizado. Confirme medicamento e lote manualmente.');}}>Identificar</button></div>
          </label>
          <div className="space-y-1.5">
            <Label className="text-[11.5px] text-ink-muted">Medicamento</Label>
            <Select value={medicamentoId} onValueChange={(v) => { setMedicamentoId(v); setLoteId(''); }}>
              <SelectTrigger className="h-10 rounded-xl border-line bg-white text-[12.5px]">
                <SelectValue placeholder="Selecionar item" />
              </SelectTrigger>
              <SelectContent>
                {medicamentos.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-[12.5px]">
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11.5px] text-ink-muted">Lote</Label>
            <Select value={loteId} onValueChange={setLoteId} disabled={!medicamentoId}>
              <SelectTrigger className="h-10 rounded-xl border-line bg-white text-[12.5px]">
                <SelectValue placeholder={medicamentoId ? 'Selecionar lote' : 'Escolha o medicamento'} />
              </SelectTrigger>
              <SelectContent>
                {lotesDoMed.map((l) => (
                  <SelectItem key={l.id} value={l.id} className="text-[12.5px]">
                    {l.lote} · {l.quantidade} un · val. {formatDate(l.validade)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loteSel && (
              <p className="num text-[10.5px] text-ink-muted">
                Vence em {daysUntil(loteSel.validade)} dias · {loteSel.cofre} · {loteSel.posicao}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11.5px] text-ink-muted">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="h-10 rounded-xl border-line bg-white text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-[12.5px]">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11.5px] text-ink-muted">Quantidade</Label>
              <Input
                type="number"
                min={tipo === "ajuste" ? undefined : "1"}
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="num h-10 rounded-xl border-line bg-white text-[12.5px]"
              />
            </div>
          </div>

          {tipo==='transferencia'&&<label className="block text-xs">Cofre de destino<select value={destino} onChange={e=>setDestino(e.target.value)} className="block w-full border border-line rounded-xl p-3 mt-1"><option>Cofre A</option><option>Cofre B</option></select></label>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11.5px] text-ink-muted">Operador</Label>
              <Input
                value={operador}
                readOnly
                className="h-10 rounded-xl border-line bg-white text-[12.5px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11.5px] text-ink-muted">Leitura</Label>
              <Select value={metodo} onValueChange={setMetodo}>
                <SelectTrigger className="h-10 rounded-xl border-line bg-white text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="codigo_barras" className="text-[12.5px]">Código de barras</SelectItem>
                  <SelectItem value="qr_lote" className="text-[12.5px]">QR do lote</SelectItem>
                  <SelectItem value="cofre_automatico" className="text-[12.5px]">Cofre (automático)</SelectItem>
                  <SelectItem value="manual" className="text-[12.5px]">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11.5px] text-ink-muted">Observação</Label>
            <Input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder={tipo==='ajuste'?'Obrigatória para ajuste':'Opcional'}
              required={tipo==='ajuste'}
              className="h-10 rounded-xl border-line bg-white text-[12.5px]"
            />
          </div>

          {erro && <p className="text-[11.5px] text-alert">{erro}</p>}

          <button
            type="submit"
            disabled={salvando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[12.5px] font-medium text-white disabled:opacity-60"
          >
            {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Registrar e atualizar estoque
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}