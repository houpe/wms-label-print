'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/print/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '登录失败')
        return
      }

      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
      padding: 16,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#fff',
        borderRadius: 'var(--radius-lg, 16px)',
        boxShadow: '0 4px 24px rgba(33, 115, 70, 0.10), 0 1px 4px rgba(33, 115, 70, 0.06)',
        padding: '48px 36px 36px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--primary, #217346)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 16,
          }}>W</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text, #1a1a1a)', margin: 0 }}>
            WMS · 面单打印系统
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted, #999)', marginTop: 8 }}>
            请登录以继续
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
              required
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px',
                fontSize: 15,
                border: '2px solid #CBD5C3',
                borderRadius: 'var(--radius-sm, 8px)',
                background: '#F8FAF8',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#217346')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5C3')}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px',
                fontSize: 15,
                border: '2px solid #CBD5C3',
                borderRadius: 'var(--radius-sm, 8px)',
                background: '#F8FAF8',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#217346')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5C3')}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 8,
              color: '#991B1B',
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: 44,
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              background: loading ? '#6B9E80' : 'var(--primary, #217346)',
              border: 'none',
              borderRadius: 'var(--radius-sm, 8px)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  )
}
