# CostyCalendar

CostyCalendar is an application designed to help Generali Italia salespeople manage their appointments easily and efficiently. The app allows users to view, create, edit, and manage appointments, with the ability to add participants and organize meetings.

**Live Application**: [https://costy-calendar.vercel.app](https://costy-calendar.vercel.app)

## Key Features

- **User Management**: Users can register and log in to manage their appointments.
- **Interactive Calendar**: View appointments in an intuitive calendar.
- **Create and Edit Appointments**: Add details such as title, description, timings, and participants.
- **Join Appointments**: Join or leave existing appointments.
- **Real-Time Synchronization**: All data is saved and synchronized using Firebase Firestore.

## Technologies Used

- **React**: Framework for building the user interface.
- **Firebase**: Used for authentication and database (Firestore).
- **CSS Modules**: For modular and reusable styling.

## Requirements

- Node.js (version 20 or higher)
- A Firebase project configured with Firestore and authentication enabled.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/GraphicAudioCoder/CostyCalendar.git
   ```
2. Navigate to the project directory:
   ```bash
   cd CostyCalendar
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure Firebase:
   - Create a project on [Firebase Console](https://console.firebase.google.com/).
   - Copy the Firebase configuration into the `src/firebaseClient.js` file.
5. Start the app:
   ```bash
   npm start
   ```
