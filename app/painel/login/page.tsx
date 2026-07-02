"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { IconSparkle } from "@/components/icons";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/painel");
    });
  }, [router]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    router.replace("/painel");
  }

  const input =
    "w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-emerald-600";

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-ink text-ivory">
            <IconSparkle width={22} height={22} />
          </span>
          <h1 className="font-serif text-2xl font-semibold text-ink">Área da Caridad</h1>
          <p className="mt-1 text-sm text-ink-mute">Entre para ver sua agenda</p>
        </div>

        <form onSubmit={entrar} className="card space-y-4 p-6">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">E-mail</label>
            <input id="email" type="email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="senha" className="mb-1.5 block text-sm font-semibold text-ink">Senha</label>
            <input id="senha" type="password" autoComplete="current-password" className={input} value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button type="submit" disabled={loading} className="btn-emerald btn-lg w-full disabled:opacity-60">
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
