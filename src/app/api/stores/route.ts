import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const stores = await prisma.store.findMany({
    orderBy: [{ cargoOwner: 'asc' }, { createdAt: 'desc' }],
    include: { contacts: true },
  })
  return NextResponse.json(stores)
}

export async function POST(request: NextRequest) {
  const { cargoOwner, name, address, contactName, contactPhone, contactPhone2 } = await request.json()
  
  const store = await prisma.$transaction(async (tx) => {
    // 创建门店
    const newStore = await tx.store.create({
      data: {
        cargoOwner: cargoOwner || '',
        name,
        address,
      },
    })
    
    // 如果有联系人信息，创建联系人
    if (contactName && contactPhone) {
      await tx.contact.create({
        data: {
          name: contactName,
          phone: contactPhone,
          phone2: contactPhone2,
          storeId: newStore.id,
        },
      })
    }
    
    return newStore
  })
  
  return NextResponse.json(store, { status: 201 })
}
