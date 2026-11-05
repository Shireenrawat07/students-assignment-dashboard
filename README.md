# Student Assignment & Review Dashboard

## Project Overview

The Student Assignment & Review Dashboard is a frontend application for managing assignments and tracking student submissions. It is built with React and uses mock account data, seeded assignments, and browser `localStorage` for persistence. There is no backend, and the demo login is not real authentication.

## Features

### Admin

- Create, edit, and delete assignments owned by the signed-in admin.
- Assign an assignment to all students or select individual students.
- View each assigned student's submission status and assignment completion progress.
- Search assignments, filter by completion status, and sort by due date.
- See overdue assignments highlighted.

### Student

- View only assignments assigned to their account, including descriptions, due dates, status, and Google Drive links.
- Confirm a submission through a two-step confirmation before updating its status.
- Track assigned, pending, submitted, and overall completion counts.
- Search assignments, filter by status, and sort by due date; overdue work is identified.

### Shared

- Switch between light and dark themes. The preference is saved in `localStorage`.
- Use seeded demo data for two admin accounts and five student accounts; account details are shown on the login page without listing passwords here.

## Setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- Git

### Install and run

```sh
git clone https://github.com/Shireenrawat07/student-assignment-board.git
cd student-assignment-board
npm install
npm run dev
```

Open the local address printed by Vite. Choose a demo account from **View demo accounts** to fill in the login form. Use **Switch account** in a dashboard to return to the login page and select another role or account.

### Testing

```sh
npm test
```

This runs the automated tests for authentication, role-based access, assignment ownership and creation, and student submission rules.

Run the linter and production build checks with:

```sh
npm run lint
npm run build
```

Tests use Node.js's built-in test runner (`node --test`), and the production build is created with Vite.

## Folder Structure

```text
student-assignment-board/
├── src/
│   ├── components/
│   │   ├── AssignmentCard.jsx
│   │   ├── AssignmentModal.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── EmptyState.jsx
│   │   ├── FilterBar.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── SearchBar.jsx
│   │   └── StatCard.jsx
│   ├── context/
│   │   └── AppContext.jsx
│   ├── data/
│   │   └── seedData.js
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── Login.jsx
│   │   └── StudentDashboard.jsx
│   ├── utils/
│   │   ├── assignmentRules.js
│   │   └── storage.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── tests/
│   ├── assignmentRules.test.js
│   └── authService.test.js
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

- `src/components/` contains reusable interface elements shared across pages, such as assignment cards, dialogs, filters, progress bars, and navigation.
- `src/context/AppContext.jsx` owns shared user and assignment state and its actions.
- `src/data/seedData.js` defines demo users, initial assignments, and the role-based dashboard path helper.
- `src/pages/` contains the login page and the separate admin and student dashboards.
- `src/utils/storage.js` restores and saves the mock session, assignments, and submission updates in `localStorage`. It validates stored data, migrates legacy seeded assignment IDs, and reports storage errors. When assignment data and submission updates are saved together, it attempts to restore their previous values if either write fails.
- `src/utils/assignmentRules.js` contains login, role, assignment ownership, student visibility, creation authorization, and submission validation rules.
- `src/App.jsx` defines routes, redirects users according to their role, and manages the shared theme preference.
- `src/main.jsx` mounts the router, `AppProvider`, and application.
- `src/index.css` defines the light and dark themes, glassmorphism styling, and reduced-motion behavior.
- `tests/` contains tests for the demo login and role checks, assignment access and creation, and student submission rules.
- `package.json` defines scripts and dependencies; `vite.config.js` configures the React and Tailwind CSS Vite plugins.

## Component Architecture and Data Flow

The application separates shared UI, page-level workflows, shared state, and data rules:

1. `main.jsx` mounts `App` inside `BrowserRouter` and the single `AppProvider`.
2. `AppProvider` initializes the current demo user and assignment data using `storage.js`. It exposes state and actions through the `useApp()` hook defined in the same `AppContext.jsx` file.
3. `App.jsx` reads the current user through `useApp()`, then renders the login page or the dashboard that matches the user's role. It owns theme state and passes the selected theme and toggle callback to the pages.
4. `Login.jsx`, `AdminDashboard.jsx`, and `StudentDashboard.jsx` use `useApp()` to read or update shared state. The dashboards apply search, filters, sorting, and presentation-specific progress calculations to that data.
5. `assignmentRules.js` checks login, role permissions, assignment ownership and student visibility, and validates assignees and student submissions. `AdminDashboard.jsx` also validates assignment form fields, due dates, and Google Drive/Docs URLs; `AppContext.jsx` calls the rules before applying changes.
6. Successful changes are written through `storage.js` to `localStorage`; React context updates then cause the relevant UI to render the new state.

Reusable components in `components/` keep common interface patterns consistent between the two dashboards. Page components compose these shared elements while keeping each role's workflow separate.

## Key Design Decisions

- **React Context for shared state:** A single `AppProvider` makes the current user, assignments, and actions available to login and dashboard pages without passing them through many intermediate components.
- **Local storage instead of a backend:** The project is a frontend-only demonstration. `localStorage` retains the mock session, assignment changes, submission updates, and theme preference across browser refreshes; it is not a server-side data store.
- **Mock authentication:** Login checks the credentials against local demo users. It demonstrates role-specific flows but does not provide real authentication or account security.
- **Role-based access and ownership:** `App.jsx` routes admins and students to their corresponding dashboards. Assignment rules limit admins to assignments they created and students to assignments assigned to them; submission actions also validate the student's identity and assignment eligibility.
- **Reusable components and responsive layouts:** Shared cards, controls, dialogs, navigation, and progress components reduce repeated UI. Responsive Tailwind CSS classes adapt the layout to available screen sizes.
- **Validation and persistence safety:** Assignment forms validate required fields, due dates, student selection, and HTTPS Google Drive/Docs URLs. Assignment rules check who may create or submit assignments and which students can be assigned. Storage helpers validate and migrate restored data, report storage errors, and attempt to restore previous assignment and submission values if a multi-key save fails.
- **Visual and motion preferences:** The interface uses a light glassmorphism style with cyan accents, includes a persistent dark theme, and respects reduced-motion preferences.
