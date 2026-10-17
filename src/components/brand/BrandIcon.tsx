interface BrandIconProps {
  className?: string;
}

export function BrandIcon({ className = 'h-8 w-8' }: BrandIconProps) {
  return (
    <img
      src="/icon.svg"
      alt=""
      aria-hidden="true"
      width="64"
      height="64"
      className={`shrink-0 ${className}`}
    />
  );
}
