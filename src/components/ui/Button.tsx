import { forwardRef, ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'link'
  size?: 'small' | 'middle' | 'large'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'middle', children, className = '', ...props }, ref) => {
    const getClassName = () => {
      const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sagard-yellow/50'
      
      // Size classes
      const sizeClasses = {
        small: 'px-3 py-1.5 text-xs rounded',
        middle: 'px-4 py-2 text-sm rounded-lg',
        large: 'px-6 py-3 text-base rounded-lg'
      }
      
      // Variant classes
      const variantClasses = {
        primary: 'bg-sagard-yellow border-sagard-yellow text-slate-900 hover:bg-amber-500 hover:border-amber-500 hover:shadow-md border',
        ghost: 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 border bg-white',
        link: 'text-sagard-yellow hover:text-amber-600 p-0 border-0 bg-transparent',
        default: 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 border bg-white'
      }
      
      return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
    }

    return (
      <button
        ref={ref}
        className={getClassName()}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
