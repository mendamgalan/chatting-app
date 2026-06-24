# Chatting App

A simple chat application with a React + Vite frontend and an Express + MongoDB backend.

## Project structure

- `backend/` - Express server, API routes, Socket.IO, and MongoDB models
- `frontend/` - React app built with Vite, client-side routing, and chat UI

## Requirements

- Node.js 20+ (or latest LTS)
- npm 10+ (or Yarn / pnpm)
- MongoDB instance or Atlas connection

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Chatting-app
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in `backend/` with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your_jwt_secret
   ```

## Running the app

### Backend

From `backend/`:
```bash
npm run dev
```

### Frontend

From `frontend/`:
```bash
npm run dev
```

Then open the frontend URL shown by Vite (usually `http://localhost:5173`).

## Notes

- The frontend stores auth credentials in `localStorage`.
- The backend uses JWT authentication and protected routes.
- Update the backend `PORT` and `MONGODB_URI` values as needed.

## License

This project is provided as-is.