// Configuração para notificações push
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

// Função para solicitar permissão de notificação
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Função para enviar notificação local
export function sendLocalNotification(title: string, body: string, icon?: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'price-update',
      requireInteraction: false,
      silent: false
    })
  }
}

// Função para registrar service worker para notificações push
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker não é suportado')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registrado:', registration)
    return registration
  } catch (error) {
    console.error('Erro ao registrar Service Worker:', error)
    return null
  }
}

// Função para subscrever notificações push
export async function subscribeToPushNotifications(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY) {
    console.log('VAPID public key não configurada')
    return null
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    console.log('Subscrito a notificações push:', subscription)
    return subscription
  } catch (error) {
    console.error('Erro ao subscrever notificações push:', error)
    return null
  }
}

// Função auxiliar para converter VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Função para formatar notificação de mudança de preço
export function formatPriceChangeNotification(fuelType: string, oldPrice: number, newPrice: number): { title: string, body: string } {
  const change = newPrice > oldPrice ? 'aumentou' : 'diminuiu'
  const emoji = newPrice > oldPrice ? '📈' : '📉'
  
  return {
    title: `${emoji} Auto Posto Mae Rainha`,
    body: `${fuelType} ${change} de R$ ${oldPrice.toFixed(2)} para R$ ${newPrice.toFixed(2)}`
  }
}