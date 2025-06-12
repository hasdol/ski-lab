/**
 * SEO: Testing interface — block crawlers.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Ski Testing | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestingLayout({ children }) {
  return <>{children}</>;
}
