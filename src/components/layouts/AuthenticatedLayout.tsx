import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import Navbar from '../ui/material/Navbar';
import AppTheme from '../shared-theme/AppTheme';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppTheme>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navbar />
        <Container 
          sx={{ 
            pt: { xs: 8, sm: 12 }, 
            pb: { xs: 8, sm: 12 },
            mt: '64px' // Space for fixed navbar
          }}
        >
          <Toaster position="top-center" />
          {children}
        </Container>
      </Box>
    </AppTheme>
  );
}
