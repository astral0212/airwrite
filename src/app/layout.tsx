import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'AirWrite',
  description: 'AirWrite — write in the air with your webcam and capture stylish strokes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
