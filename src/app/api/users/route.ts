
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                createdAt: true
            }
        })
        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const username = body.username?.trim()
        const { password, name, role } = body

        if (!username || !password || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const user = await prisma.user.create({
            data: {
                username,
                password, // In production, hash this!
                name,
                role
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'User already exists or other error' }, { status: 400 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, role, password } = body

        const data: any = { name, role }
        if (password) data.password = password

        const user = await prisma.user.update({
            where: { id },
            data
        })

        return NextResponse.json(user)
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 400 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        await prisma.user.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 400 })
    }
}
