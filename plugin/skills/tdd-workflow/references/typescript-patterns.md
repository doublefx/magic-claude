# TypeScript / JavaScript — TDD Patterns

**Tools:** Jest or Vitest for unit/integration, Playwright for E2E

## TDD Cycle Commands

```bash
# Run tests
npm test
npx vitest run

# Watch mode during development
npm test -- --watch

# Coverage (enforce 80%)
npm run test:coverage
```

## Unit Test Pattern (Jest/Vitest)

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## API Integration Test Pattern

```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/orders', () => {
  it('returns orders successfully', async () => {
    const request = new NextRequest('http://localhost/api/orders')
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect((await response.json()).success).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/orders?limit=invalid')
    expect((await GET(request)).status).toBe(400)
  })
})
```

## Mocking External Services

```typescript
jest.mock('@/lib/database', () => ({
  db: {
    query: jest.fn(() => Promise.resolve({ rows: [{ id: 1, name: 'Test' }] }))
  }
}))
```

## E2E Test Pattern (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test('user completes checkout flow', async ({ page }) => {
  await page.goto('/cart')
  await page.click('button:has-text("Checkout")')
  await page.fill('input[name="email"]', 'user@example.com')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Order confirmed')).toBeVisible()
})
```

## Coverage Config (Jest)

```json
{
  "jest": {
    "coverageThresholds": {
      "global": { "branches": 80, "functions": 80, "lines": 80, "statements": 80 }
    }
  }
}
```

## File Organization

```
src/
├── components/Button/
│   ├── Button.tsx
│   └── Button.test.tsx
├── app/api/orders/
│   ├── route.ts
│   └── route.test.ts
└── e2e/checkout.spec.ts
```

## Common Mistakes

| Wrong | Correct |
|-------|---------|
| Test internal state (`component.state.count`) | Test observable behavior (`screen.getByText(...)`) |
| Brittle CSS selectors (`.css-class-xyz`) | Semantic selectors (`button:has-text(...)`, `data-testid`) |
| Tests that depend on each other | Each test sets up its own data |
| `test.skip` | Fix or delete the test |
