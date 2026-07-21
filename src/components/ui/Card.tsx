import { forwardRef, HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'shadow'
  children: ReactNode
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', children, className = '', ...props }, ref) => {
    const getClassName = () => {
      const baseClasses = 'bg-white rounded-lg transition-all duration-200'
      
      switch (variant) {
        case 'bordered':
          return `${baseClasses} border border-slate-200 shadow-sm`
        case 'shadow':
          return `${baseClasses} border-0 shadow-md hover:shadow-lg`
        default:
          return `${baseClasses} border border-slate-200`
      }
    }

    return (
      <div
        ref={ref}
        className={`${getClassName()} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
