'use client';

/**
 * Public layout — wrap with providers or layout logic specific to public pages.
 * SEO is handled in root layout or overridden per-page.
 */
export default function PublicLayout({ children }) {
  return <>{children}</>;
}
