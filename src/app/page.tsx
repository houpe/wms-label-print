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
  temperature: string
  totalInTemp: number
  indexInTemp: number
  date: string
  totalPrintCount: number
  printIndex: number
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
      <div class="label-inner">
        <div>
          <div class="store-name">${label.storeName}</div>
          <div class="info-row">收货人：${label.contactName}</div>
          <div class="info-row">联系电话：${phoneRest}<span class="phone-tail">${phoneTail}</span></div>
          ${label.contactAddress ? `<div class="info-row addr">地址：${label.contactAddress}</div>` : ''}
        </div>
        <div class="bottom-row">
          <div class="date">日期：${label.date}</div>
          <div class="temp-badge" style="background:${ts.bg};color:${ts.color};border:${ts.border};"> ${label.temperature} </div>
          <div class="qty">${label.indexInTemp}/${label.totalInTemp}</div>
        </div>
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
    position: relative; overflow: visible;
    page-break-after: always;
  }
  .label-item:last-child { page-break-after: auto; }
  .label-inner {
    position: absolute; top: 50%; left: 50%;
    width: 133mm; height: 76mm;
    margin-top: -38mm; margin-left: -66.5mm;
    transform: rotate(90deg);
    padding: 3mm;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .store-name {
    text-align: center; font-size: 26pt; font-weight: bold; color: #000;
    margin-bottom: 2mm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    border-bottom: 3px solid #217346; padding-bottom: 3px;
  }
  .info-row { font-size: 18pt; margin-bottom: 1mm; color: #000; font-weight: bold; line-height: 1.3; }
  .info-row.addr { font-size: 15pt; }
  .phone-tail { font-size: 20pt; }
  .bottom-row { display: flex; align-items: center; justify-content: space-between; }
  .date { font-size: 15pt; color: #000; font-weight: bold; white-space: nowrap; }
  .temp-badge {
    padding: 4px 16px; border-radius: 4px; font-weight: bold; font-size: 18pt;
    display: inline-flex; align-items: center; white-space: nowrap;
  }
  .qty { font-size: 29pt; font-weight: bold; color: #000; }
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
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchLabels, setBatchLabels] = useState<PrintLabel[]>([])
  const [batchSummary, setBatchSummary] = useState<{
    totalRows: number
    successRows: number
  } | null>(null)
  const [printing, setPrinting] = useState(false)

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

    const dateStr = nowStr()
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
          contactAddress: contact.address,
          temperature: temp,
          totalInTemp: count,
          indexInTemp: i,
          date: dateStr,
          totalPrintCount: totalQuantity,
          printIndex: printIdx,
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
            onClick={() => { setActiveTab('single'); setBatchLabels([]); setBatchSummary(null); setBatchError(null) }}
          >
            📋 单件新建
          </button>
          <button
            className={`tab-btn ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => { setActiveTab('batch'); setBatchLabels([]); setBatchSummary(null); setBatchError(null) }}
          >
            📊 批量新建
          </button>
        </div>

        {activeTab === 'single' && (
          <div className="card fade-in-up" style={{ maxWidth: 640, margin: '0 auto', animationDelay: '0.1s' }}>
            <h2 className="card-title"><span className="icon">📋</span>面单信息</h2>

            <div className="form-grid">
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
            batchError={batchError}
            batchSummary={batchSummary}
            batchLabels={batchLabels}
            setBatchLoading={setBatchLoading}
            setBatchError={setBatchError}
            setBatchSummary={setBatchSummary}
            setBatchLabels={setBatchLabels}
          />
        )}

        <div className="app-footer" style={{ marginTop: 32 }}>
          WMS 面单打印系统
        </div>
      </div>
    </div>
  )
}

// Batch upload panel
interface BatchUploadPanelProps {
  fileInputRef: React.RefObject<HTMLInputElement>
  batchLoading: boolean
  batchError: string | null
  batchSummary: { totalRows: number; successRows: number } | null
  batchLabels: PrintLabel[]
  setBatchLoading: (loading: boolean) => void
  setBatchError: (error: string | null) => void
  setBatchSummary: (summary: { totalRows: number; successRows: number } | null) => void
  setBatchLabels: (labels: PrintLabel[]) => void
}

function BatchUploadPanel({
  fileInputRef, batchLoading, batchError, batchSummary, batchLabels,
  setBatchLoading, setBatchError, setBatchSummary, setBatchLabels,
}: BatchUploadPanelProps) {
  const handleBatchFile = async (file: File) => {
    setBatchLoading(true)
    setBatchError(null)
    setBatchSummary(null)
    setBatchLabels([])

    try {
      const XLSX = (await import('xlsx')).default
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: {
        '门店'?: string; '收货人'?: string; '联系电话'?: number | string
        '日期'?: number | string; '温区'?: string; '总件数'?: number
      }[] = XLSX.utils.sheet_to_json(ws)

      if (rows.length === 0) {
        setBatchError('Excel文件为空，请检查模板')
        setBatchLoading(false)
        return
      }

      const labels: PrintLabel[] = []
      const errors: string[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNum = i + 2
        const storeName = String(row['门店'] || '').trim()
        const contactName = String(row['收货人'] || '').trim()
        const phone = String(row['联系电话'] || '').trim()
        const temp = String(row['温区'] || '').trim()
        const total = Number(row['总件数'])
        const dateValue = row['日期']

        if (!storeName || !contactName || !phone || !temp || !total || total <= 0) {
          errors.push(`第${rowNum}行：数据不完整`)
          continue
        }
        if (!['冷冻', '冷藏', '常温'].includes(temp)) {
          errors.push(`第${rowNum}行：温区 "${temp}" 无效`)
          continue
        }

        let dateStr: string
        if (typeof dateValue === 'number') {
          dateStr = excelDateToString(dateValue)
        } else if (dateValue) {
          dateStr = new Date(dateValue as string).toLocaleString('zh-CN', {
            year: '2-digit', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
          })
        } else {
          dateStr = nowStr()
        }

        const phoneStr = phone.replace(/\.0$/, '')

        for (let j = 1; j <= total; j++) {
          labels.push({
            storeName, contactName, contactPhone: phoneStr,
            contactAddress: null, temperature: temp,
            totalInTemp: total, indexInTemp: j, date: dateStr,
            totalPrintCount: 0, printIndex: 0,
          })
        }
      }

      // 第二遍：填入本次打印的序号和总数
      const totalCount = labels.length
      labels.forEach((l, idx) => {
        l.totalPrintCount = totalCount
        l.printIndex = idx + 1
      })

      if (errors.length > 0) setBatchError(`以下行有问题，已跳过：\n${errors.join('\n')}`)

      setBatchSummary({ totalRows: rows.length, successRows: rows.length - errors.length })
      setBatchLabels(labels)

      if (labels.length > 0) {
        fetch('/api/print-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId: '', contactId: '', temperature: '批量上传', quantity: labels.length }),
        }).catch(() => {})
      }
    } catch {
      setBatchError('解析Excel文件失败，请检查文件格式')
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

  return (
    <div className="card fade-in-up" style={{ maxWidth: 640, margin: '0 auto', animationDelay: '0.1s' }}>
      <h2 className="card-title"><span className="icon">📊</span>批量上传</h2>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16,
      }}>
        <div className="print-hint" style={{ background: '#E0F2FE', borderColor: '#7DD3FC', color: '#075985', margin: 0, flex: 1 }}>
          📋 按模板格式填写后上传，支持 <code>.xls</code> / <code>.xlsx</code>
        </div>
        <a href="/批量模板.xls" download="批量模板.xls" className="btn btn--secondary" style={{ padding: '10px 16px', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
          📥 下载模板
        </a>
      </div>

      <div style={{ border: '2px dashed var(--card-border)', borderRadius: 12, padding: '40px 24px', textAlign: 'center', transition: 'border-color 0.2s' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>点击选择Excel文件</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>支持 .xls 和 .xlsx 格式</div>
        <input ref={fileInputRef} type="file" accept=".xls,.xlsx" onChange={handleFileChange} style={{ display: 'none' }} />
        <button className="btn btn--secondary" onClick={() => fileInputRef.current?.click()} disabled={batchLoading} style={{ padding: '10px 24px' }}>
          {batchLoading ? '处理中...' : '选择文件'}
        </button>
      </div>

      {batchError && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: 13, whiteSpace: 'pre-line' }}>
          ⚠️ {batchError}
        </div>
      )}

      {batchSummary && (
        <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--primary-10, #E8F5EC)', border: '1px solid var(--primary)', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <strong style={{ color: 'var(--primary)', fontSize: 15 }}>解析成功！</strong>
          </div>
          <div style={{ fontSize: 14 }}>
            共 <strong>{batchSummary.totalRows}</strong> 行，有效 <strong style={{ color: 'var(--primary)' }}>{batchSummary.successRows}</strong> 行，生成 <strong style={{ color: 'var(--primary)' }}>{batchLabels.length}</strong> 张面单
          </div>
          <button className="btn btn--primary btn--full" style={{ marginTop: 16 }} onClick={() => printLabels(batchLabels)} disabled={batchLabels.length === 0}>
            🖨 立即打印 ({batchLabels.length} 张)
          </button>
        </div>
      )}
    </div>
  )
}
