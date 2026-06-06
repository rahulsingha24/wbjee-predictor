import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthProvider from './components/AuthProvider';

export const metadata: Metadata = {
  title: 'WBJEE College Predictor 2026 — Find Your Dream College',
  description:
    'A highly accurate WBJEE College Predictor 2026. Estimate your admission chances using real previous-year cutoff trends and smart prediction logic.',
  keywords: 'WBJEE, college predictor, rank predictor, WBJEE 2026, cutoff, counselling, West Bengal',
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
