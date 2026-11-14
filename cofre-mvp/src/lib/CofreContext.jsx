import { createContext, useContext, useEffect, useState } from "react";
import { Loader2, Cloud, RefreshCw, Snowflake } from "lucide-react";
import { loadWorkspace } from "./cofreApi";
const Context = createContext(null);
export function useCofre() {
  return useContext(Context);
}
export function CofreProvider({ children }) {
  const [view, setView] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function initialize() {
    setLoading(true);
    setError("");
    try {
      setView(await loadWorkspace(true));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    initialize();
    const update = (e) => {
      setView(e.detail);
      setError("");
    };
    window.addEventListener("cofre-cloud-update", update);
    return () => window.removeEventListener("cofre-cloud-update", update);
  }, []);
  useEffect(() => {
    if (!view) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible")
        loadWorkspace(true).catch((e) => setError("Sincronização interrompida: " + e.message));
    }, 20000);
    return () => clearInterval(id);
  }, [!!view]);
  if (loading)
    return (
      <div className="min-h-screen grid place-items-center bg-paper text-ink">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-teal" />
          <p className="mt-4 text-sm">Abrindo Cofre Inteligente…</p>
        </div>
      </div>
    );
  if (!view)
    return (
      <main className="min-h-screen bg-ink grid place-items-center p-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-7">
          <Snowflake className="text-teal mb-4" size={36} />
          <p className="label-xs text-teal">Imperatech Sistemas</p>
          <h1 className="font-heading text-3xl mt-2">Cofre Inteligente</h1>
          <p role="alert" className="text-sm bg-alert-soft text-alert rounded-xl p-3 mt-5">
            {error || "Não foi possível conectar ao estoque na nuvem."}
          </p>
          <button
            onClick={initialize}
            className="flex gap-2 items-center bg-teal text-white rounded-xl p-3 mt-5"
          >
            <RefreshCw size={15} />
            Tentar novamente
          </button>
        </div>
      </main>
    );
  return (
    <Context.Provider
      value={{
        view,
        operatorLabel: view.health.operator || "Visitante · acesso direto",
        refresh: () => loadWorkspace(true),
      }}
    >
      <div className="lg:pl-[264px] bg-teal-mist border-b border-teal/10 px-5 py-2 flex flex-wrap gap-2 justify-between items-center text-xs text-teal-deep">
        <span className="flex items-center gap-2">
          <Cloud size={15} />
          MVP ativo · acesso direto · dados fictícios ·{" "}
          {error ? "sincronização interrompida" : "nuvem sincronizada"} · revisão{" "}
          {view.state.revision}
        </span>
        <span>Ambiente deste navegador</span>
      </div>
      {error && (
        <p role="alert" className="lg:ml-[264px] bg-signal-soft text-signal text-xs p-2">
          {error}
        </p>
      )}
      {children}
    </Context.Provider>
  );
}
