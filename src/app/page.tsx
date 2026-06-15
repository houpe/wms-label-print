'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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

const TEMP_ICONS: Record<string, string> = {
  '冷冻': '🧊',
  '冷藏': '🧊',
  '常温': '📦',
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

export default function Home() {
  const [stores, setStores] = useState<Store[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
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
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  })
  const [remark, setRemark] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 单件打印
  const handleSinglePrint = () => {
    if (!selectedStoreId || !selectedContactId || totalQuantity === 0) return
    const store = stores.find((s) => s.id === selectedStoreId)
    const contact = contacts.find((c) => c.id === selectedContactId)
    if (!store || !contact) return

    // 用户选择的日期 + 当前时间
    const d = new Date(printDate)
    const dateStr = d.toLocaleString('zh-CN', {
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

    fetch('/api/print-orders', {
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

      <div className="app-inner" style={{ maxWidth: 1200 }}>
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
        <div className="tab-switcher fade-in-up" style={{ animationDelay: '0.05s' }}>
          <button
            className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
            onClick={() => setActiveTab('single')}
          >
            📋 单件新建
          </button>
          <button
            className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch')}
          >
            📊 批量新建
          </button>
        </div>

        {activeTab === 'single' && (
          <div className="card fade-in-up" style={{ maxWidth: 640, margin: '0 auto', animationDelay: '0.1s' }}>
            <h2 className="card-title"><span className="icon">📋</span>面单信息</h2>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="field-group">
                <div className="field-label">
                  <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M8 1L3 5.5V14h4V9.5h2V14h4V5.5L8 1z" fill="currentColor"/></svg></span>
                  门店
                </div>
                <select value={selectedStoreId} onChange={(e) => handleStoreChange(e.target.value)} className="form-select">
                  <option value="">请选择门店</option>
                  {stores.map((store) => (<option key={store.id} value={store.id}>{store.name}</option>))}
                </select>
              </div>

              <div className="field-group">
                <div className="field-label">
                  <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><circle cx="8" cy="4.5" r="2.5" fill="currentColor"/><path d="M3 13.5c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="2" fill="none"/></svg></span>
                  收货人
                </div>
                <select value={selectedContactId} onChange={(e) => handleContactChange(e.target.value)} disabled={!selectedStoreId} className="form-select">
                  <option value="">请选择收货人</option>
                  {contacts.map((c) => (<option key={c.id} value={c.id}>{c.name} · {c.phone}</option>))}
                </select>
              </div>

              <div className="field-group">
                <div className="field-label">
                  <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M2 6h12M5 1v3M11 1v3" stroke="currentColor" strokeWidth="1.5"/></svg></span>
                  日期
                </div>
                <input type="datetime-local" value={printDate} onChange={(e) => setPrintDate(e.target.value)} className="form-select" />
              </div>
            </div>

            <div className="field-group" style={{ marginTop: 20 }}>
              <div className="field-label">
                <span className="label-icon"><svg viewBox="0 0 16 16" fill="none" width="11" height="11"><path d="M8 1v8m-3-5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><rect x="2" y="10" width="12" height="5" rx="2" fill="currentColor"/></svg></span>
                各温层件数
              </div>
              <div className="temp-qty-grid">
                {TEMP_LIST.map((temp) => (
                  <div key={temp} className="temp-qty-card">
                    <div className="temp-qty-label"><span>{TEMP_ICONS[temp]}</span><span>{temp}</span></div>
                    <input type="number" min={0} value={quantities[temp] || 0} onChange={(e) => handleQuantityChange(temp, e.target.value)} onFocus={(e) => e.target.select()} className="form-input" style={{ padding: '8px 12px', fontSize: 14 }} />
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
}

// Validate a single row, return error messages
function validateRow(row: BatchRow): string[] {
  const errs: string[] = []
  if (!row.store?.trim()) errs.push('门店为空')
  if (!row.contact?.trim()) errs.push('收货人为空')
  if (!row.phone?.trim()) errs.push('电话为空')
  if (!row.date?.trim()) errs.push('日期为空')
  if (!row.tempZone?.trim()) errs.push('温区为空')
  else if (!['冷冻', '冷藏', '常温'].includes(row.tempZone.trim())) errs.push(`温区"${row.tempZone}"无效`)
  if (!row.qty || row.qty <= 0) errs.push('件数无效')
  return errs
}

// Batch upload panel
interface BatchUploadPanelProps {
  fileInputRef: React.RefObject<HTMLInputElement>
  batchLoading: boolean
  setBatchLoading: (loading: boolean) => void
  stores: Store[]
}

function BatchUploadPanel({
  fileInputRef, batchLoading, setBatchLoading, stores,
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
      const matchedStore = stores.find((s) => s.name === row.store.trim())
      const storeAddress = matchedStore?.address || null
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

      const parsedRows: BatchRow[] = rawRows.map((r, i) => {
        let dateStr = ''
        const dv = r['日期']
        if (typeof dv === 'number') {
          dateStr = excelDateToString(dv)
        } else if (dv) {
          dateStr = String(dv)
        }
        return {
          id: i,
          store: String(r['门店'] || '').trim(),
          contact: String(r['收货人'] || '').trim(),
          phone: String(r['电话'] || '').replace(/\.0$/, '').trim(),
          date: dateStr,
          tempZone: String(r['温区'] || '').trim(),
          qty: Number(r['总件数']) || 0,
          remark: String(r['备注'] || '').trim(),
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
      store: '', contact: '', phone: '', date: nowStr(), tempZone: '', qty: 1, remark: '',
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

    fetch('/api/print-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: '', contactId: '', temperature: '批量上传', quantity: labels.length }),
    }).catch(() => {})
  }

  // 上传区域
  if (!showEditor) {
    return (
      <div className="card fade-in-up" style={{ maxWidth: 640, margin: '0 auto', animationDelay: '0.1s' }}>
        <h2 className="card-title"><span className="icon">📊</span>批量上传</h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div className="print-hint" style={{ background: '#E0F2FE', borderColor: '#7DD3FC', color: '#075985', margin: 0, flex: 1 }}>
            📋 按模板格式填写后上传，所有字段必填，支持 <code>.xls</code> / <code>.xlsx</code>
          </div>
          <a href="/批量模板.xls" download="批量模板.xls" className="btn btn--secondary" style={{ padding: '10px 16px', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
            📥 下载模板
          </a>
        </div>

        <div style={{ border: '2px dashed var(--card-border)', borderRadius: 12, padding: '40px 24px', textAlign: 'center', transition: 'border-color 0.2s' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>点击选择Excel文件</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>上传后可在线编辑、校验</div>
          <input ref={fileInputRef} type="file" accept=".xls,.xlsx" onChange={handleFileChange} style={{ display: 'none' }} />
          <button className="btn btn--secondary" onClick={() => fileInputRef.current?.click()} disabled={batchLoading} style={{ padding: '10px 24px' }}>
            {batchLoading ? '处理中...' : '选择文件'}
          </button>
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
    <div className="card fade-in-up" style={{ maxWidth: 1100, margin: '0 auto', animationDelay: '0.1s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <span className="icon">📊</span>批量编辑
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
      <div style={{ overflowX: 'auto', border: '1px solid var(--card-border)', borderRadius: 8 }}>
        <table className="batch-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>门店</th>
              <th>收货人</th>
              <th>电话</th>
              <th style={{ width: 180 }}>日期</th>
              <th style={{ width: 90 }}>温区</th>
              <th style={{ width: 70 }}>件数</th>
              <th style={{ width: 140 }}>备注</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const errs = validateRow(row)
              const hasErr = errs.length > 0
              return (
                <tr key={row.id} className={hasErr ? 'batch-row-error' : ''}>
                  <td className="batch-row-num">{row.id + 1}</td>
                  <td><input className="batch-input" value={row.store} onChange={(e) => updateCell(row.id, 'store', e.target.value)} /></td>
                  <td><input className="batch-input" value={row.contact} onChange={(e) => updateCell(row.id, 'contact', e.target.value)} /></td>
                  <td><input className="batch-input" value={row.phone} onChange={(e) => updateCell(row.id, 'phone', e.target.value)} /></td>
                  <td><input className="batch-input" value={row.date} onChange={(e) => updateCell(row.id, 'date', e.target.value)} /></td>
                  <td>
                    <select className="batch-input" value={row.tempZone} onChange={(e) => updateCell(row.id, 'tempZone', e.target.value)}>
                      <option value="">选择</option>
                      <option value="冷冻">冷冻</option>
                      <option value="冷藏">冷藏</option>
                      <option value="常温">常温</option>
                    </select>
                  </td>
                  <td><input type="number" className="batch-input" style={{ textAlign: 'center' }} value={row.qty} onChange={(e) => updateCell(row.id, 'qty', e.target.value)} /></td>
                  <td><input className="batch-input" value={row.remark} onChange={(e) => updateCell(row.id, 'remark', e.target.value)} placeholder="选填" /></td>
                  <td>
                    <button onClick={() => deleteRow(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 16, padding: '4px' }}>✕</button>
                  </td>
                </tr>
              )
            })}
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
