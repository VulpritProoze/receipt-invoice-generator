const fs = require('fs');
const content = \import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'admin' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        if (
          credentials.username === process.env.ADMIN_USERNAME &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: 'admin',
            name: 'Admin User',
            email: 'admin@example.com'
          };
        }
        
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    // defaults are fine
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };\;
fs.writeFileSync('src/app/api/auth/[...nextauth]/route.ts', content);
