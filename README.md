# Saturday League Football Frontend

This project delivers the web experience for the Saturday League Football platform. It consumes the Rails API, presents live standings, supports match management, and offers admin workflows for player and team maintenance.

## Highlights

- Championship dashboard with standings, recent results, and upcoming fixtures.
- Team and player directories with statistics sourced from the backend.
- Match management views for creating, updating, and tracking fixtures.
- Responsive layout built with the SarradaHub design system.
- Global state handled with Zustand stores and React Query style data hooks.

## Tech Stack

- React 19 with TypeScript and Vite.
- UI composed with the SarradaHub design system and shared helpers in `src/shared`.
- Routing powered by React Router and nested layouts under `src/app`.
- API integration handled in `src/states` with typed client helpers.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an `.env` file based on `.env.example` and set `VITE_API_URL` to the Rails backend endpoint.
3. Launch the development server:
   ```bash
   npm run dev
   ```

The app runs on `http://localhost:5173` by default and proxies API calls to the configured backend.

## Scripts

- `npm run lint`: Run ESLint with type aware rules.
- `npm run test`: Execute unit and component tests with Vitest.
- `npm run build`: Produce an optimized production bundle.

## Project Layout

- `src/app`: Global shell, routing, and layout primitives.
- `src/features`: Feature specific screens and components grouped by domain (championships, matches, players, teams).
- `src/states`: Zustand stores and API clients.
- `src/shared`: Design system elements and utilities reused across features.
