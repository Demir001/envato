# ClinicAdmin - Installation Guide

This guide provides two methods for installing and running the ClinicAdmin application:
1.  **Docker (Recommended):** The easiest method for production or a quick start.
2.  **Manual (Development):** The best method for developers who want to modify the source code.

---

## Prerequisites

Before you begin, ensure you have the following software installed:
* [Node.js](https://nodejs.org/) (Version 18.x or later)
* [npm](https://www.npmjs.com/) (usually included with Node.js)
* [Docker](https://www.docker.com/get-started) (for the Docker method)
* [Docker Compose](https://docs.docker.com/compose/install/) (for the Docker method)

---

## Method 1: Docker (Recommended)

This method builds and runs the Frontend (React/Nginx) and Backend (Node.js) in isolated containers. It's the most reliable way to run the application.

### 1. Configure the Environment (.env)

1.  Navigate to the `/server` directory: `cd server`
2.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
3.  Open the new `.env` file with a text editor.
4.  Set the `JWT_SECRET`. This **must** be a long, random, secret string. You can generate one using:
    ```bash
    openssl rand -base64 128
    ```
5.  Set the `DEMO_ADMIN_PASSWORD`. The default is `demopassword123`.

### 2. Build and Run the Containers

1.  Return to the project root directory (e.g., `/clinicadmin`): `cd ..`
2.  Run the Docker Compose build command:
    ```bash
    docker-compose up -d --build
    ```
    * `--build`: Forces Docker to rebuild the images using the `Dockerfile`s.
    * `-d`: Runs the containers in detached (background) mode.

### 3. Seed the Demo Database

The application is running, but the database is empty. You must run the `seed` script to populate it with demo data (patients, doctors, etc.).

1.  Execute the `seed` script inside the *running* server container:
    ```bash
    docker-compose exec server npm run seed
    ```
    * `docker-compose exec`: Runs a command inside a running container.
    * `server`: The name of the service in `docker-compose.yml`.
    * `npm run seed`: The command to execute (defined in `/server/package.json`).

### 4. Access the Application

* **Frontend:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:5001](http://localhost:5001)

**Demo Login:** `admin@clinic.com` / `demopassword123`

---

## Method 2: Manual (Development)

This method requires running two separate terminals: one for the Backend API (port 5001) and one for the Frontend React App (port 3000).

### 1. Terminal 1: Setup and Run the Backend (Server)

1.  Navigate to the `/server` directory:
    ```bash
    cd server
    ```
2.  Install all dependencies:
    ```bash
    npm install
    ```
3.  Configure the `.env` file (See "Method 1: Step 1" above).
4.  **Seed the Demo Database:** Run the seed script *before* starting the server:
    ```bash
    npm run seed
    ```
    *This will create the `/server/data/clinicadmin-demo.db` file.*
5.  Start the development server (with hot-reload):
    ```bash
    npm run dev
    ```
    *Your backend is now running at `http://localhost:5001`.*

### 2. Terminal 2: Setup and Run the Frontend (Client)

1.  Navigate to the `/client` directory:
    ```bash
    cd client
    ```
2.  Install all dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server (with hot-reload):
    ```bash
    npm run dev
    ```
    *Your frontend is now running at `http://localhost:3000`.*
    *The Vite server (in `vite.config.ts`) is pre-configured to proxy all API requests from `/api` to `http://localhost:5001`.*

### 3. Access the Application

* **Frontend:** [http://localhost:3000](http://localhost:3000)

**Demo Login:** `admin@clinic.com` / `demopassword123`