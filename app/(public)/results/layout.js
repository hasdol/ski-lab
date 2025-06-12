/**
 * SEO: Public results page — allow indexing.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Results | Ski Lab',
  description: 'View your test results. Edit test data, and analyze ski performance.',
};

export default function ResultsLayout({ children }) {
  return <>{children}</>;
}
