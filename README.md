# VChron

VChron is maintained as one repository with separate frontend and backend applications.

## Frontend

The React client is in `frontend/`. Configure Vercel's Root Directory as `frontend`; its `vercel.json` defines the production build. Use Node.js 22 and set `REACT_APP_BACKEND_URL` to the backend origin, such as `https://api.vcron.cloud`.

```sh
cd frontend
npm ci
npm run build
```

## Backend

The Fastify, Prisma, and PostgreSQL API is in `backend/`. Keep production secrets in `backend/.env`; never commit that file. The API service should run with `backend/` as its working directory.

```sh
cd backend
npm ci
npm run prisma:generate
npm run build
npm start
```

The frontend is deployed by Vercel. The backend is deployed separately as a Node.js service; both codebases and their shared changes are versioned here.
