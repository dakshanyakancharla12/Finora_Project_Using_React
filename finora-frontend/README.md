# Finora Frontend (React + Vite)

Same Finora design, now as React components.

## Run (Windows PowerShell, inside this folder)
    npm install
    npm run dev

Open http://localhost:5174

The backend (Spring Boot) must be running on http://localhost:8080.
All /api requests are forwarded to it by vite.config.js.

## Folders
- public/css   your original CSS files (unchanged) + budgets.css (was inline in budgets.html)
- public/*.png/jpeg   your images
- src/pages    Dashboard, Transactions, Budgets, Profile, Login, Signup, ForgotPassword
- src/components   Sidebar, TransactionTable, TransactionModal, charts, Toast, ProtectedRoute
- src/api      all backend calls in one place
- src/context  login state (AuthContext)
