## E6Data AI Database Frontend

This project is a React + Vite frontend for the AI Database Assistant. It connects to a FastAPI backend to analyze database performance logs.

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn

---

## Frontend Setup (React + Vite)

1. Go to the frontend directory:

   ```sh
   cd e6data_aidatabase_frontend
   ```

2. Install dependencies:

   ```sh
   npm install
   # or
   yarn install
   ```

3. Set the backend URL in a `.env` file:

   ```env
   VITE_BACKEND_URL=http://127.0.0.1:8000
   ```

4. Start the frontend dev server:

   ```sh
   npm run dev
   # or
   yarn dev
   ```

---

## Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Upload your database logs in JSON format using the provided template.
3. Chat with the assistant to get analysis and optimization suggestions.

---

## Troubleshooting

- Make sure both backend and frontend servers are running.
- Ensure your `.env` files are correctly set up.
- If you see CORS errors, check that the backend allows requests from the frontend URL.
