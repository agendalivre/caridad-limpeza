# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A zero-cost, premium-looking booking + agenda system for **Caridad Ceregido**, an independent cleaning professional in Curitiba (Brazil). The goal is to move her clients off marketplace apps (Parafuzo-style) onto her own private agenda where she keeps 100% of the payment. Live at https://caridad-limpeza.vercel.app.

Two hard constraints drive most decisions:
- **R$ 0 running cost** — no paid gateways, no paid APIs, no cron. Payments use Pix BR Code generated client-side (`lib/pix.ts`); leads are handed off via `wa.me` links; reminders surface client-side because WhatsApp auto-send costs money.
- **Operated by a non-technical person** (Caridad). The `/painel` UI is deliberately simple and one-tap.

UI language is pt-BR. Code comments are mixed Portuguese/Spanish — match the surrounding file.

## Commands

```bash
npm run dev      # local dev (Next.js)
npm run build    # production build
npm start        # serve production build
node scripts/gen-icons.mjs   # regenerate PWA icons (sharp) from source into public/
```

There is **no lint or test setup** — do not invent `npm test`/`npm run lint`. Type checking happens via `next build` (tsc, strict mode, `@/*` path alias → repo root).

Deploy is via **Vercel CLI** (`vercel`), authenticated separately. There is **no `gh` CLI and no git remote** configured — do not attempt GitHub operations.

## Two surfaces, one Next.js app

- **Public** — landing (`app/page.tsx`, composed from `components/*`) and the booking flow `app/reservar/page.tsx`.
- **Private** — `app/painel/*`, Caridad's agenda. Every painel page is wrapped in `components/painel/Guard.tsx`, which redirects to `/painel/login` without a Supabase session.

These are shipped as **two separate PWAs** with distinct manifests: clients get `public/manifest.webmanifest` (linked from root `app/layout.tsx`), Caridad gets `public/painel.webmanifest` (linked via a metadata override in `app/painel/layout.tsx`). `InstallButton` installs whichever PWA matches the current page, so the panel is installed from `/painel/qr`. One shared `public/sw.js` handles offline caching + Web Push.

## Backend (Supabase — external, not in this repo)

Supabase project `skhktzjdovthkqqqpinl` (region sa-east-1). The schema, RLS policies, and Edge Functions live in Supabase, **not in this codebase** — you cannot edit them here; use the Supabase MCP tools or dashboard.

- **Client** — `lib/supabase.ts` exports a browser client (persisted session). Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local.example`).
- **Tables** — `clientes`, `agendamentos`, `pagamentos`, `push_subscriptions`, plus `servicos`/`lembretes`/`avaliacoes`. RLS is restricted to **only Caridad's email**, not `USING(true)`.
- **Realtime** — `app/painel/page.tsx` subscribes to `postgres_changes` on `agendamentos`/`pagamentos` and reloads automatically. Keep painel mutations plain table writes so realtime picks them up.
- **Two public Edge Functions** (called by URL, `verify_jwt=false`, run as `service_role`):
  - `criar-reserva` — the booking form POSTs here (with `keepalive`) to persist the reservation while WhatsApp opens. Has a `website` honeypot field for anti-spam; the form mirrors it as `hp`.
  - `disponibilidade` — returns busy time blocks (no client data) so `/reservar` can compute free slots.

If you change the reservation payload in `app/reservar/page.tsx` or the row shape read in `app/painel/page.tsx`, the corresponding Edge Function / table columns must change in Supabase too.

## Core domain logic (`lib/`)

- **`precos.ts`** — the quote engine. Hours-based **additive** model for a single worker: `horas = round0.5(BASE_IMOVEL + 0.75·quartos + 0.75·banheiros + extra)`, clamped to each service's `minHoras`; price = base hours × `VALOR_HORA` (R$30). Only four services exist: Padrão, Pesada (`extra` +4.5h), Comercial, Passadoria. **Adicionais** are a fixed surcharge (not ×hour) but still add their `horas` to the agenda. Frequency gives a discount. This is the single source of truth for pricing — the `servicos` table is not yet wired in.
- **`agenda.ts`** — `slotsDisponiveis()` turns the busy blocks from `disponibilidade` into free start times (08:00–19:00 jornada, 1h buffer between jobs, hourly slots, future-only for today).
- **`pix.ts`** — builds a Pix "Copia e Cola" BR Code (EMV TLV + CRC-16/CCITT-FALSE) with no gateway. Rendered as a QR via `qrcode.react` in `components/painel/QrPix.tsx`.
- **`whatsapp.ts`** — `linkWhatsApp()` / `mensagemReserva()` build pre-filled `wa.me` messages.
- **`push.ts`** — Web Push subscription (VAPID public key inline; private key lives in Supabase). Subscriptions are upserted into `push_subscriptions` by `components/painel/Notificacoes.tsx`.
- **`config.ts`** — all business constants (name, WhatsApp number, Pix key, review link) are hardcoded here. Update this file, not scattered literals.

## Panel specifics worth knowing

`app/painel/page.tsx` is the largest file and holds most business rules: per-card actions (confirm/conclude/cancel, Cobrar Pix, Marcar pago), destructive actions gated behind a confirmation modal, editable date/time, a **"Rota de hoje"** Google Maps multi-stop link, a **"Para amanhã — lembrar"** section, monthly earnings, and an **"Execução"** control (1 dia / 2 dias + `data2` / com ajudante) for long jobs where one person can't finish in a day. CEP → address+coordinates uses **AwesomeAPI** with **ViaCEP** fallback (coordinates enable the Maps/Moovit links).

## Design system

Editorial-clean look enforced via Tailwind (`tailwind.config.ts`): ivory/paper backgrounds, `ink` text scale, `emerald` accent — **not** teal/gold (explicitly rejected). Fonts are CSS variables `--font-serif` (Fraunces) and `--font-sans` (Inter) set in `app/layout.tsx`. Reusable classes like `card`, `btn-emerald`, `btn-ink`, `btn-ghost`, `container-x` are defined in `app/globals.css` — prefer them over ad-hoc utility soup.
