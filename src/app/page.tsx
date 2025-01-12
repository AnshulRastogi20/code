'use client';

import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Hero from '@/components/ui/material/Hero';
// import LogoCollection from '@/components/ui/material/LogoCollection';
// import Highlights from '@/components/ui/material/Highlights';
import Pricing from '@/components/ui/material/Pricing';
import Features from '@/components/ui/material/Features';
// import Testimonials from '@/components/ui/material/Testimonials';
import FAQ from '@/components/ui/material/FAQ';
import Footer from '@/components/ui/material/Footer';
import AppTheme from '@/components/shared-theme/AppTheme';
import ColorModeSelect from '@/components/shared-theme/ColorModeSelect';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const { data: session } = useSession();
    const router = useRouter();
    
    // Move redirect logic to useEffect
    React.useEffect(() => {
      if (session?.user) {
        router.push('/schedule');
      }
    }, [session, router]);
  
  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Hero />
      <div>
        {/* <LogoCollection /> */}
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        
        <Features />
        <Divider />
        <Pricing />
        <Divider />
        <FAQ />
        <Divider />
        <Footer />
      </div>
    </AppTheme>
  );
}