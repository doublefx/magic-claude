# Form Handling Patterns

## Controlled Form with Validation

Manage all form state in React, validate on submit (or on blur), and display field-level error messages.

```typescript
interface FormData {
  name: string
  description: string
  endDate: string
}

interface FormErrors {
  name?: string
  description?: string
  endDate?: string
}

export function CreateMarketForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    endDate: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be under 200 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await createMarket(formData)
      // Success handling
    } catch (error) {
      // Error handling
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Market name"
      />
      {errors.name && <span className="error">{errors.name}</span>}

      {/* Other fields */}

      <button type="submit">Create Market</button>
    </form>
  )
}
```

## Recommended Libraries

For complex forms, prefer a dedicated library over hand-rolled validation:

| Library | Best for |
|---------|----------|
| **React Hook Form** | Performance-sensitive forms; uncontrolled inputs with minimal re-renders |
| **Formik** | Feature-rich forms; tight Yup schema integration |
| **Zod** (schema only) | Type-safe validation shared with backend |

### React Hook Form + Zod Example

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Required').max(200),
  description: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required')
})

type FormData = z.infer<typeof schema>

export function CreateMarketForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    await createMarket(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Market name" />
      {errors.name && <span className="error">{errors.name.message}</span>}
      <button type="submit">Create Market</button>
    </form>
  )
}
```
