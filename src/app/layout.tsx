import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GhostRoute — foundation',
  description:
    'Disaster-aware navigation simulation. Development foundation only.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
