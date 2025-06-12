/**
 * SEO: Create ski — internal use only.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Create Ski | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateSkiLayout({ children }) {
  return <>{children}</>;
}
