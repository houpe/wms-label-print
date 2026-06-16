'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Select from 'react-select'

interface Store {
  id: string
  cargoOwner: string
  name: string
  address: string | null
  contacts: {
    id: string
    name: string
    phone: string
    phone2: string | null
  }[]
}

type ModalMode = 'add' | 'edit' | null

const selectStyles = {
  control: (base: any) => ({
    ...base, minHeight: '40px', borderRadius: 'var(--radius-sm, 8px)',
    borderColor: 'var(--input-border, #CBD5C3)', borderWidth: '2px',
    boxShadow: 'none', '&:hover': { borderColor: 'var(--input-focus, #217346)' },
  }),
  valueContainer: (base: any) => ({ ...base, padding: '0 10px' }),
  input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
  singleValue: (base: any) => ({ ...base, color: 'var(--text, #1E293B)' }),
  placeholder: (base: any) => ({ ...base, color: 'var(--text-muted, #64748B)' }),
  menu: (base: any) => ({ ...base, fontSize: '15px', zIndex: 9999 }),
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  dropdownIndicator: (base: any) => ({ ...base, padding: '4px' }),
  clearIndicator: (base: any) => ({ ...base, padding: '4px' }),
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCargoOwner, setFilterCargoOwner] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingStore, setEditingStore] = useState<Store | null>(null)

  const [cargoOwner, setCargoOwner] = useState('')
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactPhone2, setContactPhone2] = useState('')

  const fetchStores = useCallback(async () => {
    const res = await fetch('/print/api/stores')
    const data = await res.json()
    setStores(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchStores() }, [fetchStores])

  const cargoOwners = useMemo(
    () => Array.from(new Set(stores.map(s => s.cargoOwner).filter(Boolean))).sort(),
    [stores],
  )

  const filteredStores = useMemo(
    () => filterCargoOwner ? stores.filter(s => s.cargoOwner === filterCargoOwner) : stores,
    [stores, filterCargoOwner],
  )

  const totalPages = Math.ceil(filteredStores.length / pageSize)
  const paginatedStores = filteredStores.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [filterCargoOwner])

  const openAdd = () => {
    setEditingStore(null)
    setCargoOwner(''); setStoreName(''); setStoreAddress('')
    setContactName(''); setContactPhone(''); setContactPhone2('')
    setModalMode('add')
  }

  const openEdit = (s: Store) => {
    setEditingStore(s)
    setCargoOwner(s.cargoOwner)
    setStoreName(s.name)
    setStoreAddress(s.address || '')
    const c = s.contacts?.[0]
    setContactName(c?.name || '')
    setContactPhone(c?.phone || '')
    setContactPhone2(c?.phone2 || '')
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingStore(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (modalMode === 'edit' && editingStore) {
      await fetch(`/print/api/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargoOwner, name: storeName, address: storeAddress,
          contactName, contactPhone, contactPhone2: contactPhone2 || null,
        }),
      })
    } else {
      await fetch('/print/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargoOwner, name: storeName, address: storeAddress,
          contactName, contactPhone, contactPhone2: contactPhone2 || null,
        }),
      })
    }
    closeModal()
    fetchStores()
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('删除门店会同时删除其收货人，确定？')) return
    await fetch(`/print/api/stores/${id}`, { method: 'DELETE' })
    fetchStores()
    setPage(1)
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
        <div className="fade-in-up" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, marginBottom: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="logo-badge">WMS · 门店</div>
            <h1 className="app-title" style={{ fontSize: 22, margin: 0 }}>门店<em>管理</em></h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <nav className="top-nav" style={{ margin: 0 }}>
              <Link href="/" className="nav-pill">打印面单</Link>
              <span className="nav-dot" />
              <Link href="/stores" className="nav-pill active">门店管理</Link>
            </nav>
            <div style={{ width: 200 }}>
              <Select
                instanceId="filter-owner"
                isClearable
                placeholder="筛选货主"
                value={filterCargoOwner ? { value: filterCargoOwner, label: filterCargoOwner } : null}
                onChange={(o) => setFilterCargoOwner(o?.value || '')}
                options={cargoOwners.map(c => ({ value: c, label: c }))}
                styles={selectStyles}
                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
              />
            </div>
            <button className="btn btn--primary btn--sm" onClick={openAdd}>+ 添加门店</button>
            <button className="btn btn--secondary btn--sm" onClick={() => {
              const rows = [['货主','门店','地址','联系人','电话1','电话2']]
              filteredStores.forEach(s => {
                const c = s.contacts?.[0]
                rows.push([s.cargoOwner, s.name, s.address||'', c?.name||'', c?.phone||'', c?.phone2||''])
              })
              const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
              const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'})
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = '门店数据.csv'; a.click()
              URL.revokeObjectURL(url)
            }}>📥 导出</button>
          </div>
        </div>

        <div className="card fade-in-up" style={{ animationDelay: '0.1s' }}>
          {filteredStores.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🏪</div>
              <p>{stores.length === 0 ? '暂无门店，点击右上角添加' : '当前货主下无门店'}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 100 }}>货主</th>
                    <th style={{ minWidth: 140 }}>门店</th>
                    <th style={{ minWidth: 200 }}>地址</th>
                    <th style={{ minWidth: 80 }}>收货人</th>
                    <th style={{ minWidth: 120 }}>电话1</th>
                    <th style={{ minWidth: 120 }}>电话2</th>
                    <th style={{ width: 130 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStores.map((s) => {
                    const c = s.contacts?.[0]
                    return (
                      <tr key={s.id}>
                        <td><span className="badge badge--green">{s.cargoOwner || '—'}</span></td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ color: 'var(--text-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.address || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{c?.name || '—'}</td>
                        <td>{c?.phone || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{c?.phone2 || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn--secondary btn--sm" style={{ padding: '4px 10px' }} onClick={() => openEdit(s)}>编辑</button>
                            <button className="btn btn--danger btn--sm" style={{ padding: '4px 10px' }} onClick={() => handleDelete(s.id)}>删除</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--input-border, #CBD5C3)', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>共 {filteredStores.length} 条，第 {page}/{totalPages} 页</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>每页</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} style={{ height: '28px', padding: '0 8px', fontSize: 13, border: '1px solid var(--input-border, #CBD5C3)', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn--secondary btn--sm" disabled={page === 1} onClick={() => setPage(1)}>首页</button>
                  <button className="btn btn--secondary btn--sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
                  <button className="btn btn--secondary btn--sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
                  <button className="btn btn--secondary btn--sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>末页</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="app-footer" style={{ marginTop: 32 }}>WMS 面单打印系统</div>
      </div>

      {modalMode && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{modalMode === 'edit' ? '编辑门店' : '添加门店'}</h3>
              <button className="modal__close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                <div className="field-group">
                  <div className="field-label">货主</div>
                  <input
                    className="form-input"
                    list="cargo-owner-list"
                    value={cargoOwner}
                    onChange={(e) => setCargoOwner(e.target.value)}
                    placeholder="输入或选择已有货主"
                    required
                  />
                  <datalist id="cargo-owner-list">
                    {cargoOwners.map((o) => <option key={o} value={o} />)}
                  </datalist>
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
                  <div className="field-label">地址 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>（选填）</span></div>
                  <input
                    className="form-input"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="请输入地址"
                  />
                </div>

                <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--surface-muted, #F8FAF8)', borderRadius: 'var(--radius-sm, 8px)', border: '1px solid var(--input-border, #CBD5C3)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>收货人</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <div className="field-label">姓名</div>
                      <input
                        className="form-input"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="收货人姓名"
                        required
                      />
                    </div>
                    <div className="field-group" style={{ marginBottom: 0 }}>
                      <div className="field-label">电话1</div>
                      <input
                        className="form-input"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="必填"
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group" style={{ marginTop: 12, marginBottom: 0 }}>
                    <div className="field-label">电话2 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>（选填）</span></div>
                    <input
                      className="form-input"
                      value={contactPhone2}
                      onChange={(e) => setContactPhone2(e.target.value)}
                      placeholder="备用电话"
                    />
                  </div>
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={closeModal}>取消</button>
                <button type="submit" className="btn btn--primary">{modalMode === 'edit' ? '保存' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
