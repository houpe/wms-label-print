'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'

interface Contact {
  id: string
  name: string
  phone: string
  phone2: string | null
  storeId: string
}

interface Store {
  id: string
  cargoOwner: string
  name: string
  address: string | null
  contacts: Contact[]
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [expandedStoreIds, setExpandedStoreIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [storeCargoOwner, setStoreCargoOwner] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [loading, setLoading] = useState(true)

  const [contactModal, setContactModal] = useState<'add' | 'edit' | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactPhone2, setContactPhone2] = useState('')
  const [contactStoreId, setContactStoreId] = useState('')

  const fetchStores = useCallback(async () => {
    const res = await fetch('/print/api/stores')
    const data = await res.json()
    setStores(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchStores() }, [fetchStores])

  const groupedStores = useMemo(() => {
    const map = new Map<string, Store[]>()
    stores.forEach((store) => {
      const owner = store.cargoOwner || '未知货主'
      if (!map.has(owner)) map.set(owner, [])
      map.get(owner)!.push(store)
    })
    return Array.from(map.entries())
  }, [stores])

  const toggleExpand = (storeId: string) => {
    setExpandedStoreIds(prev => {
      const next = new Set(prev)
      if (next.has(storeId)) { next.delete(storeId) } else { next.add(storeId) }
      return next
    })
  }

  const openAddStore = () => {
    setEditingStore(null); setStoreCargoOwner(''); setStoreName(''); setStoreAddress('')
    setModal('add')
  }

  const openEditStore = (store: Store) => {
    setEditingStore(store); setStoreCargoOwner(store.cargoOwner); setStoreName(store.name); setStoreAddress(store.address || '')
    setModal('edit')
  }

  const closeStoreModal = () => {
    setModal(null); setEditingStore(null); setStoreCargoOwner(''); setStoreName(''); setStoreAddress('')
  }

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingStore) {
      await fetch(`/print/api/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargoOwner: storeCargoOwner, name: storeName, address: storeAddress }),
      })
    } else {
      await fetch('/print/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargoOwner: storeCargoOwner, name: storeName, address: storeAddress }),
      })
    }
    closeStoreModal()
    fetchStores()
  }

  const handleDeleteStore = async (id: string) => {
    if (!confirm('确定要删除这个门店吗？')) return
    await fetch(`/print/api/stores/${id}`, { method: 'DELETE' })
    fetchStores()
  }

  const openAddContact = (storeId: string) => {
    setEditingContact(null); setContactName(''); setContactPhone(''); setContactPhone2(''); setContactStoreId(storeId)
    setContactModal('add')
  }

  const openEditContact = (contact: Contact) => {
    setEditingContact(contact); setContactName(contact.name); setContactPhone(contact.phone); setContactPhone2(contact.phone2 || ''); setContactStoreId(contact.storeId)
    setContactModal('edit')
  }

  const closeContactModal = () => {
    setContactModal(null); setEditingContact(null); setContactName(''); setContactPhone(''); setContactPhone2(''); setContactStoreId('')
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingContact) {
      await fetch(`/print/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactName, phone: contactPhone, phone2: contactPhone2 || null }),
      })
    } else {
      await fetch('/print/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactName, phone: contactPhone, phone2: contactPhone2 || null, storeId: contactStoreId }),
      })
    }
    closeContactModal()
    fetchStores()
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('确定要删除这个收货人吗？')) return
    await fetch(`/print/api/contacts/${id}`, { method: 'DELETE' })
    fetchStores()
  }

  if (loading) {
    return (
      <div className="app-root">
        <div className="bg-decoration">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
        </div>
        <div className="app-inner" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ color: 'var(--text-muted)' }}>加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-root">
      <div className="bg-decoration">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>
      <div className="app-inner" style={{ maxWidth: 1200 }}>
        <div className="fade-in-up" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, marginBottom: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="logo-badge">WMS · 门店</div>
            <h1 className="app-title" style={{ fontSize: 22, margin: 0 }}>门店<em>管理</em></h1>
          </div>
          <nav className="top-nav" style={{ margin: 0 }}>
            <Link href="/" className="nav-pill">打印面单</Link>
            <span className="nav-dot" />
            <Link href="/stores" className="nav-pill active">门店管理</Link>
          </nav>
        </div>

        <div className="card fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              <span className="icon">🏪</span>
              门店列表
            </h2>
            <button className="btn btn--primary btn--sm" onClick={openAddStore}>
              + 添加门店
            </button>
          </div>

          {stores.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🏪</div>
              <p>暂无门店，点击右上角添加</p>
            </div>
          ) : (
            groupedStores.map(([cargoOwner, ownerStores]) => (
              <div key={cargoOwner} style={{ marginBottom: 24 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  padding: '8px 12px',
                  background: 'var(--primary)', color: 'white',
                  borderRadius: 'var(--radius-sm, 8px)',
                  fontSize: 14, fontWeight: 600,
                }}>
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 4l6-3 6 3v8l-6 3-6-3V4z" stroke="white" strokeWidth="1.3" fill="none"/><path d="M2 4l6 3 6-3M8 7v7" stroke="white" strokeWidth="1.3"/></svg>
                  货主：{cargoOwner}
                  <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.8 }}>{ownerStores.length} 个门店</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>展开</th>
                        <th>门店名称</th>
                        <th>地址</th>
                        <th style={{ width: 100 }}>收货人数</th>
                        <th style={{ width: 130 }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ownerStores.map((store) => (
                        <React.Fragment key={store.id}>
                          <tr>
                            <td>
                              <button
                                onClick={() => toggleExpand(store.id)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  fontSize: '14px', color: 'var(--text-muted)', padding: '4px 8px',
                                }}
                              >
                                {expandedStoreIds.has(store.id) ? '▼' : '▶'}
                              </button>
                            </td>
                            <td style={{ fontWeight: 600 }}>{store.name}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{store.address || '—'}</td>
                            <td>
                              <span className="badge badge--blue">{store.contacts?.length || 0} 人</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn--secondary btn--sm" style={{ padding: '4px 10px' }} onClick={() => openEditStore(store)}>编辑</button>
                                <button className="btn btn--danger btn--sm" style={{ padding: '4px 10px' }} onClick={() => handleDeleteStore(store.id)}>删除</button>
                              </div>
                            </td>
                          </tr>
                          {expandedStoreIds.has(store.id) && (
                            <tr style={{ background: 'var(--bg-muted, #F8FAF8)' }}>
                              <td colSpan={5} style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                                    👥 收货人列表
                                  </h3>
                                  <button className="btn btn--primary btn--sm" onClick={() => openAddContact(store.id)}>
                                    + 添加收货人
                                  </button>
                                </div>
                                {!store.contacts || store.contacts.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                                    <p style={{ fontSize: 13, margin: 0 }}>暂无收货人，点击添加</p>
                                  </div>
                                ) : (
                                  <table className="data-table" style={{ background: 'var(--bg-card, #FFFFFF)' }}>
                                    <thead>
                                      <tr>
                                        <th>姓名</th>
                                        <th>电话1</th>
                                        <th>电话2</th>
                                        <th style={{ width: 130 }}>操作</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {store.contacts.map((contact) => (
                                        <tr key={contact.id}>
                                          <td style={{ fontWeight: 600 }}>{contact.name}</td>
                                          <td>{contact.phone}</td>
                                          <td style={{ color: 'var(--text-muted)' }}>{contact.phone2 || '—'}</td>
                                          <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                              <button className="btn btn--secondary btn--sm" style={{ padding: '4px 10px' }} onClick={() => openEditContact(contact)}>编辑</button>
                                              <button className="btn btn--danger btn--sm" style={{ padding: '4px 10px' }} onClick={() => handleDeleteContact(contact.id)}>删除</button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="app-footer" style={{ marginTop: 32 }}>
          WMS 面单打印系统
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeStoreModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{modal === 'edit' ? '编辑门店' : '添加门店'}</h3>
              <button className="modal__close" onClick={closeStoreModal}>✕</button>
            </div>
            <form onSubmit={handleStoreSubmit}>
              <div className="modal__body">
                <div className="field-group">
                  <div className="field-label">货主</div>
                  <input
                    className="form-input"
                    value={storeCargoOwner}
                    onChange={(e) => setStoreCargoOwner(e.target.value)}
                    placeholder="请输入货主名称"
                    required
                  />
                </div>
                <div className="field-group" style={{ marginTop: 16 }}>
                  <div className="field-label">门店名称</div>
                  <input
                    className="form-input"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="请输入门店名称"
                    required
                  />
                </div>
                <div className="field-group" style={{ marginTop: 16 }}>
                  <div className="field-label">地址</div>
                  <input
                    className="form-input"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="请输入地址（选填）"
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeStoreModal}>取消</button>
                <button type="submit" className="btn btn--primary">{modal === 'edit' ? '保存' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {contactModal && (
        <div className="modal-overlay" onClick={closeContactModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{contactModal === 'edit' ? '编辑收货人' : '添加收货人'}</h3>
              <button className="modal__close" onClick={closeContactModal}>✕</button>
            </div>
            <form onSubmit={handleContactSubmit}>
              <div className="modal__body">
                {contactModal === 'add' && (
                  <div className="field-group">
                    <div className="field-label">所属门店</div>
                    <select
                      className="form-select"
                      value={contactStoreId}
                      onChange={(e) => setContactStoreId(e.target.value)}
                      required
                    >
                      <option value="">请选择门店</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>{s.cargoOwner ? `[${s.cargoOwner}] ` : ''}{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="field-group" style={{ marginTop: contactModal === 'add' ? 16 : 0 }}>
                  <div className="field-label">姓名</div>
                  <input
                    className="form-input"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="请输入姓名"
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <div className="field-label">电话1</div>
                    <input
                      className="form-input"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="请输入电话"
                      required
                    />
                  </div>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <div className="field-label">电话2 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>（选填）</span></div>
                    <input
                      className="form-input"
                      value={contactPhone2}
                      onChange={(e) => setContactPhone2(e.target.value)}
                      placeholder="选填"
                    />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeContactModal}>取消</button>
                <button type="submit" className="btn btn--primary">{contactModal === 'edit' ? '保存' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
