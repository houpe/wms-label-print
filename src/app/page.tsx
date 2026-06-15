'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Store {
  id: string
  name: string
  address: string | null
}

interface Contact {
  id: string
  name: string
  phone: string
  address: string | null
}

interface PrintLabel {
  store: Store
  contact: Contact
  temperature: string
  totalInTemp: number
  indexInTemp: number
  date: string
}

const TEMP_ICONS: Record<string, string> = {
  '冷冻': '🧊',
  '冷藏': '🧊',
  '常温': '📦',
}

const TEMP_LIST = ['冷冻', '冷藏', '常温'] as const

export default function Home() {
  const [stores, setStores] = useState<Store[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  // 每个温层独立件数
  const [quantities, setQuantities] = useState<Record<string, number>>({
    '冷冻': 0,
    '冷藏': 0,
    '常温': 0,
  })
  const [printLabels, setPrintLabels] = useState<PrintLabel[]>([])
  const [saving, setSaving] = useState(false)

  const totalQuantity = Object.values(quantities).reduce((sum, q) => sum + q, 0)

  const fetchStores = useCallback(async () => {
    const res = await fetch('/api/stores')
    const data = await res.json()
    setStores(data)
    const lastStoreId = localStorage.getItem('lastStoreId')
    if (lastStoreId && data.find((s: Store) => s.id === lastStoreId)) {
      setSelectedStoreId(lastStoreId)
    }
  }, [])

  const fetchContacts = useCallback(async (storeId: string) => {
    const res = await fetch(`/api/contacts?storeId=${storeId}`)
    const data = await res.json()
    setContacts(data)
    const lastContactId = localStorage.getItem('lastContactId')
    if (lastContactId && data.find((c: Contact) => c.id === lastContactId)) {
      setSelectedContactId(lastContactId)
    } else {
      setSelectedContactId('')
    }
  }, [])

  useEffect(() => { fetchStores() }, [fetchStores])

  useEffect(() => {
    if (selectedStoreId) {
      fetchContacts(selectedStoreId)
    } else {
      setContacts([])
      setSelectedContactId('')
    }
  }, [selectedStoreId, fetchContacts])

  const handleStoreChange = (id: string) => {
    setSelectedStoreId(id)
    setSelectedContactId('')
    localStorage.setItem('lastStoreId', id)
  }

  const handleContactChange = (id: string) => {
    setSelectedContactId(id)
    localStorage.setItem('lastContactId', id)
  }

  const handleQuantityChange = (temp: string, value: string) => {
    const num = Math.max(0, parseInt(value) || 0)
    setQuantities(prev => ({ ...prev, [temp]: num }))
  }

  // 预览数量（每个温层最多显示2张，共6张）
  const previewLabels = useCallback(() => {
    const store = stores.find((s) => s.id === selectedStoreId)
    const contact = contacts.find((c) => c.id === selectedContactId)
    if (!store || !contact) return []

    const labels: PrintLabel[] = []
    TEMP_LIST.forEach((temp) => {
      const count = quantities[temp] || 0
      for (let i = 1; i <= Math.min(count, 2); i++) {
        labels.push({
          store,
          contact,
          temperature: temp,
          totalInTemp: count,
          indexInTemp: i,
          date: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
        })
      }
    })
    return labels
  }, [stores, contacts, selectedStoreId, selectedContactId, quantities])

  // 生成打印面单
  const generateLabels = useCallback(async () => {
    if (!selectedStoreId || !selectedContactId || totalQuantity === 0) return
    const store = stores.find((s) => s.id === selectedStoreId)!
    const contact = contacts.find((c) => c.id === selectedContactId)!

    const labels: PrintLabel[] = []
    const dateStr = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })

    TEMP_LIST.forEach((temp) => {
      const count = quantities[temp] || 0
      for (let i = 1; i <= count; i++) {
        labels.push({
          store,
          contact,
          temperature: temp,
          totalInTemp: count,
          indexInTemp: i,
          date: dateStr,
        })
      }
    })

    setPrintLabels(labels)

    // 保存到数据库
    setSaving(true)
    try {
      await fetch('/api/print-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStoreId,
          contactId: selectedContactId,
          temperature: Object.entries(quantities)
            .filter(([, qty]) => qty > 0)
            .map(([temp, qty]) => `${temp}×${qty}`)
            .join(', '),
          quantity: totalQuantity,
        }),
      })
    } catch (error) {
      console.error('保存打印订单失败:', error)
    } finally {
      setSaving(false)
    }
  }, [selectedStoreId, selectedContactId, stores, contacts, quantities, totalQuantity])

  return (
    <div className="app-root">
      <div className="bg-decoration">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      <div className="app-inner" style={{ maxWidth: 1200 }}>
        {/* Top Nav */}
        <nav className="top-nav">
          <Link href="/" className="nav-pill active">打印面单</Link>
          <span className="nav-dot" />
          <Link href="/stores" className="nav-pill">门店管理</Link>
          <span className="nav-dot" />
          <Link href="/contacts" className="nav-pill">收货人管理</Link>
        </nav>

        {/* Header */}
        <div className="app-header fade-in-up">
          <div className="logo-badge" style={{ marginBottom: 10 }}>WMS · 面单打印</div>
          <h1 className="app-title">创建<em>打印面单</em></h1>
          <p className="app-subtitle">选择门店与收货人，按温层分别设置件数，打印 76×133mm 面单</p>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Left Column - Form */}
          <div className="card fade-in-up" style={{ flex: 1, minWidth: 0, animationDelay: '0.1s' }}>
            <h2 className="card-title">
              <span className="icon">📋</span>
              面单信息
            </h2>

            <div className="form-grid">
              {/* 门店 */}
              <div className="field-group">
                <div className="field-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
                      <path d="M8 1L3 5.5V14h4V9.5h2V14h4V5.5L8 1z" fill="currentColor"/>
                    </svg>
                  </span>
                  门店
                </div>
                <select
                  value={selectedStoreId}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  className="form-select"
                >
                  <option value="">请选择门店</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              {/* 收货人 */}
              <div className="field-group">
                <div className="field-label">
                  <span className="label-icon">
                    <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
                      <circle cx="8" cy="4.5" r="2.5" fill="currentColor"/>
                      <path d="M3 13.5c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </span>
                  收货人
                </div>
                <select
                  value={selectedContactId}
                  onChange={(e) => handleContactChange(e.target.value)}
                  disabled={!selectedStoreId}
                  className="form-select"
                >
                  <option value="">请选择收货人</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 各温层件数 */}
            <div className="field-group" style={{ marginTop: 20 }}>
              <div className="field-label">
                <span className="label-icon">
                  <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
                    <path d="M8 1v8m-3-5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="2" y="10" width="12" height="5" rx="2" fill="currentColor"/>
                  </svg>
                </span>
                各温层件数
              </div>
              <div className="temp-qty-grid">
                {TEMP_LIST.map((temp) => (
                  <div key={temp} className="temp-qty-card">
                    <div className="temp-qty-label">
                      <span>{TEMP_ICONS[temp]}</span>
                      <span>{temp}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={quantities[temp] || 0}
                      onChange={(e) => handleQuantityChange(temp, e.target.value)}
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: 14 }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 统计 */}
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface-muted, #F8FAF8)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>
                各温层汇总：{TEMP_LIST.map(t => quantities[t] > 0 ? `${t} ${quantities[t]}件` : null).filter(Boolean).join('，') || '暂未设置'}
              </span>
              <strong style={{ color: 'var(--text)' }}>
                总计 {totalQuantity} 张
              </strong>
            </div>

            {/* Submit */}
            <div style={{ marginTop: 20 }}>
              <button
                className="btn btn--primary btn--full"
                onClick={generateLabels}
                disabled={!selectedStoreId || !selectedContactId || totalQuantity === 0 || saving}
              >
                {saving && <span className="spinner" />}
                {saving ? '保存中...' : `生成 ${totalQuantity} 张面单`}
              </button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div style={{ flex: '0 0 560px', position: 'sticky', top: 20 }}>
            {printLabels.length > 0 && (
              <div className="card fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="card-title">
                  <span className="icon">🖨</span>
                  面单预览
                  <span style={{ marginLeft: 'auto', fontWeight: 400, fontSize: 12, textTransform: 'none', letterSpacing: 0 }}>
                    共 {printLabels.length} 张
                  </span>
                </h2>

                <div className="print-hint">
                  ⚠️ 打印PDF时请勾选"背景图形"选项，否则温层颜色无法显示
                </div>

                <div style={{
                  display: 'flex',
                  gap: 16,
                  overflowX: 'auto',
                  padding: '8px 4px',
                  margin: '0 -4px',
                  scrollSnapType: 'x mandatory',
                  scrollBehavior: 'smooth',
                }}>
                  {previewLabels().map((label, idx) => (
                    <div key={idx} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                      <PreviewLabel label={label} />
                    </div>
                  ))}
                  {(() => {
                    const hiddenCount = printLabels.length - previewLabels().length
                    return hiddenCount > 0 ? (
                      <div style={{
                        color: 'var(--text-muted)',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        whiteSpace: 'nowrap',
                      }}>
                        还有 {hiddenCount} 张
                      </div>
                    ) : null
                  })()}
                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn--primary"
                    style={{ flex: 1, padding: '14px 24px', fontSize: 15 }}
                    onClick={() => window.print()}
                  >
                    🖨 打印 ({printLabels.length} 张)
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => setPrintLabels([])}
                  >
                    清除
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden: actual print content */}
        {printLabels.length > 0 && (
                <div className="print-preview">
                  {printLabels.map((label, i) => (
                    <div key={i} className="label-item">
                      <div className="label-content">
                        <div>
                          <div style={{
                            textAlign: 'center',
                            fontSize: '22pt',
                            fontWeight: 'bold',
                            color: '#000',
                            marginBottom: '3mm',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderBottom: '2px solid #217346',
                            paddingBottom: 4,
                          }}>
                            {label.store.name}
                          </div>
                          <div style={{ fontSize: '16pt', marginBottom: '2mm', color: '#000', fontWeight: 'bold' }}>
                            <div>收货人：{label.contact.name}</div>
                          </div>
                          <div style={{ fontSize: '16pt', marginBottom: '2mm', color: '#000', fontWeight: 'bold' }}>
                            <div>联系电话：{label.contact.phone}</div>
                          </div>
                          {label.contact.address && (
                            <div style={{ fontSize: '14pt', color: '#000', fontWeight: 'bold' }}>
                              <div>地址：{label.contact.address}</div>
                            </div>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <div style={{ fontSize: '13pt', color: '#000', fontWeight: 'bold' }}>
                            <div>日期：{label.date}</div>
                          </div>
                          <div
                            className={`temp-badge temp-badge--${label.temperature}`}
                          >
                            {label.temperature}
                          </div>
                          <div style={{ fontSize: '20pt', fontWeight: 'bold', color: '#000' }}>
                            {label.indexInTemp}/{label.totalInTemp}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
        )}

        <div className="app-footer" style={{ marginTop: 32, clear: 'both' }}>
          WMS 面单打印系统
        </div>
      </div>
    </div>
  )
}

function PreviewLabel({ label }: { label: PrintLabel }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 133 * 3.78,
        height: 76 * 3.78,
        background: '#fff',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        fontFamily: 'SimHei, sans-serif',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        padding: '4mm',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            textAlign: 'center',
            fontSize: '22pt',
            fontWeight: 'bold',
            color: '#000',
            marginBottom: '4mm',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            borderBottom: '2px solid #217346',
            paddingBottom: 4,
          }}>
            {label.store.name}
          </div>
          <div style={{ fontSize: '16pt', marginBottom: '2mm', color: '#000', fontWeight: 'bold' }}>
            <span>收货人：</span>
            <span>{label.contact.name}</span>
          </div>
          <div style={{ fontSize: '16pt', marginBottom: '2mm', color: '#000', fontWeight: 'bold' }}>
            <span>联系电话：</span>
            <span>{label.contact.phone}</span>
          </div>
          {label.contact.address && (
            <div style={{ fontSize: '14pt', color: '#000', fontWeight: 'bold' }}>
              <span>地址：</span>
              <span>{label.contact.address}</span>
            </div>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '13pt', color: '#000', fontWeight: 'bold' }}>
            <span>日期：</span>
            <span>{label.date}</span>
          </div>
          <div
            className={`temp-badge temp-badge--${label.temperature}`}
          >
            {label.temperature}
          </div>
          <div style={{ fontSize: '20pt', fontWeight: 'bold', color: '#000' }}>
            {label.indexInTemp}/{label.totalInTemp}
          </div>
        </div>
      </div>
    </div>
  )
}
