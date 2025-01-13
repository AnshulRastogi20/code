import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      _id: string;
      email: string;
      name: string;
      image: string;
      isDateStarted: boolean;
      googleId?: string;
    }& DefaultSession['user']
  }

  interface User extends DefaultUser {
    _id: string;
    email: string;
    name: string;
    image: string;
    isDateStarted: boolean;
    googleId: string;
  }
} 

declare module 'next-auth/jwt'{
  interface JWT{
    _id: string;
    email: string;
    name: string;
    image: string;
    isDateStarted: boolean;
    googleId?: string;
  }
}