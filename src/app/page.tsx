'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'

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
  storeName: string
  contactName: string
  contactPhone: string
  contactAddress: string | null
  remark: string | null
  temperature: string
  totalInTemp: number
  indexInTemp: number
  date: string
  totalPrintCount: number
  printIndex: number
  printDate: string
}

const TEMP_ICONS: Record<string, React.ReactNode> = {
  '冷冻': <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  '冷藏': <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><rect x="7" y="1" width="2" height="8" rx="1" fill="currentColor"/><circle cx="8" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><circle cx="8" cy="12" r="1" fill="currentColor"/><path d="M8 1v2M5.5 2l1 1.5M10.5 2l-1 1.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/></svg>,
  '常温': <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.8"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M12.5 3.5L11 5M3.5 12.5L5 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>,
}

const TEMP_LIST = ['冷冻', '冷藏', '常温'] as const

// 温层样式：只有冷冻有黑色背景
const TEMP_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  '冷冻': { bg: '#000000', color: '#ffffff', border: 'none' },
  '冷藏': { bg: 'transparent', color: '#000000', border: '2px solid #000' },
  '常温': { bg: 'transparent', color: '#000000', border: '2px solid #000' },
}

function excelDateToString(serial: number): string {
  if (typeof serial !== 'number' || serial <= 0) {
    return nowStr()
  }
  const utcDays = Math.floor(serial - 25569)
  const utcMs = utcDays * 86400 * 1000
  return new Date(utcMs).toLocaleString('zh-CN', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

function nowStr(): string {
  return new Date().toLocaleString('zh-CN', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

// 构建单张面单的 HTML
function buildLabelHTML(label: PrintLabel): string {
  const ts = TEMP_STYLES[label.temperature] || { bg: 'transparent', color: '#000', border: '2px solid #000' }
  const phoneTail = label.contactPhone.slice(-4)
  const phoneRest = label.contactPhone.slice(0, -4)
  return `
    <div class="label-item">
      <div class="header-row">
        <div class="print-date">打印：${label.printDate}</div>
        <div class="temp-badge" style="background:${ts.bg};color:${ts.color};border:${ts.border};"> ${label.temperature} <span class="qty">${label.indexInTemp}/${label.totalInTemp}</span></div>
      </div>
      <div class="store-name">${label.storeName}</div>
        <div class="info-group">
        <div class="info-row">收货人：${label.contactName}</div>
        <div class="info-row">电话：${phoneRest}<span class="phone-tail">${phoneTail}</span></div>
        ${label.contactAddress ? `<div class="info-row addr">地址：${label.contactAddress}</div>` : ''}
        ${label.remark ? `<div class="info-row addr">备注：${label.remark}</div>` : ''}
        <div class="info-row date-inline">日期：${label.date}</div>
      </div>
    </div>`
}

// 隐藏 iframe 打印，不弹窗
function printLabels(labels: PrintLabel[], onDone?: () => void) {
  if (labels.length === 0) {
    onDone?.()
    return
  }

  const html = labels.map(buildLabelHTML).join('')

  // 创建隐藏 iframe
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    onDone?.()
    return
  }

  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: 76mm 133mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-family: SimHei, "Microsoft YaHei", sans-serif;
  }
   .label-item {
     width: 76mm; height: 133mm;
     position: relative;
     page-break-after: always;
     padding: 10mm 3mm 15mm;
     display: flex; flex-direction: column;
   }
   .label-item:last-child { page-break-after: auto; }
   .header-row {
     display: flex; align-items: center; justify-content: space-between;
     margin-bottom: 3mm;
   }
   .print-date {
     font-size: 7pt; color: #ccc;
   }
   .temp-badge {
     padding: 2px 10px; border-radius: 3px; font-weight: bold; font-size: 14pt;
     display: inline-flex; align-items: center; white-space: nowrap;
     margin-left: auto;
   }
   .qty { font-size: 16pt; font-weight: bold; margin-left: 4px; letter-spacing: -1px; }
   .store-name {
     text-align: center; font-size: 22pt; font-weight: bold; color: #000;
     padding-bottom: 3mm; margin-bottom: 3mm;
     border-bottom: 2px solid #217346;
   }
   .info-group { flex: 1; display: flex; flex-direction: column; gap: 1.5mm; }
   .info-row { font-size: 16pt; color: #333; font-weight: 600; line-height: 1.35; }
   .info-row.addr { font-size: 13pt; color: #444; font-weight: 500; line-height: 1.3; word-break: break-all; }
   .info-row.date-inline { font-size: 13pt; color: #444; font-weight: 500; margin-top: auto; padding-top: 2mm; border-top: 1px solid #ccc; }
   .phone-tail { font-size: 18pt; color: #333; }
</style>
</head>
<body>
${html}
</body>
</html>`)
  doc.close()

  // iframe 加载完成后打印
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {
        // ignore
      }
      // 打印对话框关闭后清理 iframe
      setTimeout(() => {
        document.body.removeChild(iframe)
        onDone?.()
      }, 1000)
    }, 500)
  }
}

function formatToDate(dateStr: string): string {
  if (!dateStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

  try {
    let normalized = dateStr.trim().replace(/\//g, '-')
    // 处理 yy-MM-dd HH:mm:ss 或 yy-MM-dd 这种2位年份
    if (/^\d{2}-\d{2}-\d{2}/.test(normalized)) {
      normalized = '20' + normalized
    }
    const datePart = normalized.split(/[ T]/)[0]
    const d = new Date(datePart)
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }
  } catch {
    // ignore
  }
  return ''
}

interface SingleSearchableSelectProps {
  value: string
  onChange: (id: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  isDisabled?: boolean
  instanceId?: string
}

function SingleSearchableSelect({ value, onChange, options, placeholder, isDisabled, instanceId }: SingleSearchableSelectProps) {
  const selectValue = options.find(opt => opt.value === value) || null

  return (
    <Select
      instanceId={instanceId}
      isClearable
      isDisabled={isDisabled}
      placeholder={placeholder}
      value={selectValue}
      onChange={(newValue) => {
        onChange(newValue ? newValue.value : '')
      }}
      options={options}
      styles={{
        control: (base) => ({
          ...base,
          minHeight: '40px',
          height: '40px',
          borderRadius: 'var(--radius-sm, 8px)',
          borderColor: 'var(--input-border, #CBD5C3)',
          borderWidth: '2px',
          boxShadow: 'none',
          fontSize: '15px',
          background: 'var(--input-bg, #F8FAF8)',
          '&:hover': {
            borderColor: 'var(--input-focus, #217346)',
          }
        }),
        valueContainer: (base) => ({
          ...base,
          padding: '0 10px',
          height: '36px',
        }),
        input: (base) => ({
          ...base,
          margin: '0',
          padding: '0',
        }),
        singleValue: (base) => ({
          ...base,
          color: 'var(--text, #1E293B)',
        }),
        placeholder: (base) => ({
          ...base,
          color: 'var(--text-muted, #64748B)',
        }),
        indicatorsContainer: (base) => ({
          ...base,
          height: '36px',
        }),
        dropdownIndicator: (base) => ({
          ...base,
          padding: '4px',
        }),
        clearIndicator: (base) => ({
          ...base,
          padding: '4px',
        }),
        menu: (base) => ({
          ...base,
          fontSize: '15px',
          zIndex: 9999,
        })
      }}
    />
  )
}

interface BatchComboboxProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

function BatchCombobox({ value, onChange, options, placeholder }: BatchComboboxProps) {
  const selectValue = value ? { value, label: value } : null

  return (
    <div style={{ position: 'relative', width: '100%' }} title={value || undefined}>
      <CreatableSelect
        isClearable
        placeholder={placeholder || '选择或输入...'}
        value={selectValue}
        onChange={(newValue) => {
          onChange(newValue ? newValue.value : '')
        }}
        onCreateOption={(inputValue) => {
          onChange(inputValue)
        }}
        options={options}
        menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base) => ({
            ...base,
            minHeight: '30px',
            height: '30px',
            borderRadius: '4px',
            borderColor: 'var(--card-border, #CBD5C3)',
            boxShadow: 'none',
            fontSize: '13px',
            background: '#fff',
            '&:hover': {
              borderColor: 'var(--primary, #217346)',
            }
          }),
          valueContainer: (base) => ({
            ...base,
            padding: '0 8px',
            height: '28px',
            lineHeight: '28px',
          }),
          input: (base) => ({
            ...base,
            margin: '0',
            padding: '0',
          }),
          singleValue: (base) => ({
            ...base,
            color: 'var(--text, #1E293B)',
          }),
          indicatorsContainer: (base) => ({
            ...base,
            height: '28px',
          }),
          dropdownIndicator: (base) => ({
            ...base,
            padding: '2px',
          }),
          clearIndicator: (base) => ({
            ...base,
            padding: '2px',
          }),
          menu: (base) => ({
            ...base,
            fontSize: '13px',
            zIndex: 9999,
          })
        }}
      />
    </div>
  )
}

export default function Home() {
  const [stores, setStores] = useState<Store[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({
    '冷冻': 0, '冷藏': 0, '常温': 0,
  })
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')
  const [batchLoading, setBatchLoading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [printDate, setPrintDate] = useState(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  })
  const [remark, setRemark] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalQuantity = Object.values(quantities).reduce((sum, q) => sum + q, 0)

  const fetchStores = useCallback(async () => {
    const load = async (retries = 2): Promise<Store[] | null> => {
      try {
        const res = await fetch('/print/api/stores')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return await res.json()
      } catch (err) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 500))
          return load(retries - 1)
        }
        console.error('fetchStores failed:', err)
        return null
      }
    }
    const data = await load()
    if (!data) return
    setStores(data)
    const lastStoreId = localStorage.getItem('lastStoreId')
    if (lastStoreId && data.find((s: Store) => s.id === lastStoreId)) {
      setSelectedStoreId(lastStoreId)
    } else if (!lastStoreId && data.length > 0) {
      const firstStoreId = data[0].id
      setSelectedStoreId(firstStoreId)
      localStorage.setItem('lastStoreId', firstStoreId)
    }
  }, [])

  const fetchContacts = useCallback(async (storeId: string) => {
    const res = await fetch(`/print/api/contacts?storeId=${storeId}`)
    const data = await res.json()
    setContacts(data)
    const lastContactId = localStorage.getItem('lastContactId')
    if (lastContactId && data.find((c: Contact) => c.id === lastContactId)) {
      setSelectedContactId(lastContactId)
    } else {
      setSelectedContactId('')
    }
  }, [])

  useEffect(() => {
    fetchStores()
    fetch('/print/api/contacts').then(res => res.json()).then(data => setAllContacts(data)).catch(() => {})
  }, [fetchStores])

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

  // 单次打印
  const handleSinglePrint = () => {
    if (!selectedStoreId || !selectedContactId || totalQuantity === 0) return
    const store = stores.find((s) => s.id === selectedStoreId)
    const contact = contacts.find((c) => c.id === selectedContactId)
    if (!store || !contact) return

    // 用户选择的日期 + 当前时间
    const selectDate = new Date(printDate)
    const now = new Date()
    selectDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
    const dateStr = selectDate.toLocaleString('zh-CN', {
      year: '2-digit', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
    const actualPrintDate = nowStr()
    const labels: PrintLabel[] = []
    let printIdx = 0
    TEMP_LIST.forEach((temp) => {
      const count = quantities[temp] || 0
      for (let i = 1; i <= count; i++) {
        printIdx++
        labels.push({
          storeName: store.name,
          contactName: contact.name,
          contactPhone: contact.phone,
          contactAddress: store.address,
          remark: remark.trim() || null,
          temperature: temp,
          totalInTemp: count,
          indexInTemp: i,
          date: dateStr,
          totalPrintCount: totalQuantity,
          printIndex: printIdx,
          printDate: actualPrintDate,
        })
      }
    })

    setPrinting(true)
    printLabels(labels, () => setPrinting(false))

    fetch('/print/api/print-orders', {
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
    }).catch(() => {})
  }

  return (
    <div className="app-root">
      <div className="bg-decoration">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      <div className="app-inner" style={{ maxWidth: 1400 }}>
        {/* Header */}
        <div className="fade-in-up" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, marginBottom: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="logo-badge">WMS · 面单打印</div>
            <h1 className="app-title" style={{ fontSize: 22, margin: 0 }}>创建<em>打印面单</em></h1>
          </div>
          <nav className="top-nav" style={{ margin: 0 }}>
            <Link href="/" className="nav-pill active">打印面单</Link>
            <span className="nav-dot" />
            <Link href="/stores" className="nav-pill">门店管理</Link>
            <span className="nav-dot" />
            <Link href="/contacts" className="nav-pill">收货人管理</Link>
          </nav>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div className="tab-switcher fade-in-up" style={{ animationDelay: '0.05s' }}>
            <button
              className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                <path d="M4 2h8v12H4V2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M6 5h4M6 8h4M6 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              单次新建
            </button>
            <button
              className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
              onClick={() => setActiveTab('batch')}
            >
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                <rect x="2" y="2" width="4" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                <rect x="6.5" y="4" width="4" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.6"/>
                <rect x="11" y="2" width="3" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.35"/>
                <rect x="2.5" y="9" width="4.5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.6"/>
                <rect x="8" y="9" width="3.5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.35"/>
              </svg>
              批量上传
            </button>
          </div>
        </div>

        {activeTab === 'single' && (
          <div className="card fade-in-up" style={{ maxWidth: 640, margin: '0 auto', animationDelay: '0.1s' }}>
            <h2 className="card-title"><span className="icon"><svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M4 3h8v10H4V3z" stroke="white" strokeWidth="1.5" fill="none"/><path d="M6 6h4M6 9h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg></span>面单信息</h2>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="field-group">
                <div className="field-label">
                  <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M8 1L3 5.5V14h4V9.5h2V14h4V5.5L8 1z" fill="currentColor"/></svg></span>
                  门店
                </div>
                 <SingleSearchableSelect
                  value={selectedStoreId}
                  onChange={handleStoreChange}
                  options={stores.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="请选择门店"
                  instanceId="store-select"
                />
              </div>

              <div className="field-group">
                <div className="field-label">
                  <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><circle cx="8" cy="4.5" r="2.5" fill="currentColor"/><path d="M3 13.5c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="2" fill="none"/></svg></span>
                  收货人
                </div>
                <SingleSearchableSelect
                  value={selectedContactId}
                  onChange={handleContactChange}
                  options={contacts.map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` }))}
                  placeholder="请选择收货人"
                  isDisabled={!selectedStoreId}
                  instanceId="contact-select"
                />
              </div>

              <div className="field-group">
                <div className="field-label">
                  <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M2 6h12M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.5"/></svg></span>
                  日期
                </div>
                <input
                  type="date"
                  value={printDate}
                  onChange={(e) => setPrintDate(e.target.value)}
                  className="form-select"
                  style={{ height: '40px', padding: '0 14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div className="field-group" style={{ marginTop: 20 }}>
              <div className="field-label">
                <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M8 1v8m-3-5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><rect x="2" y="10" width="12" height="5" rx="2" fill="currentColor"/></svg></span>
                各温层件数
              </div>
              <div className="temp-qty-grid">
                {TEMP_LIST.map((temp) => (
                  <div key={temp} className="temp-qty-card" style={{ padding: '12px 10px' }}>
                    <div className="temp-qty-label" style={{ marginBottom: 6 }}>
                      <span>{TEMP_ICONS[temp]}</span>
                      <span>{temp}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg, #F8FAF8)', border: '2px solid var(--input-border, #CBD5C3)', borderRadius: 'var(--radius-sm, 8px)', overflow: 'hidden', height: '38px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const current = quantities[temp] || 0
                          handleQuantityChange(temp, String(Math.max(0, current - 1)))
                        }}
                        style={{
                          width: '36px',
                          height: '100%',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: 'var(--text-muted, #64748B)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          userSelect: 'none',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quantities[temp] || 0}
                        onChange={(e) => handleQuantityChange(temp, e.target.value.replace(/\D/g, ''))}
                        onFocus={(e) => e.target.select()}
                        style={{
                          flex: 1,
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          borderLeft: '1px solid var(--input-border, #CBD5C3)',
                          borderRight: '1px solid var(--input-border, #CBD5C3)',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: '700',
                          background: 'transparent',
                          outline: 'none',
                          padding: 0,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = quantities[temp] || 0
                          handleQuantityChange(temp, String(current + 1))
                        }}
                        style={{
                          width: '36px',
                          height: '100%',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: 'var(--text-muted, #64748B)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          userSelect: 'none',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="field-group" style={{ marginTop: 20 }}>
              <div className="field-label">
                <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M3 3h10v8H5l-2 2V3z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg></span>
                备注
              </div>
              <input
                className="form-input"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入备注（选填）"
              />
            </div>

            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--surface-muted, #F8FAF8)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>
                各温层汇总：{TEMP_LIST.map(t => quantities[t] > 0 ? `${t} ${quantities[t]}件` : null).filter(Boolean).join('，') || '暂未设置'}
              </span>
              <strong style={{ color: 'var(--text)' }}>总计 {totalQuantity} 张</strong>
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="btn btn--primary btn--full" onClick={handleSinglePrint} disabled={!selectedStoreId || !selectedContactId || totalQuantity === 0 || printing}>
                {printing ? (
                  <>
                    <span className="spinner" />
                    正在准备打印...
                  </>
                ) : (
                  <>🖨 打印预览（共 {totalQuantity} 张）</>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'batch' && (
          <BatchUploadPanel
            fileInputRef={fileInputRef}
            batchLoading={batchLoading}
            setBatchLoading={setBatchLoading}
            stores={stores}
            contacts={allContacts}
          />
        )}

        <div className="app-footer" style={{ marginTop: 32 }}>
          WMS 面单打印系统
        </div>
      </div>
    </div>
  )
}

// Batch row data
interface BatchRow {
  id: number
  store: string
  contact: string
  phone: string
  date: string
  tempZone: string
  qty: number
  remark: string
  address: string
}

// Validate a single row, return error messages
function validateRow(row: BatchRow): string[] {
  const errs: string[] = []
  if (!row.store?.trim()) errs.push('门店为空')
  if (!row.contact?.trim()) errs.push('收货人为空')
  const phone = row.phone?.trim()
  if (!phone) errs.push('电话为空')
  else if (!/^1[3-9]\d{9}$/.test(phone)) errs.push(`电话"${phone}"格式不正确（需11位手机号）`)
  if (!row.date?.trim()) errs.push('日期为空')
  if (!row.tempZone?.trim()) errs.push('温区为空')
  else if (!['冷冻', '冷藏', '常温'].includes(row.tempZone.trim())) errs.push(`温区"${row.tempZone}"无效`)
  if (!row.qty || row.qty <= 0) errs.push('件数无效')
  return errs
}

// Batch upload panel
interface BatchUploadPanelProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  batchLoading: boolean
  setBatchLoading: (loading: boolean) => void
  stores: Store[]
  contacts: Contact[]
}

function BatchUploadPanel({
  fileInputRef, batchLoading, setBatchLoading, stores, contacts,
}: BatchUploadPanelProps) {
  const [rows, setRows] = useState<BatchRow[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  // 从行数据生成打印标签
  const buildLabelsFromRows = useCallback((validRows: BatchRow[]): PrintLabel[] => {
    const labels: PrintLabel[] = []
    const actualPrintDate = nowStr()
    validRows.forEach((row) => {
      const total = row.qty
      const storeAddress = row.address || null
      for (let j = 1; j <= total; j++) {
        labels.push({
          storeName: row.store.trim(),
          contactName: row.contact.trim(),
          contactPhone: row.phone.trim(),
          contactAddress: storeAddress,
          remark: row.remark.trim() || null,
          temperature: row.tempZone.trim(),
          totalInTemp: total,
          indexInTemp: j,
          date: row.date.trim(),
          totalPrintCount: 0,
          printIndex: 0,
          printDate: actualPrintDate,
        })
      }
    })
    const totalCount = labels.length
    labels.forEach((l, idx) => {
      l.totalPrintCount = totalCount
      l.printIndex = idx + 1
    })
    return labels
  }, [])

  const handleBatchFile = async (file: File) => {
    setBatchLoading(true)
    setParseError(null)

    try {
      const XLSX = await import('xlsx')
      const xlsxLib = XLSX.default || XLSX
      const buffer = await file.arrayBuffer()
      const wb = xlsxLib.read(buffer, { type: 'array', cellDates: false })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rawRows: {
        '门店'?: string; '收货人'?: string; '电话'?: number | string
        '日期'?: number | string; '温区'?: string; '总件数'?: number; '备注'?: string
      }[] = xlsxLib.utils.sheet_to_json(ws)

      if (rawRows.length === 0) {
        setParseError('Excel文件为空，请检查模板')
        setBatchLoading(false)
        return
      }

      // 兼容多种列名
      const getVal = (r: Record<string, unknown>, ...keys: string[]): string => {
        for (const k of keys) {
          if (r[k] !== undefined && r[k] !== null && r[k] !== '') return String(r[k])
        }
        return ''
      }

      // 检查必需列是否存在
      const sampleRow = rawRows[0]
      const allKeys = Object.keys(sampleRow)
      const missingCols: string[] = []
      const colMap: Record<string, string[]> = {
        '门店': ['门店', '门店名称', 'store'],
        '收货人': ['收货人', '联系人', '姓名', 'contact'],
        '电话': ['电话', '联系电话', '手机', '联系方式', 'phone'],
        '日期': ['日期', '时间', 'date'],
        '温区': ['温区', '温层', '温度'],
        '总件数': ['总件数', '件数', '数量', 'qty'],
      }
      for (const [field, keys] of Object.entries(colMap)) {
        if (!keys.some(k => allKeys.includes(k))) {
          missingCols.push(`${field}(可能的列名: ${keys.join('/')})`)
        }
      }
      if (missingCols.length > 0) {
        setParseError(`缺少必需列：\n${missingCols.join('\n')}\n\n检测到的列：${allKeys.join(', ')}`)
        setBatchLoading(false)
        return
      }

      const parsedRows: BatchRow[] = rawRows.map((r, i) => {
        let dateStr = ''
        const dv = getVal(r, '日期', '时间', 'date')
        if (/^\d+(\.\d+)?$/.test(dv)) {
          dateStr = excelDateToString(Number(dv))
        } else if (dv) {
          dateStr = dv
        }
        const phoneRaw = getVal(r, '电话', '联系电话', '手机', '联系方式', 'phone')
        const storeName = getVal(r, '门店', '门店名称', 'store').trim()
        const matchedStore = stores.find((s) => s.name === storeName)
        const matchedContact = contacts.find((c) => c.name === getVal(r, '收货人', '联系人', '姓名', 'contact').trim())
        return {
          id: i,
          store: storeName,
          contact: getVal(r, '收货人', '联系人', '姓名', 'contact').trim(),
          phone: phoneRaw.replace(/\.0$/, '').trim() || (matchedContact?.phone ?? ''),
          date: dateStr,
          tempZone: getVal(r, '温区', '温层', '温度').trim(),
          qty: Number(getVal(r, '总件数', '件数', '数量', 'qty')) || 0,
          remark: getVal(r, '备注', 'remark').trim(),
          address: matchedStore?.address || getVal(r, '地址', '门店地址').trim(),
        }
      })

      setRows(parsedRows)
      setShowEditor(true)
    } catch (err) {
      console.error('Excel解析失败:', err)
      const msg = err instanceof Error ? err.message : String(err)
      setParseError(`解析失败：${msg}`)
    } finally {
      setBatchLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleBatchFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 编辑单元格
  const updateCell = (rowId: number, field: keyof BatchRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== rowId) return r
      if (field === 'qty') return { ...r, qty: parseInt(value) || 0 }
      if (field === 'store') {
        // 门店变更时自动填充地址
        const matchedStore = stores.find(s => s.name === value.trim())
        return { ...r, store: value, address: matchedStore?.address || r.address }
      }
      if (field === 'contact') {
        // 收货人变更时自动填充电话
        const matchedContact = contacts.find(c => c.name === value.trim())
        return { ...r, contact: value, phone: matchedContact?.phone || r.phone }
      }
      return { ...r, [field]: value }
    }))
  }

  // 删除行
  const deleteRow = (rowId: number) => {
    setRows(prev => prev.filter(r => r.id !== rowId))
  }

  // 添加空行
  const addRow = () => {
    setRows(prev => [...prev, {
      id: Math.max(...prev.map(r => r.id), -1) + 1,
      store: '', contact: '', phone: '', date: nowStr(), tempZone: '', qty: 1, remark: '', address: '',
    }])
  }

  // 统计校验
  const rowErrors = rows.map(r => ({ id: r.id, errs: validateRow(r) }))
  const errorCount = rowErrors.filter(r => r.errs.length > 0).length
  const validRows = rows.filter(r => validateRow(r).length === 0)
  const totalLabels = validRows.reduce((sum, r) => sum + r.qty, 0)

  const handlePrint = () => {
    if (errorCount > 0) return
    const labels = buildLabelsFromRows(validRows)
    if (labels.length === 0) return
    printLabels(labels)

    fetch('/print/api/print-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: '', contactId: '', temperature: '批量上传', quantity: labels.length }),
    }).catch(() => {})
  }

  // 上传区域
  if (!showEditor) {
    return (
      <div className="card fade-in-up" style={{ maxWidth: 640, margin: '0 auto', animationDelay: '0.1s' }}>
        <h2 className="card-title"><span className="icon"><svg viewBox="0 0 16 16" fill="none" width="14" height="14"><rect x="2" y="2" width="4" height="5" rx="1" stroke="white" strokeWidth="1.3" fill="none"/><rect x="6.5" y="4" width="4" height="3" rx="1" stroke="white" strokeWidth="1.3" fill="none" opacity="0.8"/><rect x="11" y="2" width="3" height="5" rx="1" stroke="white" strokeWidth="1.3" fill="none" opacity="0.5"/><rect x="2.5" y="9" width="4.5" height="5" rx="1" stroke="white" strokeWidth="1.3" fill="none" opacity="0.8"/><rect x="8" y="9" width="3.5" height="5" rx="1" stroke="white" strokeWidth="1.3" fill="none" opacity="0.5"/></svg></span>批量上传</h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div className="print-hint" style={{ background: '#E0F2FE', borderColor: '#7DD3FC', color: '#075985', margin: 0, flex: 1, fontSize: 12 }}>
            📋 上传Excel或直接新建，所有字段必填
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <a href="/print/批量模板.xls" download="批量模板.xls" className="nav-pill" style={{ textDecoration: 'none', gap: 4 }}>
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12v2h12v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              模板
            </a>
            <button
              className="nav-pill active"
              style={{ border: 'none', cursor: 'pointer', font: 'inherit', gap: 4 }}
              onClick={() => {
                setRows([{
                  id: 0, store: '', contact: '', phone: '', date: nowStr(),
                  tempZone: '', qty: 1, remark: '', address: '',
                }])
                setShowEditor(true)
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
                <path d="M10 3l3 3-7 7-3 0 0-3 7-7z" stroke="white" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
                <path d="M9 4l3 3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              新建
            </button>
          </div>
        </div>

        <div
          onClick={() => !batchLoading && fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--card-border)', borderRadius: 12,
            padding: '48px 24px', textAlign: 'center', transition: 'border-color 0.2s',
            cursor: batchLoading ? 'wait' : 'pointer',
          }}
          onMouseEnter={(e) => { if (!batchLoading) e.currentTarget.style.borderColor = 'var(--primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--card-border)' }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>点击选择或拖拽Excel文件</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>上传后可在线编辑、校验</div>
          <input ref={fileInputRef} type="file" accept=".xls,.xlsx" onChange={handleFileChange} style={{ display: 'none' }} />
          <span className="btn btn--primary" style={{ padding: '10px 24px', pointerEvents: 'none' }}>
            {batchLoading ? '处理中...' : '选择文件'}
          </span>
        </div>

        {parseError && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: 13, whiteSpace: 'pre-line' }}>
            ⚠️ {parseError}
          </div>
        )}
      </div>
    )
  }

  // 编辑器界面
  return (
    <div className="card fade-in-up" style={{ maxWidth: 1400, margin: '0 auto', animationDelay: '0.1s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <span className="icon"><svg viewBox="0 0 16 16" fill="none" width="14" height="14"><rect x="2" y="2" width="4" height="5" rx="1" stroke="white" strokeWidth="1.3" fill="none"/><rect x="6.5" y="4" width="4" height="3" rx="1" stroke="white" strokeWidth="1.3" fill="none" opacity="0.8"/><rect x="11" y="2" width="3" height="5" rx="1" stroke="white" strokeWidth="1.3" fill="none" opacity="0.5"/><rect x="2.5" y="9" width="4.5" height="5" rx="1" stroke="white" strokeWidth="1.3" fill="none" opacity="0.8"/><rect x="8" y="9" width="3.5" height="5" rx="1" stroke="white" strokeWidth="1.3" fill="none" opacity="0.5"/></svg></span>批量编辑
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--secondary btn--sm" onClick={() => { setShowEditor(false); setRows([]) }}>重新上传</button>
          <button className="btn btn--secondary btn--sm" onClick={addRow}>+ 添加行</button>
        </div>
      </div>

      {/* 统计栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 13,
        background: errorCount > 0 ? '#FEF2F2' : 'var(--primary-10, #E8F5EC)',
        border: `1px solid ${errorCount > 0 ? '#FECACA' : 'var(--primary)'}`,
      }}>
        <span style={{ color: errorCount > 0 ? '#991B1B' : 'var(--primary)' }}>
          {errorCount > 0 ? `⚠️ 有 ${errorCount} 行数据有误，请修改` : '✅ 全部校验通过'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          共 {rows.length} 行 · 有效 {validRows.length} 行 · 面单 {totalLabels} 张
        </span>
      </div>

      {/* 可编辑表格 */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--card-border)', borderRadius: 8, minHeight: 170 }}>
        <table className="batch-table" style={{ minHeight: 170 }}>
          <thead>
            <tr>
              <th style={{ width: 40, minWidth: 40, textAlign: 'center' }}>#</th>
              <th style={{ minWidth: 180 }}>门店</th>
              <th style={{ minWidth: 120 }}>收货人</th>
              <th style={{ minWidth: 120 }}>电话</th>
              <th style={{ width: 90, minWidth: 90 }}>温区</th>
              <th style={{ width: 70, minWidth: 70 }}>件数</th>
              <th style={{ minWidth: 120 }}>备注</th>
              <th style={{ minWidth: 200 }}>地址</th>
              <th style={{ width: 130, minWidth: 130 }}>日期</th>
              <th style={{ width: 40, minWidth: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const errs = validateRow(row)
              const hasErr = errs.length > 0
              return (
                <React.Fragment key={row.id}>
                  <tr className={hasErr ? 'batch-row-error' : ''}>
                    <td className="batch-row-num" title={`第 ${row.id + 1} 行`}>{row.id + 1}</td>
                  <td>
                    <BatchCombobox
                      value={row.store}
                      onChange={(v) => updateCell(row.id, 'store', v)}
                      options={stores.map(s => ({ value: s.name, label: s.name }))}
                    />
                  </td>
                  <td>
                    <BatchCombobox
                      value={row.contact}
                      onChange={(v) => updateCell(row.id, 'contact', v)}
                      options={contacts.map(c => ({ value: c.name, label: c.name }))}
                    />
                  </td>
                  <td><input className="batch-input" value={row.phone} onChange={(e) => updateCell(row.id, 'phone', e.target.value)} title={row.phone} /></td>
                  <td>
                    {(() => {
                      const tempColors: Record<string, { bg: string; color: string }> = {
                        '冷冻': { bg: '#000', color: '#fff' },
                        '冷藏': { bg: '#0891b2', color: '#fff' },
                        '常温': { bg: '#65a30d', color: '#fff' },
                      }
                      const tc = tempColors[row.tempZone]
                      return (
                        <select
                          className="batch-input batch-temp-select"
                          value={row.tempZone}
                          onChange={(e) => updateCell(row.id, 'tempZone', e.target.value)}
                          style={tc ? { background: tc.bg, color: tc.color, borderColor: tc.bg, fontWeight: 700 } : {}}
                          title={row.tempZone}
                        >
                          <option value="">选择</option>
                          <option value="冷冻">冷冻</option>
                          <option value="冷藏">冷藏</option>
                          <option value="常温">常温</option>
                        </select>
                      )
                    })()}
                  </td>
                  <td><input type="number" className="batch-input" style={{ textAlign: 'center' }} value={row.qty} onChange={(e) => updateCell(row.id, 'qty', e.target.value)} title={String(row.qty)} /></td>
                  <td><input className="batch-input" value={row.remark} onChange={(e) => updateCell(row.id, 'remark', e.target.value)} placeholder="选填" title={row.remark} /></td>
                  <td><input className="batch-input" value={row.address} onChange={(e) => updateCell(row.id, 'address', e.target.value)} placeholder="选填" title={row.address} /></td>
                  <td>
                    <input
                      type="date"
                      className="batch-input"
                      value={formatToDate(row.date)}
                      onChange={(e) => updateCell(row.id, 'date', e.target.value)}
                      title={row.date}
                      style={{ height: '30px', padding: '0 8px', boxSizing: 'border-box' }}
                    />
                  </td>
                  <td>
                    <button onClick={() => deleteRow(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 16, padding: '4px' }}>✕</button>
                  </td>
                </tr>
                {hasErr && (
                  <tr className="batch-error-row">
                    <td colSpan={10}>
                      <span className="batch-error-msg">⚠️ {errs.join('；')}</span>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              )
            })}
            {/* 空行填充，保持表格高度 */}
            {Array.from({ length: Math.max(0, 3 - rows.length) }, (_, i) => (
              <tr key={`empty-${i}`} style={{ height: 44 }}>
                <td colSpan={10} style={{ borderBottom: '1px solid var(--card-border)' }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部操作 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          className="btn btn--primary"
          style={{ flex: 1, padding: '14px 24px', fontSize: 15 }}
          onClick={handlePrint}
          disabled={errorCount > 0 || totalLabels === 0}
        >
          🖨 打印（{totalLabels} 张）
        </button>
        <button className="btn btn--secondary" onClick={() => { setShowEditor(false); setRows([]) }}>
          取消
        </button>
      </div>
    </div>
  )
}
