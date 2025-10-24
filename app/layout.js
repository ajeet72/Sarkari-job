import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import AuthProvider from '@/components/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sarkari Job Blog - Latest Government Job Updates',
  description: 'Get the latest updates on government jobs, exam notifications, results, and career guidance.',
  keywords: 'sarkari job, government jobs, sarkari result, bank jobs, railway jobs',
  openGraph: {
    title: 'Sarkari Job Blog',
    description: 'Latest Government Job Updates',
    type: 'website'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
