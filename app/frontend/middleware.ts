/**
 * ルート保護ミドルウェア。
 * 認証が必要なページへの未ログインアクセスをリダイレクトする。
 *
 * 注意: Next.js middleware はサーバーサイドで動くため localStorage にアクセスできない。
 * トークンは Cookie に保存することで middleware から参照する。
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** 認証必須のパスプレフィックス */
const PROTECTED_PATHS = ["/dashboard", "/study-plan", "/plans", "/sessions"];

/** 未ログイン時のみアクセスするパス（ログイン済みなら dashboard へ） */
const AUTH_ONLY_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));

  // 未ログインで保護ルートにアクセス → ログインページへリダイレクト
  if (isProtected && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みで認証ページにアクセス → ダッシュボードへリダイレクト
  if (isAuthOnly && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
