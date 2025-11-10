# ClinicAdmin - Small Clinic Management Dashboard

Thank you for purchasing ClinicAdmin! This is a comprehensive clinic management solution built with modern technologies (React, Node.js, TypeScript, TailwindCSS).

This documentation will guide you through installation, configuration, and customization.

---

### Project Features

* **📅 Interactive Appointment Calendar:** FullCalendar integration with drag-and-drop, resizing, and appointment creation.
* **👥 Comprehensive Patient Management:** Detailed patient profiles, advanced search, filtering, and patient records.
* **💳 Billing & Payments:** Manage invoices, track payment statuses (Pending, Paid), and export to **PDF** or **Excel (SheetJS)**.
* **💊 Simple Inventory Management:** Manage your medications and supplies, and receive alerts for critical stock levels (Low Stock filter).
* **🧑‍⚕️ Staff Management (Admin):** Create, edit, or delete Doctor and Receptionist accounts.
* **📊 Reporting Dashboard:** Instantly track your clinic's health with KPI cards (Total Patients, Daily Revenue, etc.) and time-series charts (Sales, New Patients).
* **⚙️ Clinic Settings:** Easily manage essential settings like opening hours, currency, and clinic name.

---

### Technical Stack

* **Frontend:** React 18+, TypeScript, Vite, TailwindCSS
* **UI (Interface):** Radix UI Primitives (Shadcn/ui style)
* **State (State Management):** Zustand (Global State), React Hook Form (Form State)
* **Data Fetching:** TanStack Query (React Query)
* **Tables:** TanStack Table (react-table)
* **Charts:** Recharts
* **Calendar:** FullCalendar
* **Backend:** Node.js, Express, TypeScript
* **Database (Demo):** Better-SQLite3
* **Authentication:** JWT (Role-Based Access Control - Admin, Doctor, Reception)
* **Deployment:** Docker & Docker Compose (with Nginx)

---

### 🚀 Quick Start (Docker - Recommended)

The easiest and fastest way to get the project running is by using Docker Compose.

1.  Ensure you have **Docker** and **Docker Compose** installed on your system.
2.  Unzip the purchased `.zip` file and navigate to the project root directory (e.g., `/clinicadmin`).
3.  Navigate into the `/server` directory.
4.  Copy `/server/.env.example` to `/server/.env`.
5.  Open the new `/server/.env` file and set a strong, random `JWT_SECRET` (e.g., using `openssl rand -base64 32`).
6.  Return to the project root directory (`/clinicadmin`).
7.  Run the following command in your terminal:

    ```bash
    docker-compose up -d --build
    ```

8.  That's it!
    * **Frontend (React App):** `http://localhost:3000`
    * **Backend (API):** `http://localhost:5001`

### Demo Database and Users

The Docker setup is configured to use the demo database. To populate it with the demo data (50 patients, 10 doctors, 200 appointments), you must run the `seed` script manually *while Docker is running*.

*To seed the demo database (while Docker is running):*

```bash
# Get inside the running server container
docker-compose exec server /bin/sh

# Once inside, run the seed script
npm run seed

# Exit the container
exit