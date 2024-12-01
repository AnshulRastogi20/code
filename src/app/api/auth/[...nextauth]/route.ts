import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';

const handler = NextAuth({
  session:{
    strategy: 'jwt'
  },
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_ID!,
    clientSecret: process.env.GOOGLE_SECRET!
  })],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            googleId: account.providerAccountId
          });
        }
      }
      return true;
    }
  }
});

export { handler as GET, handler as POST };