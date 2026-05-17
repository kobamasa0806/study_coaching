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

/** 認証フローのパス（リダイレクト対象外） */
const AUTH_CALLBACK_PATHS = ["/callback"];

/** 未ログイン時のみアクセスするパス（ログイン済みなら dashboard へ） */
const AUTH_ONLY_PATHS = ["/login", "/register"];

/**
 * Open Redirect 対策: 相対パス（/始まり）のみ許可する。
 * //evil.com や https://evil.com のような外部ドメインは拒否してデフォルトに戻す。
 */
function sanitizeRedirectPath(path: string | null): string {
  if (!path) return "/dashboard";
  if (path.startsWith("/") && !path.startsWith("//")) return path;
  return "/dashboard";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Cognito id_token を Cookie から参照する
  const accessToken = request.cookies.get("id_token")?.value;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));
  // /callback は Cognito リダイレクト先なので認証チェックをスキップする
  if (AUTH_CALLBACK_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 未ログインで保護ルートにアクセス → ログインページへリダイレクト
  if (isProtected && !accessToken) {
    const loginUrl = new URL("/login", request.url);
    // next パラメータは内部パスのみ許可する
    loginUrl.searchParams.set("next", sanitizeRedirectPath(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みで認証ページにアクセス → ダッシュボードへリダイレクト
  if (isAuthOnly && accessToken) {
    // next パラメータが付いている場合は検証してからリダイレクトする
    const next = sanitizeRedirectPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
