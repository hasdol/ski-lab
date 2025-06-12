/**
 * SEO: Prevent indexing password reset page.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Reset Password | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({ children }) {
  return <>{children}</>;
}
