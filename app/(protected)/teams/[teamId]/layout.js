/**
 * SEO: Protected team view — block crawlers.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Team Dashboard | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TeamDashboardLayout({ children }) {
  return <>{children}</>;
}
