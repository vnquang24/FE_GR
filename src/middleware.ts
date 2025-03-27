import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Kiểm tra nếu đang ở trang chủ
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Lấy token từ cookies
  const accessToken = request.cookies.get('accessToken')?.value
  
  // Xác định trang hiện tại có phải trang authentication hay không
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // Nếu đã đăng nhập (có access token) và cố truy cập trang login
  if (accessToken && isAuthPage) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Nếu chưa đăng nhập (không có access token) và cố truy cập trang được bảo vệ
  if (!accessToken && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

// Chỉ định các routes cần được middleware xử lý
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}