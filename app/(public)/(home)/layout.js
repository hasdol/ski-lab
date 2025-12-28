/**
 * SEO: Home page metadata (only for `/`).
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Ski Lab',
  description: 'Modern solution for managing XC skis. Built for athletes — by athletes.',
  alternates: { canonical: '/' },
};

export default function HomeLayout({ children }) {
  return <>{children}</>;
}