export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse bg-tile ${className}`} />;
}
