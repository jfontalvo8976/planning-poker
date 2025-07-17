import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Solo procesar rutas de socket.io
  if (request.nextUrl.pathname.startsWith('/socket.io')) {
    // Crear respuesta con headers CORS apropiados
    const response = NextResponse.rewrite(new URL('/api/socket', request.url))
    
    // Headers CORS para Socket.IO
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-socket-id')
    response.headers.set('Access-Control-Allow-Credentials', 'false')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/socket.io/:path*'
}
