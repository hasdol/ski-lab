/**
 * SEO: Prevent indexing login page.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Login | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }) {
  return <>{children}</>;
}
