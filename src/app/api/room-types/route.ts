
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const roomTypes = await prisma.roomType.findMany({
            orderBy: {
                baseRate: 'asc',
            },
        })

        return NextResponse.json(roomTypes)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, capacity, baseRate, amenities } = body

        const roomType = await prisma.roomType.create({
            data: {
                name,
                capacity: Number(capacity),
                baseRate: Number(baseRate),
                amenities: amenities || ''
            }
        })
        return NextResponse.json(roomType)
    } catch (error) {
        return NextResponse.json({ error: 'Creation failed' }, { status: 400 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, name, capacity, baseRate, amenities } = body

        const roomType = await prisma.roomType.update({
            where: { id },
            data: {
                name,
                capacity: Number(capacity),
                baseRate: Number(baseRate),
                amenities
            }
        })
        return NextResponse.json(roomType)
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 400 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        // Check if in use
        const roomCount = await prisma.room.count({ where: { roomTypeId: id } })
        if (roomCount > 0) {
            return NextResponse.json({ error: 'Cannot delete: Room Type is in use by existing rooms.' }, { status: 400 })
        }

        await prisma.roomType.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 400 })
    }
}
