/**
 * SEO: Protected event page — block crawlers.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Team Event | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TeamEventLayout({ children }) {
  return <>{children}</>;
}
