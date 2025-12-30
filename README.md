# Ski Lab

**Ski Lab** is a modern platform for cross-country ski testing, inventory management, and performance analysis. Built for athletes, coaches, and brands, Ski Lab helps you log, compare, and share ski test results with ease.

## Features

- **Ski Inventory:** Add, edit, and manage your ski fleet with detailed metadata.
- **Test Logging:** Record test results, compare skis, and analyze performance trends.
- **Performance Analytics:** Visualize ski performance across conditions and over time.
- **Team Collaboration:** Create or join teams, manage members, and share results securely.
- **Advanced Sharing:** Share your data with coaches or teammates using personal share codes and manage access levels.
- **Responsive UI:** Optimized for desktop and mobile, with PWA support for one-tap access at the track.
- **Privacy First:** Your data is private by default; you control who can view or edit your skis and results.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Firebase CLI](https://firebase.google.com/docs/cli) (for backend functions)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/ski-lab.git
   cd ski-lab
   ```

2. **Install dependencies:**
   ```sh
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your Firebase and other config values.

4. **Run the development server:**
   ```sh
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

### Firebase Functions

To emulate or deploy backend functions:

```sh
cd functions
npm install
firebase emulators:start
# or deploy with
firebase deploy --only functions
```

## Project Structure

- `app/` — Next.js app directory (pages, layouts, components)
- `components/` — Shared React components
- `context/` — React context providers (auth, preferences, etc.)
- `functions/` — Firebase Cloud Functions (Node.js backend)
- `helpers/` — Utility and helper functions
- `hooks/` — Custom React hooks
- `lib/` — Firebase and other library integrations
- `public/` — Static assets (images, icons, etc.)

## Scripts

- `npm run dev` — Start the development server
- `npm run build` — Build for production
- `npm run start` — Start the production server
- `npm run lint` — Lint the codebase

## Learn More

- [About Ski Lab](app/(public)/about/page.jsx)
- [Pricing](app/(public)/pricing/page.jsx)
- [Contact](app/(public)/contact/page.jsx)
- [Releases & Changelog](app/(public)/releases/page.jsx)

## License

MIT License. See [LICENSE](LICENSE) for details.

---

© {new Date().getFullYear()} Ski Lab — Built for athletes, by athletes.