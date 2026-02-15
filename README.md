# hackathonFeb2026

🥘 Potluckio!
Simplifying party planning, one dish at a time.

Potluck Pal! is a web application designed to take the stress out of organizing group meals. Hosts can create events, set required categories (Mains, Drinks, Desserts), and share a unique link with guests to claim their contributions in real-time.

🚀 Features
Dynamic Event Creation: Hosts can specify exactly how many of each food category they need.

Glassmorphism UI: A "fantastic," modern interface with animated backgrounds and interactive components.

Real-time Slot Claiming: Guests can see what is still needed and claim a spot instantly.

Secure Authentication: User accounts and data protection via encrypted sessions.

🛠️ Tech Stack
Frontend: HTML5, CSS3 (Custom Glassmorphism & Animations), JavaScript (ES6+).

Backend: Node.js with Express.

Database: (Add your DB here, e.g., MongoDB or Firebase).

Icons & Fonts: FontAwesome 6.4, Google Fonts (Poppins).

🏗️ Data Architecture
Following Object-Oriented Programming (OOP) principles, we structured our data into two core classes:

Event: Manages the unique ID, event metadata, and a collection of slots.

ContributionSlot: Handles the state of individual items (Mains, Drinks, Desserts), tracking whether they are claimed and by whom.

📡 Database & Real-Time Sync
We utilize Firebase Realtime Database (or Firestore) to ensure that potluck slots update instantly across all devices.

Live Updates: When a guest claims a "Dessert" slot, the count updates for every other user currently viewing the page without a refresh.

NoSQL Structure: Data is stored in a flexible JSON-like format, allowing for quick scaling as more food categories are added.

🔐 Authentication (Firebase Auth)
Security is handled through Firebase Authentication, providing a robust and secure entry point for our users.

Account Creation: Secure sign-up and login flow using email and password.

Persistent Sessions: Users stay logged in even after refreshing the page, thanks to Firebase's local state management.

Identity Management: Every event created is linked to a specific uid (User ID), ensuring only the host can edit or delete their potluck details.

hackathonFeb2026/
├── UI/  
│ ├── main.html  
│ ├── claim-event.html
│ └── cEvent.css  
├── backEnd/  
│ └── app.js # Now includes Firebase Admin SDK / Config
├── firebase.json # Firebase configuration (if using CLI)
└── README.md

## 👥 The Team

- **Hossein Gorji** - Lead UI/UX Developer & Git Specialist
- **Adrian Shahnazari** - Backend Architecture & Firebase Integration
