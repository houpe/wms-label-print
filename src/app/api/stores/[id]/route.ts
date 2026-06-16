import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const store = await prisma.store.findUnique({
    where: { id },
    include: { contacts: true },
  })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(store)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const {
    cargoOwner, name, address,
    contactName, contactPhone, contactPhone2,
  } = body

  const store = await prisma.$transaction(async (tx) => {
    // 更新门店
    const updated = await tx.store.update({
      where: { id },
      data: {
        cargoOwner: cargoOwner || '',
        name,
        address,
      },
    })

    // 同步第一个联系人（收货人 + 电话1 + 电话2）
    const existing = await tx.contact.findFirst({
      where: { storeId: id },
      orderBy: { createdAt: 'asc' },
    })

    const hasContact = contactName?.trim() && contactPhone?.trim()
    if (existing) {
      if (hasContact) {
        // 更新现有联系人，包含电话2
        await tx.contact.update({
          where: { id: existing.id },
          data: {
            name: contactName,
            phone: contactPhone,
            phone2: contactPhone2 || null,
          },
        })
      } else {
        // 清空了收货人，删除联系人
        await tx.contact.delete({ where: { id: existing.id } })
      }
    } else if (hasContact) {
      // 之前没有联系人，现在新建
      await tx.contact.create({
        data: {
          name: contactName,
          phone: contactPhone,
          phone2: contactPhone2 || null,
          storeId: id,
        },
      })
    }

    return tx.store.findUnique({
      where: { id },
      include: { contacts: true },
    })
  })

  return NextResponse.json(store)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.store.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
