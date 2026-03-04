---
name: frontend-patterns
description: Frontend patterns for React and Next.js development. Use when building components, pages, or hooks, setting up state management, optimizing rendering performance (memoization, lazy loading), implementing forms, handling client/server data fetching, or applying accessibility and UI best practices. Consult before implementing any significant frontend feature.
user-invocable: false
context: fork
agent: architect
---

# Frontend Development Patterns

Modern frontend patterns for React, Next.js, and performant user interfaces.

## When to Activate

- Building React or Next.js components
- Implementing state management patterns
- Optimizing frontend performance (lazy loading, memoization)
- Applying accessibility and UI best practices

---

## Component Patterns

- Prefer **composition over inheritance**: build small, focused components that assemble together.
- Use **compound components** (via Context) to share implicit state between a parent and its children without prop-drilling.
- Use the **render props pattern** to inject rendering logic — useful when a component owns async state that the caller needs to control presentation for.

See [references/component-patterns.md](references/component-patterns.md)

---

## Custom Hooks

- `useToggle` — stable boolean toggle with a memoized callback.
- `useQuery` — lightweight data-fetching with loading/error states, callbacks, and manual `refetch`.
- `useDebounce` — delays a rapidly-changing value until it stabilizes (e.g., search input, 500ms).

See [references/custom-hooks.md](references/custom-hooks.md)

---

## State Management

- Combine `useReducer` with Context for moderately complex shared state.
- Type actions as a **discriminated union** — no stringly-typed action types.
- Export a custom hook (`useXxx`) that throws when used outside its provider.
- For server state (fetching, caching, invalidation) prefer **TanStack Query** over hand-rolled reducers.

See [references/state-management.md](references/state-management.md)

---

## Performance Optimization

- `useMemo` for expensive computations; `useCallback` for stable function references passed to memoized children.
- `React.memo` for pure components that receive the same props frequently — profile before adding.
- `lazy` + `Suspense` for code-splitting heavy components (use `next/dynamic` in Next.js).
- `@tanstack/react-virtual` (or `react-window`) for lists with hundreds or thousands of rows.

See [references/performance-optimization.md](references/performance-optimization.md)

---

## Form Handling

- Controlled forms work for simple cases: manage state in React, validate on submit, display field-level errors.
- For complex forms prefer **React Hook Form** (performance) or **Formik** (feature-rich).
- Pair with **Zod** for type-safe validation schemas shared between frontend and backend.

See [references/form-handling.md](references/form-handling.md)

---

## Error Boundaries

- Use class-based `ErrorBoundary` to catch render-time errors in a subtree and show a fallback UI.
- Place boundaries at route/widget boundaries, not at every leaf component.
- Always log in `componentDidCatch` (Sentry, Datadog, etc.) and provide a "Try again" reset.
- In Next.js App Router, use the `error.tsx` file convention instead.

See [references/error-boundary.md](references/error-boundary.md)

---

## Animation Patterns

- Use **Framer Motion** with `AnimatePresence` for mount/unmount transitions (modals, list items).
- Keep interaction durations under 400ms; respect `prefers-reduced-motion` via `useReducedMotion()`.
- For simple hover/color transitions, use Tailwind `transition-*` utilities — no JS library needed.

See [references/animation-patterns.md](references/animation-patterns.md)

---

## Accessibility Patterns

- All interactive widgets must be fully keyboard-operable with correct ARIA roles and states.
- Modals must trap focus while open and restore focus to the trigger on close.
- Meet WCAG AA color contrast (4.5:1 text, 3:1 UI components); all images need descriptive `alt`.
- Consider **Radix UI** or **Headless UI** for pre-built accessible primitives.

See [references/accessibility-patterns.md](references/accessibility-patterns.md)

---

## Reference Files

| File | Contents |
|------|----------|
| [references/component-patterns.md](references/component-patterns.md) | Composition, Compound Components, Render Props |
| [references/custom-hooks.md](references/custom-hooks.md) | useToggle, useQuery, useDebounce |
| [references/state-management.md](references/state-management.md) | Context + Reducer pattern and guidelines |
| [references/performance-optimization.md](references/performance-optimization.md) | Memoization, Code Splitting, Virtualization |
| [references/form-handling.md](references/form-handling.md) | Controlled forms, React Hook Form + Zod |
| [references/error-boundary.md](references/error-boundary.md) | ErrorBoundary class, Next.js error.tsx |
| [references/animation-patterns.md](references/animation-patterns.md) | Framer Motion list and modal animations |
| [references/accessibility-patterns.md](references/accessibility-patterns.md) | Keyboard nav, focus management, WCAG checklist |
