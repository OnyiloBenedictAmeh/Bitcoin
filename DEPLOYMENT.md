# S STORE deployment checks

1. Add every variable listed in `.env.example` to Vercel for Preview and Production.
2. Confirm the Neon migration `db/migrations/001_commerce_foundation.sql` has run.
3. Deploy and request `/api/health`; it must return `{ "ok": true }`.
4. Test product upload, customer registration/login, checkout, transaction-ID submission, and admin payment confirmation.
5. Keep the Bitcoin receiving address in Vercel environment configuration only. Do not store it in Neon or commit it.

The in-memory rate limiter is a baseline for serverless instances. Use Vercel WAF or an edge-backed rate-limit provider before high-volume production traffic.
