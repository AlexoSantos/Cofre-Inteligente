import { useState } from "react";
import { BrainCircuit, Loader2, Download, ShieldCheck, Eraser } from "lucide-react";
import { useCofre } from "@/lib/CofreContext";
import { perform } from "@/lib/cofreApi";
const ACTIONS = {
  confirmar_plano: "Confirmar plano base",
  avaliar_emergencia: "Avaliar alternativa emergencial",
  remanejar: "Priorizar remanejamento",
  aguardar: "Aguardar e monitorar",
  revisar_dados: "Revisar dados antes de decidir",
};
export default function SaiDecisionPanel({ onInclude }) {
  const { view } = useCofre();
  const [busy, setBusy] = useState(null),
    [error, setError] = useState("");
  const a = view.state.analysis;
  const analysis = a?.result;
  const stale = a?.status === "stale";
  async function analyze() {
    setBusy("analyze");
    setError("");
    try {
      await perform("analyze");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  async function clearAnalysis() {
    setBusy("clear");
    setError("");
    try {
      await perform("clear_analysis", { id: a.id });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  function download() {
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(a, null, 2)], { type: "application/json" }),
    );
    const el = document.createElement("a");
    el.href = u;
    el.download = "parecer-sai-" + a.id + ".json";
    el.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  return (
    <section
      className="mt-6 rounded-2xl border border-teal/25 bg-white overflow-hidden"
      aria-label="Decisões com IA SAI"
    >
      <div className="p-5 bg-teal-mist/60 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-3">
          <BrainCircuit className="text-teal shrink-0" size={28} />
          <div>
            <h2 className="text-lg font-medium">Análise SAI integrada às compras</h2>
            <p className="text-xs text-ink-muted mt-1">
              Ao gerar um pedido, o sistema executa ou reutiliza uma análise válida e vincula o
              parecer ao pedido.
            </p>
            <p aria-live="polite" className="text-xs text-teal-deep mt-2">
              {a?.status === "ready"
                ? "Análise atual salva na nuvem"
                : a?.status === "running"
                  ? "SAI analisando o estoque…"
                  : stale
                    ? "Estoque atualizado — nova análise necessária"
                    : a?.status === "failed"
                      ? "A última análise falhou; confira o motivo e tente novamente"
                      : view.state.analyses.length
                        ? "Análise limpa. Clique em Analisar com SAI para gerar um novo parecer."
                        : "Aguardando primeira análise"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis && (
            <button
              type="button"
              onClick={clearAnalysis}
              disabled={!!busy || a?.status === "running"}
              className="flex gap-2 items-center border border-line bg-white text-ink px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {busy === "clear" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Eraser size={16} />
              )}
              {busy === "clear" ? "Limpando…" : "Limpar análise"}
            </button>
          )}
          <button
            type="button"
            onClick={analyze}
            disabled={!!busy || a?.status === "running"}
            className="flex gap-2 items-center bg-teal text-white px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            {busy === "analyze" || a?.status === "running" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <BrainCircuit size={16} />
            )}
            {busy === "analyze" || a?.status === "running" ? "Analisando…" : "Analisar com SAI"}
          </button>
        </div>
      </div>
      {(error || a?.status === "failed") && (
        <p role="alert" className="m-4 p-3 bg-alert-soft text-alert rounded-xl text-sm">
          {error || a.error}
        </p>
      )}
      {stale && (
        <p className="m-4 p-3 rounded-xl bg-signal-soft text-signal text-xs">
          O parecer abaixo é histórico. Os dados mudaram e ele não pode aprovar novas compras.
        </p>
      )}
      {analysis && (
        <div className="p-5 border-t border-line">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-xs text-teal">
                {new Date(analysis.generatedAt).toLocaleString("pt-BR")} · {analysis.model}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
            <button
              onClick={download}
              aria-label="Baixar parecer SAI"
              className="self-start p-2 border border-line rounded-lg"
            >
              <Download size={16} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            {analysis.decisions.map((d) => (
              <article key={d.id} className="border border-line rounded-xl p-4">
                <div className="flex justify-between gap-2">
                  <h3 className="font-medium text-sm">{d.nome}</h3>
                  <span className="text-[10px] text-signal">{d.priority}</span>
                </div>
                <p className="text-xs font-medium text-teal mt-2">{ACTIONS[d.action]}</p>
                <p className="text-xs text-ink-muted leading-relaxed mt-2">{d.reason}</p>
                <p className="text-xs mt-2">
                  <strong>Próximo passo:</strong> {d.nextStep}
                </p>
                {d.checks?.map((c, i) => (
                  <p key={i} className="text-xs text-signal mt-2">
                    {c}
                  </p>
                ))}
                {d.quantidadeBase > 0 && d.action === "confirmar_plano" && (
                  <button
                    disabled={a.status !== "ready"}
                    onClick={() =>
                      onInclude(d.id, {
                        fingerprint: a.fingerprint,
                        model: analysis.model,
                        generatedAt: analysis.generatedAt,
                        reason: d.reason,
                      })
                    }
                    className="mt-3 text-xs bg-teal-mist text-teal-deep rounded-lg p-2 disabled:opacity-40"
                  >
                    Incluir {d.quantidadeBase} un. no plano
                  </button>
                )}
              </article>
            ))}
          </div>
          <p className="text-xs text-ink-muted flex gap-2 mt-4">
            <ShieldCheck size={15} className="shrink-0" />
            Parecer salvo e vinculado ao snapshot {a.fingerprint.slice(0, 16)}. A compra depende da
            aprovação do responsável.
          </p>
        </div>
      )}
    </section>
  );
}
