'use client';

export default function PublicLayout({ children }) {
  // you can add any UI or context providers that only
  // public pages need, or just pass through:
  return <>{children}</>;
}
