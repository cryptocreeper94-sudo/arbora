const SESSION_ID = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

function getDeviceInfo() {
  return {
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
    platform: navigator.platform,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    cookiesEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    language: navigator.language,
    connection: (navigator as any).connection?.effectiveType || 'unknown',
  };
}

async function sendLog(data: {
  level: string;
  message: string;
  stack?: string | null;
  source?: string;
  metadata?: Record<string, any> | null;
}) {
  try {
    await fetch('/api/diagnostics/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        url: window.location.href,
        userAgent: navigator.userAgent,
        deviceInfo: getDeviceInfo(),
        sessionId: SESSION_ID,
      }),
    });
  } catch {
  }
}

export function trackError(message: string, stack?: string | null, metadata?: Record<string, any>) {
  sendLog({ level: 'error', message, stack, source: 'frontend', metadata });
}

export function trackWarn(message: string, metadata?: Record<string, any>) {
  sendLog({ level: 'warn', message, source: 'frontend', metadata });
}

export function trackInfo(message: string, metadata?: Record<string, any>) {
  sendLog({ level: 'info', message, source: 'frontend', metadata });
}

export function trackAuthEvent(event: string, metadata?: Record<string, any>) {
  sendLog({ level: 'info', message: event, source: 'auth', metadata });
}

export function trackNetworkError(url: string, status: number, message: string) {
  sendLog({
    level: 'error',
    message: `Network error: ${status} ${message}`,
    source: 'network',
    metadata: { requestUrl: url, status },
  });
}

export function initErrorTracking() {
  window.addEventListener('error', (event) => {
    trackError(
      event.message || 'Unknown error',
      event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      { type: 'uncaught_error' }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason) || 'Unhandled promise rejection';
    trackError(message, event.reason?.stack, { type: 'unhandled_rejection' });
  });

  trackInfo('App initialized', {
    type: 'app_start',
    deviceInfo: getDeviceInfo(),
  });
}
