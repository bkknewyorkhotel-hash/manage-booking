import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signJWT } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        console.log('1. Login API called')
        const body = await request.json()
        const username = body.username?.trim()
        const password = body.password

        console.log('2. Parsed request for username:', username)

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 })
        }

        const user = await prisma.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive' // Optional: handle case-insensitivity
                }
            },
        })
        console.log('3. Found user:', user?.username)

        if (!user) {
            console.log('Login Failed: User not found')
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        if (user.password !== password) {
            console.log('Login Failed: Password mismatch')
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
    } catch (error: any) {
        console.error('Login API Error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)

        return NextResponse.json({
            error: errorMessage,
            details: error.stack || 'No stack trace',
            code: error.code || 'UNKNOWN'
        }, { status: 500 })
    }
}
