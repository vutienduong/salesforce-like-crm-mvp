<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sales CRM MVP

This project is a full-stack CRM MVP:

- Frontend: React + Vite
- Backend: Express
- Database: SQLite

The app does not run correctly with plain `vite preview` because the UI depends on backend routes under `/api/*`.

## Prerequisites

- Node.js 20+ recommended

## Run Locally

1. Install dependencies:
   `npm install`
2. Start the full app in development mode:
   `npm run dev`
3. Open:
   [http://localhost:3000](http://localhost:3000)

## Run Production Build Locally

1. Build the frontend:
   `npm run build`
2. Start the production server:
   `npm run start`
3. Open:
   [http://localhost:3000](http://localhost:3000)

## Notes

- `server.ts` serves the Vite app in development and the built `dist/` files in production.
- SQLite data is stored locally in `crm.db`.
- `PORT` can be overridden with an environment variable when deploying.
