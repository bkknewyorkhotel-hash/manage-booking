import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value || request.headers.get('Authorization')?.split(' ')[1]

    const isAuthPage = request.nextUrl.pathname.startsWith('/login')
    const isApiRoute = request.nextUrl.pathname.startsWith('/api')
    const isPublicApi = request.nextUrl.pathname.startsWith('/api/auth/login')

    if (isPublicApi) return NextResponse.next()

    if (!token) {
        if (isApiRoute) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (!isAuthPage) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        return NextResponse.next()
    }

    const payload = await verifyJWT(token)

    if (!payload) {
        if (isApiRoute) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }
        if (!isAuthPage) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        return NextResponse.next()
    }

    // Basic RBAC example: If user is housekeeping, prevent access to administrative settings
    // This can be expanded as needed.
    if (request.nextUrl.pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
