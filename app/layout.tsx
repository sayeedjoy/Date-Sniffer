import './styles.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Date Sniffer',
  description: 'Extract post dates from TikTok and LinkedIn',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}



