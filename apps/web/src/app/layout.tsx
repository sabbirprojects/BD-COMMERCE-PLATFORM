import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BD Commerce Platform | Next-Gen Bangladeshi E-Commerce',
  description: 'High-performance B2C e-commerce platform built for speed, reliability, and local scale.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
