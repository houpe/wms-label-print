'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Store {
  id: string
  name: string
  address: string | null
  contacts: { id: string; name: string }[]
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Store | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchStores = useCallback(async () => {
    const res = await fetch('/api/stores')
    const data = await res.json()
    setStores(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchStores() }, [fetchStores])

  const openAdd = () => {
    setEditing(null); setName(''); setAddress('')
    setModal('add')
  }
  const openEdit = (s: Store) => {
    setEditing(s); setName(s.name); setAddress(s.address || '')
    setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditing(null); setName(''); setAddress('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await fetch(`/api/stores/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      })
    } else {
      await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      })
    }
    closeModal()
    fetchStores()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个门店吗？')) return
    await fetch(`/api/stores/${id}`, { method: 'DELETE' })
    fetchStores()
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
      <div className="app-inner">
        {/* Nav */}
        <nav className="top-nav">
          <Link href="/" className="nav-pill">打印面单</Link>
          <span className="nav-dot" />
          <Link href="/stores" className="nav-pill active">门店管理</Link>
          <span className="nav-dot" />
          <Link href="/contacts" className="nav-pill">收货人管理</Link>
        </nav>

        <div className="app-header fade-in-up">
          <div className="logo-badge" style={{ marginBottom: 10 }}>WMS · 门店</div>
          <h1 className="app-title">门店<em>管理</em></h1>
          <p className="app-subtitle">管理打印门店信息，共 {stores.length} 家门店</p>
        </div>

        <div className="card fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              <span className="icon">🏪</span>
              门店列表
            </h2>
            <button className="btn btn--primary btn--sm" onClick={openAdd}>
              + 添加门店
            </button>
          </div>

          {stores.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🏪</div>
              <p>暂无门店，点击右上角添加</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>门店名称</th>
                    <th>地址</th>
                    <th>收货人</th>
                    <th style={{ width: 100 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id}>
                      <td style={{ fontWeight: 600 }}>{store.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{store.address || '—'}</td>
                      <td>
                        <span className="badge badge--blue">{store.contacts.length} 人</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn--secondary btn--sm" style={{ padding: '4px 10px' }} onClick={() => openEdit(store)}>编辑</button>
                          <button className="btn btn--danger btn--sm" style={{ padding: '4px 10px' }} onClick={() => handleDelete(store.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <h3 className="modal__title">{modal === 'edit' ? '编辑门店' : '添加门店'}</h3>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                <div className="field-group">
                  <div className="field-label">门店名称</div>
                  <input
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入门店名称"
                    required
                  />
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