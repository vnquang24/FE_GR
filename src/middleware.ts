import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Định nghĩa danh sách các routes công khai không cần xác thực
const publicRoutes = [
  '/auth/login',
  '/auth/register'
]

// Tối ưu middleware để xử lý nhiều requests cùng lúc
export function middleware(request: NextRequest) {
  // Kiểm tra nếu đang ở trang chủ
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  // Nhanh chóng kiểm tra nếu trang là public route
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    // Kiểm tra token nếu người dùng đã đăng nhập và đang truy cập trang auth
    const accessToken = request.cookies.get('accessToken')?.value
    if (accessToken) {
      return NextResponse.redirect(new URL('/home', request.url))
    }
    return NextResponse.next()
  }
  
  // Xử lý routes được bảo vệ
  const accessToken = request.cookies.get('accessToken')?.value
  if (!accessToken) {
    // Tạo URL chuyển hướng với returnUrl để sau khi đăng nhập có thể quay lại
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Đã xác thực, cho phép tiếp tục
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