import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-5 text-sm font-semibold focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'cta-gradient text-white',
        secondary: 'border border-white/15 bg-white/[0.045] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-px hover:border-white/30 hover:bg-white/[0.09] hover:text-white active:scale-[0.98]',
        ghost: 'text-foreground transition-colors hover:bg-muted',
        inverse: 'bg-white text-[var(--bg-base)] transition-colors hover:bg-[#eeeaff]',
      },
      size: { default: 'h-11', lg: 'h-12 px-7 text-[15px]', icon: 'size-11 p-0' },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { buttonVariants };
