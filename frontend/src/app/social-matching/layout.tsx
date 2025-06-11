import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Social Dining | Tablify',
  description: "Join compatible dining companions based on your shared interests with Tablify's social matching feature.",
};

export default function SocialMatchingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="social-matching-layout">
      {children}
    </div>
  );
}
