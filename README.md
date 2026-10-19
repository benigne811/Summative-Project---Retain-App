# Retain — Personal Expense & Budget Manager

Retain is a personal finance application for recording expenses, tracking monthly budgets, and reviewing spending reports. It includes account authentication, user-owned expense and budget data, and an administrator dashboard for managing shared categories and viewing platform activity.

## Project links

- **Source repository:** [github.com/benigne811/Summative-Project---Retain-App](https://github.com/benigne811/Summative-Project---Retain-App)
- **Live application:** [Retain](https://summative-project-retain-app-1.onrender.com/)
- **Backend health:** [API health check](https://summative-project-retain-app-zm4a.onrender.com/api/health)

## Main features

- Sign up, sign in, persistent sessions, and sign out.
- Create, edit, search, filter, sort, paginate, and delete expenses.
- Filter expenses by category, payment method, date range, and amount range.
- Set, update, and remove monthly budgets; view progress against spending.
- Review dashboard summaries and month-specific reports.
- Admin dashboard with registered-user and expense totals, spending by category, category rankings, recent expenses, and recent registrations.
- Admin category creation, editing, and deletion. Expenses in a deleted category are moved to **Other**.
- Responsive React interface.

## Technologies

- **Frontend:** React, TypeScript, Vite, Redux Toolkit, React Redux, Tailwind CSS, Recharts, Lucide.
- **Backend:** Node.js, TypeScript, Express, PostgreSQL (`pg`) in deployment, with SQLite (`better-sqlite3`) for local development.
- **Authentication:** React Context on the frontend; server-side password hashing and expiring bearer-token sessions on the backend.

## Local setup

Install a current Node.js release, then install and run each part in a separate terminal.

### Backend

```bash
cd server
npm install
```

Create `server/.env`:

```dotenv
PORT=5000
ADMIN_EMAIL=admin@example.com
```

Start the API in development mode:

```bash
npm run dev
```

For local development, the SQLite database is created automatically at `server/data/retain.db`. For deployment, set `DATABASE_URL` to a PostgreSQL connection string before starting the server. The backend creates its tables and default categories on startup. Set `ADMIN_EMAIL` before starting the server, then sign up in the app using that email address to create an administrator account. Normal sign-ups receive the `user` role; role selection is not accepted from the browser.

### Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite. By default, the frontend sends API requests to `http://localhost:5000`. To use a different backend, create `client/.env.local`:

```dotenv
VITE_API_BASE_URL=https://your-api-host.example
```

For production builds, run `npm run build` in both `client` and `server`. Start the compiled backend with `npm start` from `server`.

## API overview

The API defaults to `http://localhost:5000`. Protected endpoints require an `Authorization: Bearer <token>` header. Sign-up and sign-in return a token; the frontend stores it for subsequent requests.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Check API and database status |
| `POST` | `/api/auth/signup` | Public | Create a user account |
| `POST` | `/api/auth/signin` | Public | Sign in and receive a session token |
| `GET` | `/api/auth/me` | Signed in | Get the current user |
| `POST` | `/api/auth/signout` | Signed in | Revoke the current session |
| `GET`, `POST` | `/api/expenses` | Signed in | List or create the current user’s expenses |
| `GET`, `PUT`, `DELETE` | `/api/expenses/:id` | Signed in | Read, update, or delete an owned expense |
| `GET`, `POST` | `/api/budgets` | Signed in | List or create the current user’s budgets |
| `GET`, `PUT`, `DELETE` | `/api/budgets/:id` | Signed in | Read, update, or delete an owned budget |
| `GET` | `/api/categories` | Public | List shared categories |
| `GET` | `/api/categories/:id` | Public | Read one category |
| `POST` | `/api/categories` | Admin | Create a shared category |
| `PUT`, `DELETE` | `/api/categories/:id` | Admin | Update or delete a shared category |
| `GET` | `/api/admin/insights` | Admin | Read platform insights and recent activity |

Expense fields include `title`, `amount`, `categoryId`, `date`, and `paymentMethod`; `description` and `notes` are optional. Monthly budgets use a `month` in `YYYY-MM` format and a numeric `limit`.

## Deployment

The deployed application uses two Render services:

- **Frontend:** [summative-project-retain-app-1.onrender.com](https://summative-project-retain-app-1.onrender.com/)
- **Backend API:** [summative-project-retain-app-zm4a.onrender.com](https://summative-project-retain-app-zm4a.onrender.com)

The repository's `render.yaml` describes a free Render Blueprint for the API and static frontend. For manual service setup, configure the API with root directory `server`, build command `npm ci && npm run build`, start command `npm start`, and health check path `/api/health`. Configure the frontend as a static site with root directory `client`, build command `npm ci && npm run build`, and publish directory `dist`. Set `VITE_API_BASE_URL` on the frontend service to the backend URL, and set `ADMIN_EMAIL` on the backend before registering that address if an administrator account is needed.

The deployed API uses PostgreSQL through the `DATABASE_URL` environment variable. Configure it on the `retain-api` Render service with the PostgreSQL connection string from your database provider. Keep the URL private and never commit it to the repository. If `DATABASE_URL` is not set, the backend falls back to local SQLite; that fallback is not durable on Render's free filesystem. The free Render API may also sleep when idle. See Render's [free service limitations](https://render.com/docs/free).
