# SecurePay Full Project
Frontend (Vite + React) and Backend (Express + Prisma SQLite) prototype.
Run backend: set up node, npm install in backend and run migrations with prisma, then start.
Run frontend: npm install in frontend and `npm run dev`.
This is a prototype for the UI/UX and backend flows.


## Postgres & Paystack Setup
This backend has been converted to use PostgreSQL with Prisma. Add the following environment variables to run in production or locally:

- DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DBNAME
- PAYSTACK_SECRET_KEY=your_paystack_secret_key
- PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret (optional, used to verify webhook signatures)
- PASSWORD_PEPPER=your_server_side_pepper

### Endpoints added
- POST /api/paystack/deposit/initiate  -> body: { userId, amountCents, currency, email }
- POST /api/paystack/withdraw/initiate -> body: { userId, amountCents, beneficiaryBankCode, beneficiaryAccountNumber }
- POST /api/webhook/paystack            -> Paystack webhook endpoint (raw body required)

Important: For webhook to work, expose your server publicly (ngrok for dev) and configure the webhook URL in your Paystack dashboard.
