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
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-sm',
    secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-300 focus:ring-surface-400',
    ghost:     'text-surface-600 hover:text-surface-900 hover:bg-surface-100 focus:ring-surface-400',
    danger:    'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 shadow-sm',
    outline:   'border border-surface-300 text-surface-700 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 focus:ring-brand-400',
  }

  const sizes = {
    sm:  'text-xs px-3 py-1.5',
    md:  'text-sm px-4 py-2',
    lg:  'text-sm px-5 py-2.5',
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
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'blue'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-surface-100 text-surface-600 border border-surface-200',
    success: 'bg-success-50 text-success-600 border border-success-100',
    warning: 'bg-warning-50 text-warning-600 border border-warning-100',
    danger:  'bg-danger-50  text-danger-600  border border-danger-100',
    info:    'bg-brand-50   text-brand-600   border border-brand-100',
    blue:    'bg-brand-50   text-brand-600   border border-brand-100',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children:   React.ReactNode
  className?: string
  hover?:     boolean
  onClick?:   () => void
  glow?:      boolean
}

export function Card({ children, className, hover, onClick, glow }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white border border-surface-300 rounded-xl shadow-card',
        hover && 'hover:border-brand-300 hover:shadow-card-lg transition-all duration-200 cursor-pointer',
        glow  && 'border-brand-300 shadow-card-lg ring-1 ring-brand-100',
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
        <label className="text-xs font-medium text-surface-600">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-surface-500 text-sm pointer-events-none">{prefix}</span>
        )}
        <input
          className={clsx(
            'w-full bg-white border rounded-lg text-sm text-surface-900 placeholder-surface-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all',
            error ? 'border-danger-400 bg-danger-50' : 'border-surface-300 hover:border-surface-400',
            prefix ? 'pl-8' : 'px-3',
            suffix ? 'pr-16' : 'pr-3',
            'py-2',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-surface-500 text-xs font-mono pointer-events-none">{suffix}</span>
        )}
      </div>
      {error && <p className="text-xs text-danger-600">{error}</p>}
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
        <label className="text-xs font-medium text-surface-600">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full bg-white border rounded-lg text-sm text-surface-900 px-3 py-2',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all',
          error ? 'border-danger-400' : 'border-surface-300 hover:border-surface-400',
          className
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-white text-surface-900">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger-600">{error}</p>}
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
        className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={clsx(
        'relative w-full bg-white border border-surface-200 rounded-2xl shadow-modal animate-slide-up',
        sizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="font-semibold text-surface-900 text-base">{title}</h2>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-600 transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-100"
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
  color?:    'blue' | 'teal' | 'amber' | 'green' | 'red' | 'purple'
}

export function StatCard({ label, value, unit, icon, trend, trendVal, color = 'blue' }: StatCardProps) {
  const wrappers = {
    blue:   'bg-white border-surface-200',
    teal:   'bg-white border-surface-200',
    amber:  'bg-white border-surface-200',
    green:  'bg-white border-surface-200',
    red:    'bg-white border-surface-200',
    purple: 'bg-white border-surface-200',
  }
  const iconBg = {
    blue:   'bg-brand-50 text-brand-500',
    teal:   'bg-brand-50 text-brand-500',
    amber:  'bg-warning-50 text-warning-500',
    green:  'bg-success-50 text-success-500',
    red:    'bg-danger-50 text-danger-500',
    purple: 'bg-purple-50 text-purple-500',
  }

  return (
    <div className={clsx(
      'rounded-xl border shadow-card p-4',
      wrappers[color]
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">{label}</span>
        {icon && (
          <span className={clsx('w-8 h-8 flex items-center justify-center rounded-lg', iconBg[color])}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-surface-900">
          {typeof value === 'number' ? value.toLocaleString('en-BD') : value}
        </span>
        {unit && <span className="text-sm text-surface-500">{unit}</span>}
      </div>
      {trendVal && (
        <p className={clsx(
          'text-xs mt-1.5',
          trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-surface-500'
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
        <h1 className="font-bold text-surface-900 text-xl tracking-tight">{title}</h1>
        {subtitle && <p className="text-surface-500 text-sm mt-0.5">{subtitle}</p>}
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
      <div className="w-14 h-14 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-400 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-surface-800 text-base mb-1">{title}</h3>
      <p className="text-surface-500 text-sm max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
