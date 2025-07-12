import { DefaultSession } from "next-auth";

// NextAuthのモジュールを拡張
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id?: string; // ユーザーIDを追加
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, when using JWT sessions
   */
  interface JWT {
    id?: string; // JWTにユーザーIDを追加
    // ★補足★ もし DefaultJWT のプロパティも保持したいなら以下のようにします
    // & DefaultJWT;
  }
}