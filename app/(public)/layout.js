'use client';

/**
 * Public layout — wrap with providers or layout logic specific to public pages.
 * SEO is handled in root layout or overridden per-page.
 */
import PWARegister from '@/components/PWARegister';

export default function PublicLayout({ children }) {
  return (
    <>
      <PWARegister />
      {children}
    </>
  );
}
