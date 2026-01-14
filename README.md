<h1>Puddle USM</h1>

Puddle USM is a web-based marketplace platform developed as part of the CMT322: Web Engineering & Technologies course. The application is designed exclusively for Universiti Sains Malaysia (USM) students, allowing them to buy and sell items securely within the campus community.

The project focuses on modern web development practices, including secure authentication, session management, and web security techniques using the Next.js framework and Firebase services.

<h2>Key Features</h2>

- USM student-only registration using email domain validation

- Secure user authentication and session management with Firebase

- Automatic session timeout after inactivity

- Role-based access control (Admin and regular users)

- Spam prevention using honeypot technique

- Secure data access using Firestore Security Rules

- Deployed on a live hosting platform with HTTPS enabled

<h2>Technologies Used</h2>

- Frontend: Next.js (React)

- Backend / Services: Firebase Authentication, Firestore

- Validation: Zod

- Styling: Tailwind CSS

- Hosting: Cloud-based hosting with SSL (HTTPS)

<h2>How To Run Locally</h2>

<b>git clone into empty project directory

npm install

npm run dev</b>

<h2>Firebase App Hosting via CLI</h2>

<b>npm install -g firebase-tools

firebase login

firebase init apphosting

firebase deploy</b>

