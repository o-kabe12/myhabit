# MyHabit アプリ

毎日の習慣を記録・可視化し、継続をサポートする自己成長アプリ。習慣をこなすごとに経験値（XP）が貯まり、レベルアップすることで、ユーザーの「習慣力」や「継続力」をゲーム感覚で可視化し、モチベーション維持を狙います。

## ✨ 機能

-   **認証**: Googleログイン（NextAuth）によるセキュアなユーザー認証。
-   **習慣管理**: 習慣の追加、編集、削除（名前、色、カテゴリ、実行曜日）。
-   **チェックイン**: 毎日の習慣実行を記録。
-   **カレンダー**: GitHubの草スタイルで習慣の達成状況を視覚的に表示。
-   **デイリーメモ**: カレンダーの日付ごとにメモを追加・編集し、日々の振り返りを記録。
-   **ダッシュボード**: 今日の習慣一覧、ユーザーのレベル、XP、習慣数、連続記録数などを表示。
-   **レベルアップシステム**: 習慣達成に応じたXP獲得とレベルアップ。

## 🚀 技術スタック

-   **フレームワーク**: Next.js 15 (App Router)
-   **言語**: TypeScript
-   **スタイリング**: Tailwind CSS
-   **データベース**: PostgreSQL (Neon)
-   **ORM**: Prisma
-   **認証**: NextAuth.js (Google OAuth)
-   **グラフ**: Chart.js / Recharts (今後の実装で選択)
-   **デプロイ**: Vercel

## ⚙️ セットアップ方法

1.  **リポジトリのクローン**:
    ```bash
    git clone [https://github.com/your-username/my-habit.git](https://github.com/your-username/my-habit.git) # ご自身のGitHubリポジトリURLに変更
    cd my-habit
    ```

2.  **依存関係のインストール**:
    ```bash
    npm install
    ```

3.  **環境変数の設定**:
    `.env.local`ファイルを作成し、以下の環境変数を設定します。（値はご自身のものを設定してください）

    ```
    DATABASE_URL="postgresql://user:password@host:port/database"
    NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
    ```
    * `DATABASE_URL`: Neon PostgreSQLデータベースの接続URL。
    * `NEXTAUTH_SECRET`: NextAuth.jsで使用する任意の強力な文字列。
    * `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google Cloud Consoleで取得したOAuth認証情報。

4.  **Prismaスキーマの初期化とDBマイグレーション**:
    （このステップは、データベース接続設定が完了した後に行います）
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **開発サーバーの起動**:
    ```bash
    npm run dev
    ```
    ブラウザで `http://localhost:3000` にアクセスすると、アプリが起動します。