# Animation Patterns

## Framer Motion

Framer Motion is the recommended animation library for React. It handles mount/unmount transitions
via `AnimatePresence`, which React's built-in CSS transitions cannot manage cleanly.

### List Animations

Animate items in and out as they enter or leave a list.

```typescript
import { motion, AnimatePresence } from 'framer-motion'

export function AnimatedMarketList({ markets }: { markets: Market[] }) {
  return (
    <AnimatePresence>
      {markets.map(market => (
        <motion.div
          key={market.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <MarketCard market={market} />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
```

### Modal Animations

Overlay and content animate in/out together; `AnimatePresence` handles the exit sequence.

```typescript
export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

## Guidelines

- Prefer `AnimatePresence` over CSS `display: none` for enter/exit transitions.
- Keep `duration` values under 400ms for UI interactions — longer feels sluggish.
- Respect `prefers-reduced-motion`: wrap animations conditionally or use Framer Motion's
  `useReducedMotion()` hook.
- For simple CSS-only transitions (hover states, color changes), use Tailwind `transition-*`
  utilities instead of a JS library.
