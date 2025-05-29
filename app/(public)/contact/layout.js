export const metadata = {
  title: 'Contact • Ski Lab',
  description: 'Get in touch with our ski experts',
  alternates: { canonical: 'https://ski-lab.com/contact' },
  robots: {
    index: true, // Ensure indexing
    follow: true,
  },
  openGraph: {
    title: 'Contact Ski Lab Experts',
    url: 'https://ski-lab.com/contact',
    images: [{ url: '/og-image-contact.png' }],
  },
};

export default function ContactLayout({ children }) {
  return children;
}