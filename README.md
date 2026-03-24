# Product Catalog Admin

This project is a small full-stack product catalog system with dynamic category attributes.

Admins can create categories, define custom attributes for each category, and then add products using forms that adjust automatically based on those attribute definitions.

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB
- Search: OpenSearch

## What It Does

- Create and manage categories
- Define dynamic attributes per category
- Create and edit products
- Render product forms based on category settings
- Search and filter products

## Project Structure

- `backend/` Express API and database logic
- `frontend/` React admin app

## Run Locally

### Requirements

- Node.js 22+
- MongoDB running locally
- OpenSearch running locally

### Backend

```bash
cd backend
copy .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
```

Backend runs on `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## API

Swagger docs are available at `http://localhost:3000/api-docs`

Main endpoints:

- `/api/categories`
- `/api/products`
- `/api/search`

## Notes

- Backend environment settings are in `backend/.env`
- The frontend expects the backend to be available on port `3000`
- Seed data can be loaded with `npm run seed`
