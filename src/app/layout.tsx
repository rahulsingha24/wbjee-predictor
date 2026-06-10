import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthProvider from './components/AuthProvider';

export const metadata: Metadata = {
  title: 'Future Engineers – WBJEE College Predictor 2026',
  description:
    'For WBJEE 2026 students: discover possible colleges, branches, and admission chances using previous-year cutoff trends.',
  keywords:
    'Future Engineers, WBJEE College Predictor 2026, WBJEE 2026, WBJEE counselling, WBJEE cutoff, engineering colleges West Bengal',

  icons: {
    icon: '/future-engineers-logo-v2.png',
    shortcut: '/future-engineers-logo-v2.png',
    apple: '/future-engineers-logo-v2.png',
  },

  openGraph: {
    title: 'Future Engineers – WBJEE College Predictor 2026',
    description:
      'For WBJEE 2026 students: discover possible colleges, branches, and admission chances using previous-year cutoff trends.',
    url: 'https://fe-wbjee-college-predictor.vercel.app',
    siteName: 'Future Engineers',
    type: 'website',
  },

  twitter: {
    card: 'summary',
    title: 'Future Engineers – WBJEE College Predictor 2026',
    description:
      'For WBJEE 2026 students: discover possible colleges, branches, and admission chances using previous-year cutoff trends.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Prevent flash: read localStorage BEFORE React hydrates and apply class instantly */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('theme');
                  if(t === 'light') document.documentElement.classList.add('light');
                } catch(e) {}
              })();
            `,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow pt-[60px]">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
