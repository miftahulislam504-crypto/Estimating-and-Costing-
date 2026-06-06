import React from 'react'
import { clsx } from 'clsx'

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
  icon?:    React.ReactNode
}

export function Button({
  variant = 'primary',
  size    = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-brand-500 text-white hover:bg-brand-400 focus:ring-brand-500 shadow-glow hover:shadow-glow-lg',
    secondary: 'bg-surface-700 text-surface-100 hover:bg-surface-600 focus:ring-surface-500',
    ghost:     'text-surface-300 hover:text-white hover:bg-surface-800 focus:ring-surface-600',
    danger:    'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
    outline:   'border border-surface-600 text-surface-200 hover:border-brand-500 hover:text-brand-400 focus:ring-brand-500',
  }

  const sizes = {
    sm:  'text-xs px-3 py-1.5',
    md:  'text-sm px-4 py-2',
    lg:  'text-base px-6 py-3',
  }

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-surface-700 text-surface-300',
    success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
    warning: 'bg-amber-900/50 text-amber-400 border border-amber-800',
    danger:  'bg-red-900/50 text-red-400 border border-red-800',
    info:    'bg-brand-900/50 text-brand-400 border border-brand-800',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children:  React.ReactNode
  className?: string
  hover?:    boolean
  onClick?:  () => void
  glow?:     boolean
}

export function Card({ children, className, hover, onClick, glow }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface-800 border border-surface-700 rounded-xl',
        hover && 'hover:border-brand-600 hover:bg-surface-750 transition-all duration-200 cursor-pointer',
        glow  && 'shadow-glow border-brand-700',
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:  string
  error?:  string
  hint?:   string
  suffix?: string
  prefix?: string
}

export function Input({ label, error, hint, suffix, prefix, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-surface-400 text-sm pointer-events-none">{prefix}</span>
        )}
        <input
          className={clsx(
            'w-full bg-surface-900 border rounded-lg text-sm text-surface-100 placeholder-surface-500',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all',
            error ? 'border-red-500' : 'border-surface-600 hover:border-surface-500',
            prefix ? 'pl-8' : 'px-3',
            suffix ? 'pr-16' : 'pr-3',
            'py-2',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-surface-400 text-xs font-mono pointer-events-none">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint  && !error && <p className="text-xs text-surface-500">{hint}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string
  error?:   string
  options:  { value: string; label: string }[]
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-surface-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full bg-surface-900 border rounded-lg text-sm text-surface-100 px-3 py-2',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all',
          error ? 'border-red-500' : 'border-surface-600 hover:border-surface-500',
          className
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-surface-900">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open:     boolean
  onClose:  () => void
  title:    string
  children: React.ReactNode
  size?:    'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null

  const sizes = {
    sm:  'max-w-sm',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={clsx(
        'relative w-full bg-surface-800 border border-surface-700 rounded-2xl shadow-card-lg',
        sizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
          <h2 className="font-display font-semibold text-white text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:     string
  value:     string | number
  unit?:     string
  icon?:     React.ReactNode
  trend?:    'up' | 'down' | 'neutral'
  trendVal?: string
  color?:    'teal' | 'amber' | 'green' | 'red' | 'purple'
}

export function StatCard({ label, value, unit, icon, trend, trendVal, color = 'teal' }: StatCardProps) {
  const colors = {
    teal:   'from-brand-900/40 to-brand-800/20 border-brand-700/40',
    amber:  'from-amber-900/40 to-amber-800/20 border-amber-700/40',
    green:  'from-emerald-900/40 to-emerald-800/20 border-emerald-700/40',
    red:    'from-red-900/40 to-red-800/20 border-red-700/40',
    purple: 'from-purple-900/40 to-purple-800/20 border-purple-700/40',
  }
  const iconColors = {
    teal:   'text-brand-400',
    amber:  'text-amber-400',
    green:  'text-emerald-400',
    red:    'text-red-400',
    purple: 'text-purple-400',
  }

  return (
    <div className={clsx(
      'bg-gradient-to-br rounded-xl border p-4',
      colors[color]
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-surface-400 uppercase tracking-wider">{label}</span>
        {icon && <span className={clsx('w-8 h-8 flex items-center justify-center rounded-lg bg-surface-800/50', iconColors[color])}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-display font-bold text-white">{typeof value === 'number' ? value.toLocaleString('en-BD') : value}</span>
        {unit && <span className="text-sm text-surface-400">{unit}</span>}
      </div>
      {trendVal && (
        <p className={clsx(
          'text-xs mt-1',
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-surface-400'
        )}>
          {trendVal}
        </p>
      )}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({
  title, subtitle, action
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display font-bold text-white text-2xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-surface-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon, title, description, action
}: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center text-surface-500 mb-4">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-white text-lg mb-2">{title}</h3>
      <p className="text-surface-400 text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
