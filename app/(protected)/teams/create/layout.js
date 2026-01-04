/**
 * SEO: Create team — internal use only.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Create Team | Ski Lab',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreateTeamLayout({ children }) {
  return (
    <div className="p-4 max-w-4xl w-full self-center">
      {children}
    </div>
  );
}
