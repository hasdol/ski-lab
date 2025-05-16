// app/(protected)/layout.js

// ── ❷ Prevent indexing of every protected route ───────────
export const metadata = {
  robots: {
    index:  false,
    follow: false,
  },
};

import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProtectedLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
