// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter"; // ここが正しいか確認
import { PrismaClient } from "@prisma/client"; // ここが正しいか確認

// PrismaClientのインスタンスがグローバルに確保されているか再確認
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;


export const authOptions = {
  // ここで `prisma` インスタンスが正しく渡されているか最重要確認
  adapter: PrismaAdapter(prisma),
  // プロバイダーの設定 (Google OAuth)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token, user }: any) {
      if (session.user) {
        session.user.id = user?.id || token?.sub;
      }
      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };