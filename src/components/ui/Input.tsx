import { forwardRef, InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'borderless'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    const getClassName = () => {
      const baseClasses = 'w-full px-3 py-2 text-sm transition-all duration-200 focus:outline-none'
      
      switch (variant) {
        case 'filled':
          return `${baseClasses} bg-slate-100 border border-slate-200 rounded-lg focus:bg-white focus:border-sagard-yellow focus:ring-2 focus:ring-sagard-yellow/20`
        case 'borderless':
          return `${baseClasses} border-0 border-b-2 border-slate-200 rounded-none focus:border-sagard-yellow px-0`
        default:
          return `${baseClasses} border border-slate-300 rounded-lg focus:border-sagard-yellow focus:ring-2 focus:ring-sagard-yellow/20`
      }
    }

    return (
      <input
        ref={ref}
        className={`${getClassName()} ${className}`}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input
