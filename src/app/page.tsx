'use client';

import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Hero from '@/components/ui/material/Hero';
// import LogoCollection from '@/components/ui/material/LogoCollection';


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
        
        {/* <Features />
        <Divider />
        <Pricing /
        <Divider />
        <FAQ />
        <Divider />
        <Footer /> */}
      </div>
    </AppTheme>
  );
}