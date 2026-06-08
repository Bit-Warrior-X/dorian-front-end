# Dorian Front-End

Web dashboard for managing Dorian DDoS protection and WAF services. Built with Vue 3 and Vite.

## Features

- **Dashboard** — overview of protected servers and traffic
- **Servers** — server list, settings, upstream configuration, and blacklists
- **WAF** — anti-CC, geo-location, whitelist/blacklist, rate limiting, and related rules
- **Analytics** — access logs, log export, security analytics, and Layer 4 attack analytics
- **Users** — user management (admin only)
- **Theming** — light/dark mode with persisted preference

## Tech Stack

- [Vue 3](https://vuejs.org/) + [Vue Router](https://router.vuejs.org/)
- [Vite 7](https://vite.dev/)
- [ApexCharts](https://apexcharts.com/) for charts
- [Flatpickr](https://flatpickr.js.org/) for date/time pickers

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (see `package.json` engines and `.nvmrc`)

If your system ships an older Node version (e.g. Ubuntu's default Node 12), use [nvm](https://github.com/nvm-sh/nvm):

```sh
# Install nvm, then:
nvm install    # reads .nvmrc (Node 22)
nvm use
node --version
```

## Project Setup

```sh
npm install
```

## Backend Configuration

The app talks to a Dorian API backend. Configure the base URL and mock mode via Vite environment variables or a runtime config file.

### Environment variables

```sh
# Point at your backend API
VITE_API_BASE_URL=http://localhost:8080

# Use mock auth and server data (useful for local UI development)
VITE_USE_MOCKS=true
```

If `VITE_USE_MOCKS` is not set and no API URL is provided, mocks are enabled automatically.

### Runtime config (`public/config.json`)

For deployments, you can override settings without rebuilding:

```json
{
  "apiBaseUrl": "http://localhost:8080",
  "useMocks": false
}
```

Values in `config.json` take precedence over build-time env vars for `apiBaseUrl`. Env vars take precedence for `useMocks` when explicitly set.

## Development

Start the dev server with hot reload:

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vue DevTools are available at `/__devtools__` when running in dev mode.

## Production

Build optimized static assets:

```sh
npm run build
```

Preview the production build locally:

```sh
npm run preview
```

Serve the `dist/` folder behind your web server (nginx, Caddy, etc.) and ensure `config.json` is available if you need runtime API configuration.

## Project Structure

```
src/
├── api/           # API client and endpoint modules
├── assets/        # Global styles (theme)
├── components/    # Shared UI and page-level views
│   └── views/     # Route-level view components
├── data/          # Static/mock data
├── router/        # Vue Router configuration
├── stores/        # Auth, theme, and notification state
└── utils/         # Shared helpers
public/
└── config.json    # Runtime API configuration
```

## IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (disable Vetur if installed).

## License

Private — not for public distribution.
