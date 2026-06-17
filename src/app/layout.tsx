import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NoteForge - Modern Note-Taking App',
  description: 'A beautiful, collaborative note-taking application with canvas-based drawing, real-time collaboration, and rich export features.',
  keywords: ['notes', 'drawing', 'canvas', 'collaboration', 'notebook'],
  authors: [{ name: 'NoteForge Team' }],
  openGraph: {
    title: 'NoteForge - Modern Note-Taking App',
    description: 'A beautiful, collaborative note-taking application',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('nf_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div id="app-root" className="h-screen w-screen overflow-hidden">
          {children}
        </div>
        <div id="toast-container" className="toast-container" />
        <div id="portal-root" />
      </body>
    </html>
  );
}
