/**
 * SEO: Locked skis — block crawlers.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Locked Skis | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LockedSkisLayout({ children }) {
  return <>{children}</>;
}
