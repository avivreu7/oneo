'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-blue/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        primary:  'bg-ps-blue text-white hover:bg-ps-mid shadow-[0_1px_3px_rgba(0,80,230,0.3),0_4px_12px_rgba(0,80,230,0.2)]',
        gold:     'bg-game-gold text-white hover:brightness-110 shadow-[0_1px_3px_rgba(200,139,0,0.3),0_4px_12px_rgba(200,139,0,0.2)]',
        success:  'bg-game-green text-white hover:brightness-110 shadow-[0_1px_3px_rgba(4,120,87,0.3)]',
        danger:   'bg-game-red text-white hover:brightness-110 shadow-[0_1px_3px_rgba(200,20,0,0.3)]',
        outline:  'border border-app-border bg-app-surface text-app-text hover:bg-app-bg hover:border-ps-blue/40',
        ghost:    'text-app-muted hover:bg-app-bg hover:text-app-text',
        // Answer buttons — clean solid colors
        answer_a: 'bg-ps-blue   text-white hover:bg-ps-mid   shadow-[0_2px_8px_rgba(0,80,230,0.25)]  hover:shadow-[0_4px_16px_rgba(0,80,230,0.35)]',
        answer_b: 'bg-[#5B21B6] text-white hover:bg-[#4C1D95] shadow-[0_2px_8px_rgba(91,33,182,0.25)] hover:shadow-[0_4px_16px_rgba(91,33,182,0.35)]',
        answer_c: 'bg-[#047857] text-white hover:bg-[#065F46] shadow-[0_2px_8px_rgba(4,120,87,0.25)]  hover:shadow-[0_4px_16px_rgba(4,120,87,0.35)]',
        answer_skip: 'bg-game-amber text-white hover:brightness-110 shadow-[0_2px_8px_rgba(180,83,9,0.25)]',
        // Projector-specific (white on dark bg)
        proj_primary: 'bg-white text-ps-dark hover:bg-white/90 shadow-[0_2px_12px_rgba(0,0,0,0.3)]',
        proj_outline: 'border border-ps-border text-white hover:bg-white/10',
      },
      size: {
        sm:     'h-9 px-4 text-sm',
        md:     'h-11 px-5 text-sm',
        lg:     'h-12 px-7 text-base',
        xl:     'h-14 px-9 text-lg',
        answer: 'h-[4.5rem] w-full px-5 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
export { Button, buttonVariants };
