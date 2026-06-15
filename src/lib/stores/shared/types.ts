export type Toast = {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'error'
  action?: {
    label: string
    onClick: () => void
  }
}

export type Theme = 'light' | 'dark' | 'system'
