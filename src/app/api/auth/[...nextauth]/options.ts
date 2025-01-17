// route.ts
import  { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/sign-in',
    signOut: '/auth/sign-in',
    error: '/auth/sign-in', // Error code passed in query string as ?error=
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      
      await connectDB();
      const existingUser = await User.findOne({ email: user.email });
      
      if (!existingUser) {
        const newUser = await User.create({
          email: user.email,
          name: user.name,
          image: user.image,
        });
        user._id = newUser._id.toString();
      } else {
        user._id = existingUser._id.toString();
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString();
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {  
        session.user._id = token._id; 
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },
};




