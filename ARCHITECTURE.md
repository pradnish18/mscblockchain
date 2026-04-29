# Architecture Documentation

This document describes the high-level architecture of the mscblockchain project and the reasoning behind its structure.

## Project Structure

The project follows a modular structure, with all source code residing in the `src/` directory. This keeps the root directory clean and separates configuration from implementation.

```text
src/
cat <<EOF > ARCHITECTURE.md
# Architecture Documentation

This document describes the high-level architecture of the mscblockchain project and the reasoning behind its structure.

## Project Structure

The project follows a modular structure, with all source code residing in the src/ directory. This keeps the root directory clean and separates configuration from implementation.

```text
src/
|-- app/          # Next.js App Router (UI Pages and API Routes)
|-- components/   # Reusable UI components (Modular/Domain-driven)
|-- lib/          # Shared utilities and configurations (Prisma, Supabase, etc.)
|-- services/     # Business logic layer (Backend services)
|-- styles/       # Global styles and Tailwind configuration
```

## Separation of Concerns

### Frontend (src/app & src/components)
- **App Router**: Handles routing, page layouts, and server-side rendering.
- **Components**: UI elements organized by domain. We distinguish between 'Base UI' (reusable primitives) and 'Features' (complex UI logic).

### Backend Services (src/services)
To ensure a clean separation between the UI and business logic, all core functionality is encapsulated in the services/ directory. This includes:
- **Fraud Detection**: Logic for analyzing transactions and identifying risks.
- **Remittance Flow**: Management of cross-border payment processes.
- **PDF Generation**: Service for creating transaction receipts and reports.

By moving this logic out of the API routes and into dedicated services, we achieve:
1. **Reusability**: Services can be used in API routes, server components, or background jobs.
2. **Testability**: Business logic can be unit-tested in isolation from the Next.js request/response cycle.
3. **Maintainability**: Clearer boundaries make the codebase easier to navigate and evolve.

## Database & Authentication
- **Prisma**: Used as the ORM for database interactions.
- **Supabase**: Leveraged for authentication and potentially real-time features.
- **Middleware**: Handles authentication checks and route protection.

## Testing Strategy
- **Unit Tests**: Focus on individual services and components (using Vitest).
- **Integration Tests**: Ensure different parts of the system work together (using Python/Pytest for backend flows).
