import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import './styles/global.css'
import { AuthProvider } from './AuthContext'
import App from './App.tsx'
import { syncQueue } from './offlineQueue'

const updateSW = registerSW({
  onNeedRefresh() {
    showUpdateToast(updateSW)
  },
  onOfflineReady() {
    showToast('✅ Приложение готово к работе без интернета', '#3ea515', 4000)
  },
})

async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    if ('sync' in reg) {
      await (reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } })
        .sync.register('oculus-sync')
      console.info('[PWA] Background Sync зарегистрирован: oculus-sync')
    }
  } catch {
  }
}

if (navigator.onLine) {
  syncQueue()
}

window.addEventListener('online', () => {
  showToast('🌐 Соединение восстановлено — синхронизация данных...', '#1a6cd4', 3000)
  syncQueue()
})

window.addEventListener('offline', () => {
  showToast('📵 Нет интернета — изменения сохраняются локально', '#b8950a', 4000)
})

navigator.serviceWorker?.ready.then(registerBackgroundSync)

navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.type === 'BACKGROUND_SYNC_COMPLETE') {
    syncQueue()
  }
})

function showToast(message: string, color: string, duration: number) {
  document.getElementById('pwa-toast')?.remove()

  const el = document.createElement('div')
  el.id = 'pwa-toast'
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '9999',
    backgroundColor: color,
    color: '#FFFFFF',
    borderRadius: '50px',
    padding: '11px 22px',
    fontSize: '14px',
    fontFamily: "'Bitter', serif",
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    whiteSpace: 'nowrap',
    animation: 'pwa-fadein 0.25s ease',
    pointerEvents: 'none',
  })

  const style = document.createElement('style')
  style.textContent = `
    @keyframes pwa-fadein {
      from { opacity: 0; transform: translateX(-50%) translateY(12px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `
  document.head.appendChild(style)
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), duration)
}

function showUpdateToast(updateSW: (reload?: boolean) => Promise<void>) {
  document.getElementById('pwa-update-toast')?.remove()

  const el = document.createElement('div')
  el.id = 'pwa-update-toast'
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', left: '50%',
    transform: 'translateX(-50%)', zIndex: '9999',
    backgroundColor: '#39568A', color: '#FFFFFF',
    borderRadius: '50px', padding: '12px 20px',
    fontSize: '14px', fontFamily: "'Bitter', serif",
    display: 'flex', alignItems: 'center', gap: '14px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    maxWidth: '90vw',
  })

  const text = document.createElement('span')
  text.textContent = '🔄 Доступна новая версия'

  const btn = document.createElement('button')
  btn.textContent = 'Обновить'
  Object.assign(btn.style, {
    backgroundColor: '#FFFFFF', color: '#39568A', border: 'none',
    borderRadius: '50px', padding: '6px 16px', fontSize: '13px',
    fontWeight: '700', cursor: 'pointer', fontFamily: "'Bitter', serif",
  })
  btn.onclick = () => { el.remove(); updateSW(true) }

  const x = document.createElement('button')
  x.textContent = '✕'
  Object.assign(x.style, {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer', fontSize: '16px', padding: '0 4px',
  })
  x.onclick = () => el.remove()

  el.append(text, btn, x)
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 30_000)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
