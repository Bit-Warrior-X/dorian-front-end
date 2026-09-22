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

### Build

```sh
cd /home/dorian/dorian-front-end
nvm use          # Node 20.19+ or 22+
npm ci           # first time / after dependency changes
npm run build
```

This writes optimized static assets to `dist/`. nginx already serves that folder for `https://panel.dorian.center` — **no nginx reload is required** after a rebuild. Hard-refresh the browser once if an open tab still shows the old UI.

Preview the production build locally (optional):

```sh
npm run preview
```

### Deploy (update an existing production install)

After changing front-end code:

```sh
cd /home/dorian/dorian-front-end
nvm use
npm run build
```

That is enough. The next page load uses the new `dist/` assets.

### Production `config.json`

For same-origin API access behind nginx (recommended), keep `public/config.json` as:

```json
{
  "apiBaseUrl": "",
  "useMocks": false
}
```

Rebuild after editing `public/config.json`, or edit `dist/config.json` directly for a quick runtime tweak (overwritten on the next build).

### Production nginx config

Installed at `/etc/nginx/conf.d/panel.conf` (this is what `nginx.conf` includes; `sites-enabled` is not used on this host):

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name panel.dorian.center;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;

    server_name panel.dorian.center;

    ssl_certificate /etc/letsencrypt/live/panel.dorian.center/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/panel.dorian.center/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Backend API (must be above the SPA catch-all)
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /servers {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /auth {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /audit-logs {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /users {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /sites {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /waf-rules {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /dashboard {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /analytics {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend production build
    root /home/dorian/dorian-front-end/dist;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

After editing this file on the server:

```sh
sudo nginx -t && sudo systemctl reload nginx
```

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
