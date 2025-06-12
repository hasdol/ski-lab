/**
 * SEO: Edit ski — block crawlers.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Edit Ski | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function EditSkiLayout({ children }) {
  return <>{children}</>;
}
