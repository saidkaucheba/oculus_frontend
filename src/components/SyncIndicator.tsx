import { useState, useEffect } from 'react';
import { useSyncStatus } from '../api.hooks';

export default function SyncIndicator() {
  const { pendingCount, status, lastSyncAt, lastError, sync } = useSyncStatus();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  let dotColor = '#3ea515';
  let label    = 'Онлайн';
  let pulse    = false;

  if (!isOnline) {
    dotColor = '#b8950a';
    label    = pendingCount > 0
      ? `Офлайн · ${pendingCount} ${noun(pendingCount)} в очереди`
      : 'Офлайн';
  } else if (status === 'syncing') {
    dotColor = '#1a6cd4';
    label    = `Синхронизация...`;
    pulse    = true;
  } else if (status === 'error') {
    dotColor = '#a70b0b';
    label    = 'Ошибка синхронизации';
  } else if (pendingCount > 0) {
    dotColor = '#1a6cd4';
    label    = `${pendingCount} ${noun(pendingCount)} ожидает`;
    pulse    = true;
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDetails(v => !v)}
        title={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 10px',
          borderRadius: 50,
          backgroundColor: 'rgba(255,255,255,0.12)',
          transition: 'background-color 0.18s',
          color: '#FFFFFF',
          fontSize: 13,
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}
      >
        <span style={{
          width: 9, height: 9,
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
          flexShrink: 0,
          boxShadow: pulse ? `0 0 0 2px ${dotColor}55` : undefined,
          animation: pulse ? 'sync-pulse 1.2s ease-in-out infinite' : undefined,
        }} />
        <span style={{ display: 'none', '@media (min-width: 480px)': { display: 'inline' } } as React.CSSProperties}>
          {label}
        </span>
        <style>{`
          @keyframes sync-pulse {
            0%, 100% { box-shadow: 0 0 0 0px ${dotColor}88; }
            50%       { box-shadow: 0 0 0 4px ${dotColor}22; }
          }
        `}</style>
      </button>

      {showDetails && (
        <>

          <div
            onClick={() => setShowDetails(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
          />

          <div style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            zIndex: 1001,
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '16px 20px',
            minWidth: 280,
            color: '#000000',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              Статус синхронизации
            </div>

            <Row
              dot={isOnline ? '#3ea515' : '#b8950a'}
              label={isOnline ? 'Подключение есть' : 'Нет подключения к интернету'}
            />

            {pendingCount > 0 && (
              <Row
                dot="#1a6cd4"
                label={`${pendingCount} ${noun(pendingCount)} ожидает отправки`}
              />
            )}

            {lastError && (
              <div style={{
                marginTop: 10,
                backgroundColor: '#fde8e8',
                color: '#a70b0b',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
              }}>
                {lastError}
              </div>
            )}

            {lastSyncAt && (
              <div style={{ fontSize: 12, color: '#616161', marginTop: 10 }}>
                Последняя синхронизация: {formatTime(lastSyncAt)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {isOnline && pendingCount > 0 && (
                <button
                  onClick={() => { sync(); setShowDetails(false); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#39568A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  🔄 Синхронизировать сейчас
                </button>
              )}
              {pendingCount === 0 && isOnline && (
                <div style={{ fontSize: 13, color: '#3ea515', fontWeight: 600 }}>
                  ✅ Все данные синхронизированы
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ dot, label }: { dot: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  );
}

function noun(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'операция';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'операции';
  return 'операций';
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
