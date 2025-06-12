/**
 * SEO: Account settings — block indexing.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Account Settings | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({ children }) {
  return <>{children}</>;
}
