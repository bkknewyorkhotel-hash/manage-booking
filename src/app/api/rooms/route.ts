import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const floors = await prisma.floor.findMany({
            include: {
                Rooms: {
                    include: {
                        RoomType: true,
                    },
                    orderBy: {
                        roomNo: 'asc',
                    },
                },
            },
            orderBy: {
                floorNo: 'asc',
            },
        })

        return NextResponse.json(floors)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, status, roomTypeId, note } = body

        if (!id) {
            return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })
        }

        const updateData: any = {}
        if (status) updateData.status = status
        if (roomTypeId) updateData.roomTypeId = roomTypeId

        const room = await prisma.room.update({
            where: { id },
            data: updateData,
            include: { RoomType: true }
        })

        // Log the action (Optional: create AuditLog if schema supports it, for now just console)
        console.log(`Room ${room.roomNo} updated:`, updateData)

        return NextResponse.json(room)
    } catch (error) {
        console.error('Error updating room:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
// POST: Create a new room
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { roomNo, floorNo, roomTypeId } = body

        if (!roomNo || !floorNo || !roomTypeId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if floor exists, if not create (optional or assume floors exist)
        // For simplicity, we assume floors are derived or auto-created if needed by schema logic
        // But usually we need a Floor record first. Let's check or find/create.
        let floor = await prisma.floor.findUnique({
            where: { floorNo: Number(floorNo) }
        })

        if (!floor) {
            floor = await prisma.floor.create({
                data: {
                    floorNo: Number(floorNo)
                }
            })
        }

        const room = await prisma.room.create({
            data: {
                roomNo,
                floorId: floor.id,
                roomTypeId: roomTypeId,
                status: 'VACANT_CLEAN'
            },
            include: { RoomType: true }
        })

        return NextResponse.json(room)
    } catch (error) {
        console.error('Error creating room:', error)
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }
}

// DELETE: Remove a room
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Room ID required' }, { status: 400 })
        }

        // Check for active bookings via BookingRoom relation
        const activeBookings = await prisma.booking.count({
            where: {
                Rooms: {
                    some: {
                        roomId: id
                    }
                },
                status: { in: ['CONFIRMED', 'CHECKED_IN'] }
            }
        })

        if (activeBookings > 0) {
            return NextResponse.json({ error: 'Cannot delete room with active bookings' }, { status: 400 })
        }

        await prisma.room.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting room:', error)
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
    }
}
