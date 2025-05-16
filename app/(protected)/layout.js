import ProtectedRoute from '@/components/ProtectedRoute';

/** @type {import('next').Metadata} */
export const metadata = {
  robots: { index: false, follow: false },   // still block crawlers
};

export default function ProtectedLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
