import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/transactions/:path*', '/goals/:path*', '/portfolio/:path*'],
}
