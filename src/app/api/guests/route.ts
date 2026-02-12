import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        const guests = await prisma.guest.findMany({
            where: query ? {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            } : {},
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(guests)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const guest = await prisma.guest.create({
            data: body,
        })
        return NextResponse.json(guest)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
