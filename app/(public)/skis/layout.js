/**
 * SEO: Public ski inventory — allow indexing.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Ski Inventory | Ski Lab',
  description: 'View and manage your skis. Explore ski details, performance metrics, and testing history.',
};

export default function SkisLayout({ children }) {
  return <>{children}</>;
}
