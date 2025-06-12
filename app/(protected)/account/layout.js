/**
 * SEO: User account page — block indexing.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'My Account | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountLayout({ children }) {
  return <>{children}</>;
}
