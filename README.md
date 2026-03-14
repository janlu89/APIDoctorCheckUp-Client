# APIDoctorCheckUp — Client

A real-time API health monitoring dashboard built with Angular 21. Displays live endpoint status, response time charts, uptime statistics, and incident history. Updates instantly via SignalR — no page refresh needed.

**Live App:** https://api-doctor-check-up-client.vercel.app  
**API Repository:** https://github.com/janlu89/APIDoctorCheckUp-API

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Angular 21 — standalone components |
| State management | Signals + `computed()` + `effect()` |
| Real-time | SignalR (`@microsoft/signalr`) |
| UI components | PrimeNG with Aura theme |
| Charts | PrimeNG Charts (Chart.js) |
| HTTP | Angular HttpClient with functional interceptor |
| Auth | JWT stored in memory signal — never localStorage |
| Change detection | Zoneless (`provideZonelessChangeDetection()`) |
| Deployment | Vercel |

---

## Features

- Live dashboard — endpoint cards update in real time via SignalR
- Status badges — Up (green), Degraded (amber), Down (red), Unknown (grey)
- Endpoint detail — response time line chart, uptime stats (24h / 7d / 30d), incident count
- Recent checks table — live-updating, failed rows highlighted
- Admin panel — create, edit, delete endpoints with reactive forms
- JWT authentication — login, token stored in memory, auto-attached via interceptor
- Auth guard — protects admin routes, redirects to login
- Responsive design — works on mobile and desktop

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Dashboard overview with all endpoint cards |
| `/endpoints/:id` | Public | Endpoint detail with chart and check history |
| `/admin/login` | Public | Admin login form |
| `/admin/endpoints` | JWT required | Create, edit and delete endpoints |

---

## Local Setup

### Prerequisites

- Node.js 20+
- Angular CLI 21 — `npm install -g @angular/cli`
- APIDoctorCheckUp API running locally on port 5292

### Run locally

```bash
git clone https://github.com/janlu89/APIDoctorCheckUp-Client.git
cd APIDoctorCheckUp-Client
npm install
ng serve
```

Open `http://localhost:4200`. The app connects to `http://localhost:5292` by default.

### Environment files

| File | Used for |
|---|---|
| `src/environments/environment.ts` | Local development — points to localhost:5292 |
| `src/environments/environment.prod.ts` | Production — points to your Render.com URL |

To point at your own API, update `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api.onrender.com',
  hubUrl: 'https://your-api.onrender.com/hubs/monitor'
};
```

---

## Deploy Your Own

### Vercel

1. Fork this repository
2. Create a new project at https://vercel.com and import your fork
3. Set **Output Directory** to `dist/APIDoctorCheckUp-Client/browser`
4. Deploy

Vercel runs `npm run build` with the production configuration, which picks up `environment.prod.ts` via `fileReplacements` in `angular.json`.

---

## Project Structure

```
src/
  app/
    core/
      guards/           authGuard — protects admin routes
      interceptors/     authInterceptor — attaches JWT Bearer token
      models/           TypeScript interfaces mirroring backend DTOs
      services/         AuthService, SignalRService, ApiService
    features/
      dashboard/        Landing page with live endpoint cards
      endpoint-detail/  Response time chart, stats, checks table
      admin/            Login page and endpoint management
    layout/
      topbar/           Sticky header with Live/Offline indicator
      shell/            Router outlet wrapper
    shared/
      pipes/            TimeAgoPipe — relative timestamps
      utils/            StatusHelpers — status number to label and CSS class
  environments/         Dev and production environment files
  styles.css            Global design tokens and utility classes
```
