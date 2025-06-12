/**
 * SEO: Subscription plans — block indexing since it's account-specific.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Plans | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlansLayout({ children }) {
  return <>{children}</>;
}
