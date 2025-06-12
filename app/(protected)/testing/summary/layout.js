/**
 * SEO: Test summary — private analytical view, block indexing.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Testing Summary | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestSummaryLayout({ children }) {
  return <>{children}</>;
}
