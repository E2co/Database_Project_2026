# OURVLE Client

The frontend web application for the OURVLE (Our Virtual Learning Environment) system. Built with **React 19**, **TypeScript**, and **Vite** with **Tailwind CSS** styling.

## 📋 Project Overview

This is a modern, responsive web interface for the OURVLE educational platform, providing students and lecturers with access to:
- **Dashboard** - Overview of courses, grades, and upcoming events
- **Courses** - Browse and view course content with detailed course pages
- **Assignments** - View, submit, and track assignment submissions
- **Calendar** - Academic calendar with events, lectures, and deadlines
- **Forums** - Participate in course discussion forums
- **Reports** - View academic performance and progress reports
- **Authentication** - User registration and login with JWT tokens

## 🛠️ Tech Stack

- **React 19** - Modern UI framework with latest features
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
- **shadcn/ui** - Pre-built accessible components
- **Axios** - HTTP client for API requests
- **React Router v7** - Client-side routing
- **date-fns** - Date manipulation library
- **Lucide React** - Icon library

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components (login, register)
│   ├── dashboard/            # Dashboard layout and content
│   ├── courses/              # Course listing and detail pages
│   ├── assignments/          # Assignment viewing and submission
│   ├── calendar/             # Academic calendar
│   ├── forums/               # Discussion forum interface
│   ├── reports/              # Academic reports and analytics
│   ├── ui/                   # Reusable shadcn/ui components
│   └── theme-provider.tsx    # Theme configuration
├── hooks/
│   ├── use-mobile.ts         # Mobile responsiveness detection
│   └── use-toast.ts          # Toast notification system
├── lib/
│   └── utils.ts              # Utility functions
├── api.ts                    # API client setup with Axios
├── App.tsx                   # Main application component
├── main.tsx                  # Application entry point
└── index.css                 # Global styles

@/components/               # Imported UI components from shadcn/ui
@/lib/                      # Utility functions and helpers
hooks/                      # Global React hooks
public/                     # Static assets
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js

### Installation

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint to check code quality
npm run lint
```

## 🔌 API Integration

The client communicates with the backend Flask API via Axios. API endpoints are configured in [src/api.ts](src/api.ts).

### Authentication Flow

1. User registers or logs in via the auth forms
2. Backend returns JWT token
3. Token is stored in local storage/cookies
4. Subsequent requests include token in `Authorization: Bearer <token>` header
5. API validates token and returns user-specific data

### Key API Endpoints

- `POST /register` - User registration
- `POST /login` - User login
- `GET /courses` - Fetch courses
- `GET /courses/<id>` - Get course details
- `GET /assignments` - Get assignments
- `POST /assignments/<id>/submit` - Submit assignment
- `GET /calendar` - Get calendar events
- `GET /forums` - Get discussion forums
- `GET /reports` - Get academic reports

## 🎨 Styling

The project uses **Tailwind CSS 4** with custom configuration via `tailwind.config.ts`. Components are built with **Radix UI** primitives and styled with shadcn/ui presets.

### Color & Theme

Customize theme variables in the Tailwind config or update the theme provider component.

## 📦 Dependencies

See [package.json](package.json) for the complete list of dependencies and versions.

Key dependencies:
- `react@^19.2.5` - UI framework
- `vite@^8.0.10` - Build tool
- `tailwindcss@^4.2.4` - CSS framework
- `@radix-ui/*` - UI component library
- `axios@^1.16.0` - HTTP client
- `react-router-dom@^7.15.0` - Routing
- `typescript@~6.0.2` - Type checking

## 📝 Development Guidelines

### Code Style

- Follow the existing component structure
- Use TypeScript for all new files (`.tsx` for components, `.ts` for utilities)
- Use functional components with hooks
- Follow the ESLint configuration

### Component Structure

```tsx
import { FC } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  // Define props
}

export const MyComponent: FC<MyComponentProps> = ({ ... }) => {
  return (
    // Component JSX
  );
};
```

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port (5174, 5175, etc.)

### API Connection Issues

- Ensure the Flask backend is running on the correct port
- Check CORS configuration in both client and server
- Verify the API URL in [src/api.ts](src/api.ts)

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)

## 👥 Contributing

Follow the established code style and component patterns. Ensure all ESLint checks pass before submitting changes.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
