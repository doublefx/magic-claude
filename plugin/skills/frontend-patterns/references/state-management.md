# State Management Patterns

## Context + Reducer Pattern

Combines `useReducer` for predictable state transitions with Context for provider-based distribution.
Prefer this over prop-drilling for moderately complex shared state; reach for Zustand/Jotai for
larger apps.

```typescript
interface State {
  markets: Market[]
  selectedMarket: Market | null
  loading: boolean
}

type Action =
  | { type: 'SET_MARKETS'; payload: Market[] }
  | { type: 'SELECT_MARKET'; payload: Market }
  | { type: 'SET_LOADING'; payload: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MARKETS':
      return { ...state, markets: action.payload }
    case 'SELECT_MARKET':
      return { ...state, selectedMarket: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

const MarketContext = createContext<{
  state: State
  dispatch: Dispatch<Action>
} | undefined>(undefined)

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    markets: [],
    selectedMarket: null,
    loading: false
  })

  return (
    <MarketContext.Provider value={{ state, dispatch }}>
      {children}
    </MarketContext.Provider>
  )
}

export function useMarkets() {
  const context = useContext(MarketContext)
  if (!context) throw new Error('useMarkets must be used within MarketProvider')
  return context
}
```

### Guidelines

- Keep actions descriptive and typed as a discriminated union — no stringly-typed types.
- Export a custom hook (`useMarkets`) that guards against missing providers.
- Split large reducers into sub-reducers combined with `combineReducers`-style helpers.
- For server state (fetching, caching, invalidation) prefer React Query / TanStack Query over
  hand-rolled Context reducers.
