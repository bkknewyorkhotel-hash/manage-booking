import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signJWT } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        console.log('1. Login API called')
        const { username, password } = await request.json()
        console.log('2. Parsed request:', username)

        const user = await prisma.user.findUnique({
            where: { username },
        })
        console.log('3. Found user:', user?.username)

        if (!user || user.password !== password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        console.log('4. Creating JWT token')
        const token = await signJWT({
            userId: user.id,
            username: user.username,
            role: user.role,
        })
        console.log('5. JWT created')

        const response = NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
            },
        })

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        console.log('6. Returning response')
        return response
    } catch (error) {
        console.error('Login API Error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Check for common connection errors
        let detail = errorMessage
        if (errorMessage.includes('PrismaClientInitializationError')) {
            detail = 'Database connection failed. Please check DATABASE_URL in Vercel.'
        } else if (errorMessage.includes('Invalid credentials')) {
            detail = 'Invalid username or password.'
        }

        return NextResponse.json({
            error: 'Internal Server Error',
            details: detail,
            code: error instanceof Error && 'code' in error ? error.code : undefined
        }, { status: 500 })
    }
}
