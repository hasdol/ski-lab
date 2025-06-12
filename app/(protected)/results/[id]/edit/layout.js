/**
 * SEO: Edit result — block crawlers.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Edit Test Result | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function EditResultLayout({ children }) {
  return <>{children}</>;
}
