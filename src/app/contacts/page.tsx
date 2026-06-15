'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Store { id: string; name: string }
interface Contact {
  id: string
  name: string
  phone: string
  address: string | null
  remark: string | null
  storeId: string
  store?: Store
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [remark, setRemark] = useState('')
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [contactsRes, storesRes] = await Promise.all([
      fetch('/api/contacts'),
      fetch('/api/stores'),
    ])
    const [contactsData, storesData] = await Promise.all([
      contactsRes.json(),
      storesRes.json(),
    ])
    setContacts(contactsData)
    setStores(storesData)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => {
    setEditing(null); setName(''); setPhone(''); setAddress(''); setRemark(''); setStoreId('')
    setModal('add')
  }
  const openEdit = (c: Contact) => {
    setEditing(c); setName(c.name); setPhone(c.phone); setAddress(c.address || ''); setRemark(c.remark || ''); setStoreId(c.storeId)
    setModal('edit')
  }
  const closeModal = () => {
    setModal(null); setEditing(null); setName(''); setPhone(''); setAddress(''); setRemark(''); setStoreId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await fetch(`/api/contacts/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, remark }),
      })
    } else {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, remark, storeId }),
      })
    }
    closeModal()
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个收货人吗？')) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    fetchData()
  }

  if (loading) {
    return (
      <div className="app-root">
        <div className="bg-decoration"><div className="blob blob-1" /><div className="blob blob-2" /></div>
        <div className="app-inner" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ color: 'var(--text-muted)' }}>加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-root">
      <div className="bg-decoration"><div className="blob blob-1" /><div className="blob blob-2" /></div>
      <div className="app-inner" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="fade-in-up" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, marginBottom: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="logo-badge">WMS · 收货人</div>
            <h1 className="app-title" style={{ fontSize: 22, margin: 0 }}>收货人<em>管理</em></h1>
          </div>
          <nav className="top-nav" style={{ margin: 0 }}>
            <Link href="/" className="nav-pill">打印面单</Link>
            <span className="nav-dot" />
            <Link href="/stores" className="nav-pill">门店管理</Link>
            <span className="nav-dot" />
            <Link href="/contacts" className="nav-pill active">收货人管理</Link>
          </nav>
        </div>

        <div className="card fade-in-up" style={{ animationDelay: '0.1s' }}>
          {stores.length === 0 ? (
            <div style={{
              padding: '32px 24px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <span style={{ fontSize: 28 }}>⚠️</span>
              <div style={{ fontSize: 14 }}>
                <strong style={{ color: '#92400E' }}>请先添加门店</strong>
                <span style={{ color: '#A16207', marginLeft: 8 }}>
                  添加收货人前需要先创建门店 ·
                </span>
                <Link href="/stores" style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: 4 }}>
                  前往门店管理 →
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 className="card-title" style={{ margin: 0 }}>
                  <span className="icon">👥</span>
                  收货人列表
                </h2>
                <button className="btn btn--primary btn--sm" onClick={openAdd}>
                  + 添加收货人
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">👥</div>
                  <p>暂无收货人，点击右上角添加</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>姓名</th>
                        <th>电话</th>
                        <th>地址</th>
                        <th>备注</th>
                        <th>所属门店</th>
                        <th style={{ width: 130 }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{c.phone}</td>
                           <td style={{ color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                             {c.address || '—'}
                           </td>
                           <td style={{ color: 'var(--text-muted)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                             {c.remark || '—'}
                           </td>
                          <td>
                            <span className="badge badge--green">{c.store?.name || '—'}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn--secondary btn--sm" style={{ padding: '4px 10px' }} onClick={() => openEdit(c)}>编辑</button>
                              <button className="btn btn--danger btn--sm" style={{ padding: '4px 10px' }} onClick={() => handleDelete(c.id)}>删除</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="app-footer" style={{ marginTop: 32 }}>
          WMS 面单打印系统
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{modal === 'edit' ? '编辑收货人' : '添加收货人'}</h3>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                <div className="field-group">
                  <div className="field-label">所属门店</div>
                  <select
                    className="form-select"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    disabled={modal === 'edit'}
                    required
                  >
                    <option value="">请选择门店</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <div className="field-label">姓名</div>
                    <input
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="请输入姓名"
                      required
                    />
                  </div>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <div className="field-label">电话</div>
                    <input
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="请输入电话"
                      required
                    />
                  </div>
                </div>
                <div className="field-group" style={{ marginTop: 16 }}>
                  <div className="field-label">地址</div>
                  <input
                    className="form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="请输入地址（选填）"
                  />
                </div>
                <div className="field-group" style={{ marginTop: 16 }}>
                  <div className="field-label">备注</div>
                  <input
                    className="form-input"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请输入备注（选填）"
                  />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeModal}>取消</button>
                <button type="submit" className="btn btn--primary">{modal === 'edit' ? '保存' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}