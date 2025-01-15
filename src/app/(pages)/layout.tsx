'use client'

// import '../globals.css'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/sign-in')
    }
  }, [status, router, session])

  if (status === 'loading') {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <CircularProgress />
      </Box>
    )
  }

  return <AuthenticatedLayout>
    {children}
    </AuthenticatedLayout>
}

