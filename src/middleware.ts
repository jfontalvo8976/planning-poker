import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // No procesar rutas de socket.io - dejar que Next.js las maneje directamente
  if (request.nextUrl.pathname.startsWith('/socket.io')) {
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/socket.io/:path*'
}
