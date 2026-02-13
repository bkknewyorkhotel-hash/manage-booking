const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Clean up existing data to avoid unique constraint errors
  await prisma.posOrderItem.deleteMany()
  await prisma.posOrder.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.deposit.deleteMany()
  await prisma.chargeItem.deleteMany()
  await prisma.stay.deleteMany()
  await prisma.bookingRoom.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.housekeepingLog.deleteMany()
  await prisma.maintenanceTicket.deleteMany()
  await prisma.cashTransaction.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.room.deleteMany()
  await prisma.floor.deleteMany()
  await prisma.roomType.deleteMany()
  await prisma.product.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.user.deleteMany()

  await prisma.user.create({
    data: {
      id: 'user_admin', // Static ID for dev/testing
      username: 'admin',
      password: 'password123',
      name: 'System Admin',
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { username: 'reception' },
    update: {},
    create: {
      username: 'reception',
      password: 'password123',
      name: 'Receptionist One',
      role: 'RECEPTION',
    },
  })

  // Create Room Types
  const standard = await prisma.roomType.create({
    data: { name: 'Standard Room', capacity: 2, baseRate: 1500, amenities: JSON.stringify(['TV', 'AC', 'Wifi']) },
  })

  const deluxe = await prisma.roomType.create({
    data: { name: 'Deluxe Room', capacity: 2, baseRate: 2500, amenities: JSON.stringify(['TV', 'AC', 'Wifi', 'Minibar', 'City View']) },
  })

  const suite = await prisma.roomType.create({
    data: { name: 'Suite', capacity: 4, baseRate: 4500, amenities: JSON.stringify(['TV', 'AC', 'Wifi', 'Minibar', 'Sea View', 'Bathtub']) },
  })

  const roomTypes = [standard, deluxe, suite]

  // Create Floors and Rooms
  const createdRooms = []
  for (let f = 1; f <= 8; f++) {
    const floor = await prisma.floor.create({ data: { floorNo: f } })
    for (let r = 1; r <= 10; r++) {
      const roomNo = `${f}${r.toString().padStart(2, '0')}`
      const typeIndex = (r - 1) % 3
      const room = await prisma.room.create({
        data: { roomNo: roomNo, floorId: floor.id, roomTypeId: roomTypes[typeIndex].id, status: 'VACANT_CLEAN' },
      })
      createdRooms.push(room)
    }
  }

  // Create Guest
  const guest = await prisma.guest.create({
    data: { name: 'John Doe', phone: '0812345678', email: 'john@example.com', taxId: '1234567890123' },
  })

  // 1. Booking: Checked In (Occupied) - Room 101, 102
  // Using actual room IDs from creation
  const room1 = createdRooms.find(r => r.roomNo === '101')
  const room2 = createdRooms.find(r => r.roomNo === '102')

  await prisma.booking.create({
    data: {
      bookingNo: 'B-TEST-001',
      source: 'WALK_IN',
      checkInDate: new Date(),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      nights: 2,
      status: 'CHECKED_IN',
      primaryGuestId: guest.id,
      Rooms: {
        create: [
          { roomId: room1.id, roomTypeId: room1.roomTypeId, ratePerNight: 1500, adults: 2, children: 0 },
          { roomId: room2.id, roomTypeId: room2.roomTypeId, ratePerNight: 2500, adults: 2, children: 0 }
        ]
      }
    }
  })
  await prisma.room.update({ where: { id: room1.id }, data: { status: 'OCCUPIED' } })
  await prisma.room.update({ where: { id: room2.id }, data: { status: 'OCCUPIED' } })

  // 2. Booking: Confirmed (Future) - Room 105
  const room3 = createdRooms.find(r => r.roomNo === '105')
  await prisma.booking.create({
    data: {
      bookingNo: 'B-TEST-002',
      source: 'ONLINE',
      checkInDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      checkOutDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      nights: 2,
      status: 'CONFIRMED',
      primaryGuestId: guest.id,
      Rooms: {
        create: [
          { roomId: room3.id, roomTypeId: room3.roomTypeId, ratePerNight: 2500, adults: 2, children: 0 }
        ]
      }
    }
  })

  // Create Products (POS)
  const products = [
    { name: 'Coke', category: 'Drink', price: 20, cost: 10, stock: 100 },
    { name: 'Water', category: 'Drink', price: 10, cost: 5, stock: 200 },
    { name: 'Beer', category: 'Drink', price: 80, cost: 40, stock: 50 },
    { name: 'Chips', category: 'Snack', price: 30, cost: 15, stock: 50 },
    { name: 'Chocolate', category: 'Snack', price: 40, cost: 20, stock: 50 },
    { name: 'Toothbrush', category: 'Amenity', price: 20, cost: 8, stock: 100 },
  ]

  for (const p of products) {
    await prisma.product.create({ data: p })
  }

  console.log('✅ Seed data created: 80 Rooms, Users, Guests, Test Bookings, and POS Products')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
