// types/next-auth.d.ts
import NextAuth from 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      _id: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    _id: string;
    googleId: string;
  }
}