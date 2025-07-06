// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions = {
  // PrismaをNextAuthのデータベースアダプターとして使用
  adapter: PrismaAdapter(prisma),
  // プロバイダーの設定 (Google OAuth)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // ユーザーが認証されたときにセッションがどこに保存されるかを指定
  session: {
    strategy: "jwt", // JWT (JSON Web Tokens) を使用
  },
  // 認証関連のページ（ログイン、エラーなど）のパスを指定
  pages: {
    signIn: "/login", // カスタムログインページを使用する場合
  },
  // コールバック関数 (オプション、必要に応じて拡張)
  callbacks: {
    // セッションにユーザーIDを含める
    async session({ session, token, user }: any) {
      if (session.user) {
        session.user.id = user?.id || token?.sub;
      }
      return session;
    },
    // JWTにユーザーIDを含める (strategy: "jwt" の場合)
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