# Claude Guidelines for quarterly-review

## Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server

## Code Style Guidelines
- **Components**: PascalCase, functional components with explicit TypeScript interfaces
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces
- **Imports**: React first, third-party libs next, UI components, then local imports
- **Types**: Prefer explicit typing over inferred types, use interfaces for component props
- **Styling**: Use Tailwind CSS utility classes, follow design system tokens
- **Error Handling**: Try/catch for async operations, conditional error UI rendering
- **State**: Local React state with useState/useCallback/useMemo
- **Patterns**: Client components with server actions for data fetching
- **File Structure**: Page components in app/ directory, reusable UI in components/
- **Comments**: Minimal, document only complex logic or non-obvious decisions
- **Framework**: Next.js with App Router, TypeScript, Supabase backend

This is a bank transaction analysis tool using Next.js, React, TypeScript, and Supabase.