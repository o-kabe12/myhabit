import NextAuth from "next-auth";
import { authOptions } from "@/app/api/auth/authOptions";


// NextAuthハンドラーの作成
const handler = NextAuth(authOptions);

// Next.js API ルートとしてエクスポート
// ★重要★ handler を GET と POST としてエクスポートします。
export { handler as GET, handler as POST };