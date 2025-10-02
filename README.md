# Contribs — TFSA Tracker

A minimal, friendly TFSA contribution tracker built with Next.js, Firebase Auth/Firestore, Recharts, and Tailwind. It supports Google sign-in, adding contributions and withdrawals, automatic limit calculations, a net contributions chart, and auto dark mode.

## Features

- Google sign-in with Firebase Auth
- Add contributions and withdrawals with date and amount
- Summary with available room now, totals, and next year's room from this year's withdrawals
- Net contributions chart over time (contributions − withdrawals)
- Records list with remove actions
- Auto dark mode via prefers-color-scheme
- Wealthsimple-inspired light/dark theme with CSS variables

## Tech stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS v4
- Firebase (Auth, Firestore)
- Recharts for charting

## Getting started

1. Install dependencies

```cmd
npm install
```

2. Create a Firebase project and enable Google authentication
- Go to Firebase Console → Build → Authentication → Sign-in method → Enable Google
- Create a Firestore database in production or test mode

3. Create environment variables

Create a `.env.local` file in the project root with your Firebase config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the dev server

```cmd
npm run dev
```

Visit http://localhost:3000.

## Data model

Collection: `contributions`
- `uid`: string (user id)
- `type`: "contribution" | "withdrawal"
- `amount`: number
- `date`: string (YYYY-MM-DD)
- `createdAt`: number (ms)

Collection: `users`
- `birthYear`: number

## How TFSA room is calculated here

- Annual limits are encoded from 2009–2025 in `components/Summary.tsx`.
- Eligibility starts in year: `max(2009, birthYear + 18)`.
- Available room now = sum of annual limits up to current year + withdrawals from all prior years − contributions up to current year.
- This year's withdrawals are displayed and will be added to next year's room (not current year).

Note: Always confirm your official room with CRA My Account. This tool is for tracking and education.

## Theming

- CSS variables are defined in `app/globals.css` and flip automatically with `prefers-color-scheme`.
- Components use variables like `--ws-bg`, `--ws-card`, `--ws-text`, `--ws-border`, `--ws-accent`, etc.

## Linting & formatting

```cmd
npm run lint
npm run format
```

## Build

```cmd
npm run build
npm start
```

## License

MIT © 2024 Ahmad Masud
