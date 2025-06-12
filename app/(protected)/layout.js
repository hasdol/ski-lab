import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * SEO: Prevent indexing of any protected route
 * @type {import('next').Metadata}
 */
export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProtectedLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
