# Doctor Appointment Management System (MERN)

Production-ready full-stack web app with role-based workflows for **Patient**, **Doctor**, and **Admin**.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcrypt, express-validator, node-cron, Twilio WhatsApp
- **Frontend:** React (Vite), React Router, Axios, Recharts, react-hot-toast

## Features

### Authentication & RBAC
- JWT login/register for patient, doctor, admin
- Password hashing with bcrypt
- Protected API routes + role-based authorization

### Patient
- Register/login
- Browse doctor list with specialization
- Book appointment by date/time
- View history
- Cancel appointments
- WhatsApp confirmation on booking

### Doctor
- Login
- Manage availability slots
- View assigned appointments
- Accept/reject/complete appointments

### Admin
- Dashboard statistics (patients, doctors, appointments, pending)
- Add/remove doctors
- View users
- Analytics chart by appointment status

### Notifications
- Twilio WhatsApp integration
- Instant booking confirmation
- Cron-based reminder scheduler (24h before appointment)

## Project Structure

```txt
backend/
frontend/
README.md
```

## Backend Setup

1. Open `backend/`
2. Create `.env` from `.env.example`
3. Install dependencies:
   - `npm install`
4. Run development server:
   - `npm run dev`

Backend default: `http://localhost:5000`

## Frontend Setup

1. Open `frontend/`
2. Create `.env` from `.env.example`
3. Install dependencies:
   - `npm install`
4. Run dev server:
   - `npm run dev`

Frontend default: `http://localhost:5173`

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/doctors`
- `PUT /api/doctors/availability` (doctor)
- `GET /api/doctors/appointments` (doctor)
- `PUT /api/doctors/appointments/:id/status` (doctor)
- `POST /api/appointments` (patient)
- `GET /api/appointments/my` (patient)
- `PUT /api/appointments/:id/cancel` (patient)
- `PUT /api/appointments/:id/reschedule` (patient)
- `GET /api/admin/stats` (admin)
- `POST /api/admin/doctors` (admin)
- `DELETE /api/admin/doctors/:id` (admin)
- `GET /api/admin/users` (admin)
- `GET /api/admin/appointments` (admin)

## Deployment

- **Backend:** Render or Railway
- **Frontend:** Vercel
- **Database:** MongoDB Atlas

Set production environment variables from `.env.example`.

## Notes for FYP

- Supports clean MVC backend architecture
- Includes role-based dashboards and charts
- Mobile responsive layout with sticky navbar/footer
- Production env-based configuration for secrets
