import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// BUTTON (Padrão shadcn/ui customizado Private Banking Obsidian & Gold)
// ============================================================================
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        gold: 'bg-gradient-to-r from-gold-500 to-gold-400 text-obsidian-950 shadow-gold hover:brightness-110',
        emerald: 'bg-emerald-500 text-obsidian-950 hover:bg-emerald-400',
        outline:
          'border border-slate-700/80 bg-obsidian-900/80 text-slate-200 hover:border-gold-500/50 hover:text-gold-300',
        ghost: 'text-slate-300 hover:bg-obsidian-800 hover:text-white',
        danger: 'border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'gold',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

// ============================================================================
// CARD
// ============================================================================
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800/90 bg-obsidian-900/90 p-5 shadow-private backdrop-blur-sm',
        className
      )}
      {...props}
    />
  );
}

// ============================================================================
// BADGE
// ============================================================================
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
  {
    variants: {
      tone: {
        gold: 'border border-gold-500/35 bg-gold-500/15 text-gold-300',
        emerald: 'border border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
        sky: 'border border-sky-500/35 bg-sky-500/15 text-sky-300',
        purple: 'border border-purple-500/35 bg-purple-500/15 text-purple-300',
        rose: 'border border-rose-500/35 bg-rose-500/15 text-rose-300',
        slate: 'border border-slate-700 bg-obsidian-800 text-slate-300'
      }
    },
    defaultVariants: {
      tone: 'slate'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

// ============================================================================
// INPUT & SELECT (Acessíveis com foco dourado institucional)
// ============================================================================
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-lg border border-slate-700/80 bg-obsidian-950/90 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50 disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-10 w-full rounded-lg border border-slate-700/80 bg-obsidian-950/95 px-3 py-2 text-sm text-slate-100 [color-scheme:dark] focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/50',
      className
    )}
    {...props}
  />
));
Select.displayName = 'Select';

// ============================================================================
// SKELETON
// ============================================================================
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-slate-800/70', className)}
    />
  );
}
