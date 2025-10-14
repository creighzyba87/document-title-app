# Copilot Instructions for This Codebase

## Overview
This project is a React frontend built with Vite. It provides a UI for uploading documents and receiving AI-generated title suggestions from a backend API. The codebase is minimal and focused on a single workflow: file upload and title display.

## Architecture & Data Flow
- **Frontend:** React (see `src/App.jsx`, `src/main.jsx`)
- **Build Tool:** Vite (see `vite.config.js`)
- **API Communication:** Uses Axios to POST files to a backend endpoint defined by `VITE_API_URL` in `.env`.
- **Environment:** The `.env` file contains multiple `VITE_API_URL` entries; only the last one is used by Vite. Update as needed.

## Key Files & Patterns
- `src/App.jsx`: Main UI logic. Handles file selection, upload, and displays the suggested title.
- `src/main.jsx`: App entry point. Renders the `App` component.
- `vite.config.js`: Vite configuration, includes React plugin.
- `eslint.config.js`: ESLint config with custom rules (e.g., ignore unused vars starting with uppercase or underscore).
- `.env`: Only the last `VITE_API_URL` is effective.

## Developer Workflows
- **Start Dev Server:** `npm run dev`
- **Build for Production:** `npm run build`
- **Lint:** `npm run lint`
- **Preview Build:** `npm run preview`
- **Update API URL:** Edit `.env` (last `VITE_API_URL` wins).

## Conventions & Notes
- Use functional React components and hooks.
- API endpoint is dynamic via `import.meta.env.VITE_API_URL`.
- File uploads use `multipart/form-data`.
- No TypeScript or test setup by default.
- No custom routing; single-page app.

## Integration Points
- Backend API must support `POST /upload` and return `{ title: string }`.
- Update `.env` to point to the correct backend before running.

## Example: Upload Flow
1. User selects a file.
2. `App.jsx` sends file to `${VITE_API_URL}/upload`.
3. Displays the returned title.

---

For questions about backend integration or expanding the app, see `README.md` or ask the project maintainer.
