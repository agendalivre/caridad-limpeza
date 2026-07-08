# Supabase Edge Functions

Código-fonte das funções que rodam no Supabase (projeto `skhktzjdovthkqqqpinl`).

> ⚠️ **Estas funções NÃO são publicadas com `git push`.** O deploy do site
> (Next.js) vai para a Vercel via GitHub; as Edge Functions vivem no Supabase e
> precisam ser publicadas à parte. Esta pasta é a cópia versionada — mantenha-a
> em sincronia ao editar uma função.

## Funções

| Função | JWT | O que faz |
|---|---|---|
| `disponibilidade` | público (verify_jwt=false) | Retorna os dias/horas ocupados (sem dado de cliente), **incluindo as projeções de clientes recorrentes**. Alimenta os horários de `/reservar` (regra: 1 serviço por dia). |
| `criar-reserva` | público (verify_jwt=false) | Recebe o POST do formulário `/reservar`, faz upsert do cliente + insere o agendamento como `solicitado`, e envia Web Push para Caridad. Tem honeypot `website` anti-spam. |

Ambas são públicas de propósito (o formulário do cliente as chama sem login) e
usam a `service_role` internamente.

## Publicar (deploy)

Com a Supabase CLI autenticada:

```bash
supabase functions deploy disponibilidade --project-ref skhktzjdovthkqqqpinl
supabase functions deploy criar-reserva   --project-ref skhktzjdovthkqqqpinl
```

Também dá para publicar pelo painel do Supabase (Edge Functions) ou pelas
ferramentas MCP do Supabase. Como as duas são públicas, mantenha
`--no-verify-jwt` / `verify_jwt=false` ao publicar.

## Variáveis de ambiente (secrets no Supabase)

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — injetadas automaticamente.
- VAPID (Web Push) fica na tabela `config_interna` (`chave = 'vapid'`), lida por
  `criar-reserva/push.ts`.
