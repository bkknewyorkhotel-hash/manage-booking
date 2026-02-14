const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Clean up existing data to avoid unique constraint errors
  // WARNING: Commented out to prevent accidental data loss in production
  /*
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
  */

  console.log('Upserting initial users...')
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'user_admin',
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

  // Check if room data already exists
  const roomTypeCount = await prisma.roomType.count()
  const roomCount = await prisma.room.count()

  if (roomTypeCount === 0 && roomCount === 0) {
    // Create or Update Room Types
    console.log('Seeding initial room types...')
    const standard = await prisma.roomType.create({
      data: { id: 'room-type-standard', name: 'Standard Room', capacity: 2, baseRate: 1500, amenities: JSON.stringify(['TV', 'AC', 'Wifi']) },
    })

    const deluxe = await prisma.roomType.create({
      data: { id: 'room-type-deluxe', name: 'Deluxe Room', capacity: 2, baseRate: 2500, amenities: JSON.stringify(['TV', 'AC', 'Wifi', 'Minibar', 'City View']) },
    })

    const suite = await prisma.roomType.create({
      data: { id: 'room-type-suite', name: 'Suite', capacity: 4, baseRate: 4500, amenities: JSON.stringify(['TV', 'AC', 'Wifi', 'Minibar', 'Sea View', 'Bathtub']) },
    })

    const roomTypesMap = {
      0: standard.id,
      1: deluxe.id,
      2: suite.id
    }

    // Create Floors and Rooms
    console.log('Seeding initial floors and rooms...')
    for (let f = 1; f <= 8; f++) {
      const floor = await prisma.floor.upsert({
        where: { floorNo: f },
        update: {},
        create: { floorNo: f },
      })

      for (let r = 1; r <= 10; r++) {
        const roomNo = `${f}${r.toString().padStart(2, '0')}`
        const typeIndex = (r - 1) % 3
        await prisma.room.create({
          data: {
            roomNo: roomNo,
            floorId: floor.id,
            roomTypeId: roomTypesMap[typeIndex],
            status: 'VACANT_CLEAN'
          },
        })
      }
    }
  } else {
    console.log('Room types or rooms already exist, skipping initial room seeding.')
  }

  // Check if we should skip transactional/product data
  const guestCount = await prisma.guest.count()
  const productCount = await prisma.product.count()

  if (guestCount === 0) {
    console.log('Seeding initial test guest and booking...')
    const guest = await prisma.guest.create({
      data: { name: 'John Doe', phone: '0812345678', email: 'john@example.com', taxId: '1234567890123' },
    })

    const room101 = await prisma.room.findUnique({ where: { roomNo: '101' } })
    const room102 = await prisma.room.findUnique({ where: { roomNo: '102' } })
    const room105 = await prisma.room.findUnique({ where: { roomNo: '105' } })

    if (room101 && room102) {
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
              { roomId: room101.id, roomTypeId: room101.roomTypeId, ratePerNight: 1500, adults: 2, children: 0 },
              { roomId: room102.id, roomTypeId: room102.roomTypeId, ratePerNight: 2500, adults: 2, children: 0 }
            ]
          }
        }
      })
      await prisma.room.update({ where: { id: room101.id }, data: { status: 'OCCUPIED' } })
      await prisma.room.update({ where: { id: room102.id }, data: { status: 'OCCUPIED' } })
    }

    if (room105) {
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
              { roomId: room105.id, roomTypeId: room105.roomTypeId, ratePerNight: 2500, adults: 2, children: 0 }
            ]
          }
        }
      })
    }
  } else {
    console.log('Existing guests found, skipping test booking creation.')
  }

  if (productCount === 0) {
    console.log('Seeding initial products...')
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
  } else {
    console.log('Existing products found, skipping product seeding.')
  }

  console.log('✅ Seeding completed safely.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
