// Service Worker para notificações push
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  console.log('Notificação push recebida:', event)
  
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'price-update',
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'Ver Preços'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event)
  
  event.notification.close()
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/')
    )
  }
})