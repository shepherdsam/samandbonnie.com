import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photos • Bonnie & Sam',
  robots: { index: false, follow: false },
};

export default function PhotosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
