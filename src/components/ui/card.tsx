import * as React from 'react';
import { mergeName } from '../../lib/utils';

// Lazy initialize Card components to avoid forwardRef being called at module load time
let CardComponent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
const getCard = () => {
  if (!CardComponent) {
    CardComponent = React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement>
    >(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={mergeName(
          'rounded-xl border bg-card text-card-foreground shadow-sm transition-all',
          className
        )}
        {...props}
      />
    ));
    CardComponent.displayName = 'Card';
  }
  return CardComponent;
};

// Lazy initialize CardHeader
let CardHeaderComponent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
const getCardHeader = () => {
  if (!CardHeaderComponent) {
    CardHeaderComponent = React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement>
    >(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={mergeName('flex flex-col space-y-1.5 p-6', className)}
        {...props}
      />
    ));
    CardHeaderComponent.displayName = 'CardHeader';
  }
  return CardHeaderComponent;
};

// Lazy initialize CardTitle
let CardTitleComponent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
const getCardTitle = () => {
  if (!CardTitleComponent) {
    CardTitleComponent = React.forwardRef<
      HTMLHeadingElement,
      React.HTMLAttributes<HTMLHeadingElement>
    >(({ className, ...props }, ref) => (
      <h3
        ref={ref}
        className={mergeName(
          'text-2xl font-semibold leading-none tracking-tight',
          className
        )}
        {...props}
      />
    ));
    CardTitleComponent.displayName = 'CardTitle';
  }
  return CardTitleComponent;
};

// Lazy initialize CardDescription
let CardDescriptionComponent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
const getCardDescription = () => {
  if (!CardDescriptionComponent) {
    CardDescriptionComponent = React.forwardRef<
      HTMLParagraphElement,
      React.HTMLAttributes<HTMLParagraphElement>
    >(({ className, ...props }, ref) => (
      <p
        ref={ref}
        className={mergeName('text-sm text-muted-foreground', className)}
        {...props}
      />
    ));
    CardDescriptionComponent.displayName = 'CardDescription';
  }
  return CardDescriptionComponent;
};

// Lazy initialize CardContent
let CardContentComponent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
const getCardContent = () => {
  if (!CardContentComponent) {
    CardContentComponent = React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement>
    >(({ className, ...props }, ref) => (
      <div ref={ref} className={mergeName('p-6 pt-0', className)} {...props} />
    ));
    CardContentComponent.displayName = 'CardContent';
  }
  return CardContentComponent;
};

// Lazy initialize CardFooter
let CardFooterComponent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
const getCardFooter = () => {
  if (!CardFooterComponent) {
    CardFooterComponent = React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement>
    >(({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={mergeName('flex items-center p-6 pt-0', className)}
        {...props}
      />
    ));
    CardFooterComponent.displayName = 'CardFooter';
  }
  return CardFooterComponent;
};

// Export lazy-initialized components
export const Card = getCard();
export const CardHeader = getCardHeader();
export const CardTitle = getCardTitle();
export const CardDescription = getCardDescription();
export const CardContent = getCardContent();
export const CardFooter = getCardFooter();
