'use client'

import { useState, useEffect } from 'react'
import { Fuel, Shield, Bell, Settings, TrendingUp, TrendingDown, Minus, Smartphone, Monitor, Tablet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { requestNotificationPermission, sendLocalNotification, formatPriceChangeNotification } from '@/lib/notifications'

interface FuelPrice {
  id: string
  type: string
  price: number
  previousPrice: number
  lastUpdated: Date
}

interface PriceHistory {
  id: string
  fuelType: string
  oldPrice: number
  newPrice: number
  timestamp: Date
  change: 'increase' | 'decrease' | 'same'
}

export default function GasStationApp() {
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([
    { id: '1', type: 'Gasolina Comum', price: 5.89, previousPrice: 5.85, lastUpdated: new Date() },
    { id: '2', type: 'Gasolina Aditivada', price: 6.15, previousPrice: 6.12, lastUpdated: new Date() },
    { id: '3', type: 'Etanol', price: 4.25, previousPrice: 4.30, lastUpdated: new Date() },
    { id: '4', type: 'Diesel', price: 6.45, previousPrice: 6.40, lastUpdated: new Date() }
  ])

  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [editingPrices, setEditingPrices] = useState<{[key: string]: string}>({})
  const [notifications, setNotifications] = useState<string[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  // Inicializar notificações
  useEffect(() => {
    const initNotifications = async () => {
      const permission = await requestNotificationPermission()
      setNotificationsEnabled(permission)
      
      if (permission) {
        toast.success('Notificações ativadas! Você será avisado sobre mudanças de preços.')
      }
    }
    
    initNotifications()
  }, [])

  const handleAdminLogin = () => {
    if (adminPassword === 'gaspar4040') {
      setIsAdminMode(true)
      setAdminPassword('')
      toast.success('Login administrativo realizado com sucesso!')
    } else {
      toast.error('Senha incorreta!')
    }
  }

  const handlePriceUpdate = (fuelId: string) => {
    const newPrice = parseFloat(editingPrices[fuelId])
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error('Preço inválido!')
      return
    }

    setFuelPrices(prev => prev.map(fuel => {
      if (fuel.id === fuelId) {
        const oldPrice = fuel.price
        const change = newPrice > oldPrice ? 'increase' : newPrice < oldPrice ? 'decrease' : 'same'
        
        // Adicionar ao histórico
        const historyEntry: PriceHistory = {
          id: Date.now().toString(),
          fuelType: fuel.type,
          oldPrice,
          newPrice,
          timestamp: new Date(),
          change
        }
        setPriceHistory(prev => [historyEntry, ...prev.slice(0, 9)])

        // Enviar notificação
        if (change !== 'same') {
          const message = `${fuel.type}: R$ ${oldPrice.toFixed(2)} → R$ ${newPrice.toFixed(2)}`
          setNotifications(prev => [message, ...prev.slice(0, 4)])
          
          // Notificação local
          if (notificationsEnabled) {
            const { title, body } = formatPriceChangeNotification(fuel.type, oldPrice, newPrice)
            sendLocalNotification(title, body)
          }
          
          toast.success(`Preço atualizado: ${fuel.type}`)
        }

        return {
          ...fuel,
          previousPrice: oldPrice,
          price: newPrice,
          lastUpdated: new Date()
        }
      }
      return fuel
    }))

    setEditingPrices(prev => ({ ...prev, [fuelId]: '' }))
  }

  const getPriceChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-red-500" />
    if (current < previous) return <TrendingDown className="w-4 h-4 text-green-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getPriceChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-red-500'
    if (current < previous) return 'text-green-500'
    return 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-red-50">
      {/* Header com identidade visual baseada na foto */}
      <header className="bg-gradient-to-r from-red-600 via-red-700 to-black text-white shadow-2xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Logo e Nome */}
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-400 p-4 rounded-full shadow-lg">
                <Fuel className="w-10 h-10 text-black" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-white">
                  MAE RAINHA
                </h1>
                <p className="text-xl md:text-2xl font-medium text-yellow-300">
                  AUTO POSTO DO GASPAR
                </p>
              </div>
            </div>

            {/* Badges e Notificações */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Badge variant="secondary" className="bg-yellow-400 text-black font-semibold px-4 py-2">
                ⚡ Preços em Tempo Real
              </Badge>
              
              <div className="flex items-center space-x-2 text-sm">
                <Smartphone className="w-4 h-4" />
                <span>Android</span>
                <span>•</span>
                <Tablet className="w-4 h-4" />
                <span>iOS</span>
                <span>•</span>
                <Monitor className="w-4 h-4" />
                <span>PC</span>
              </div>

              {notifications.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Bell className="w-4 h-4 mr-2" />
                      {notifications.length} Alertas
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>🔔 Últimas Atualizações</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {notifications.map((notification, index) => (
                        <div key={index} className="p-3 bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg border-l-4 border-red-500">
                          <div className="text-sm font-medium text-gray-800">
                            {notification}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Agora mesmo
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Status de Notificações */}
        <div className="mb-6">
          <Card className="border-2 border-dashed border-yellow-300 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className={`w-5 h-5 ${notificationsEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium">
                      {notificationsEnabled ? '🔔 Notificações Ativadas' : '🔕 Notificações Desativadas'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {notificationsEnabled 
                        ? 'Você será avisado sobre mudanças de preços' 
                        : 'Ative as notificações para receber alertas'
                      }
                    </div>
                  </div>
                </div>
                {!notificationsEnabled && (
                  <Button 
                    onClick={() => requestNotificationPermission().then(setNotificationsEnabled)}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Ativar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preços dos Combustíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {fuelPrices.map((fuel) => (
            <Card key={fuel.id} className="relative overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white">
              {/* Barra colorida no topo */}
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-red-600"></div>
              
              <CardHeader className="pb-3 pt-6">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="text-gray-800 font-bold">{fuel.type}</span>
                  {getPriceChangeIcon(fuel.price, fuel.previousPrice)}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="text-center space-y-3">
                  {/* Preço Principal */}
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    R$ {fuel.price.toFixed(2)}
                  </div>
                  
                  {/* Preço Anterior */}
                  <div className={`text-sm font-medium ${getPriceChangeColor(fuel.price, fuel.previousPrice)}`}>
                    Anterior: R$ {fuel.previousPrice.toFixed(2)}
                  </div>
                  
                  {/* Última Atualização */}
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1">
                    Atualizado: {fuel.lastUpdated.toLocaleTimeString()}
                  </div>
                  
                  {/* Área Admin */}
                  {isAdminMode && (
                    <div className="mt-4 space-y-3 p-4 bg-red-50 rounded-lg border-2 border-red-200">
                      <Label className="text-sm font-medium text-red-800">Novo Preço:</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editingPrices[fuel.id] || ''}
                        onChange={(e) => setEditingPrices(prev => ({ ...prev, [fuel.id]: e.target.value }))}
                        className="text-center text-lg font-bold"
                      />
                      <Button 
                        onClick={() => handlePriceUpdate(fuel.id)}
                        className="w-full bg-red-600 hover:bg-red-700 font-bold"
                        size="sm"
                      >
                        💾 Atualizar Preço
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Histórico de Mudanças */}
        {priceHistory.length > 0 && (
          <Card className="mb-8 border-2">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>📊 Histórico de Alterações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {priceHistory.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        entry.change === 'increase' ? 'bg-red-100' : 
                        entry.change === 'decrease' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {entry.change === 'increase' ? (
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        ) : entry.change === 'decrease' ? (
                          <TrendingDown className="w-4 h-4 text-green-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{entry.fuelType}</div>
                        <div className="text-sm text-gray-600">
                          R$ {entry.oldPrice.toFixed(2)} → R$ {entry.newPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {entry.timestamp.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {entry.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Área Administrativa */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>🔐 Área Administrativa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isAdminMode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Senha do Administrador</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite a senha (gaspar4040)"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleAdminLogin} className="w-full bg-red-600 hover:bg-red-700 font-bold">
                  <Settings className="w-4 h-4 mr-2" />
                  🔑 Entrar como Administrador
                </Button>
                <div className="text-xs text-gray-500 text-center">
                  Apenas administradores podem alterar os preços
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="bg-green-600 text-white px-3 py-1">
                    ✅ Modo Administrador Ativo
                  </Badge>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAdminMode(false)}
                    size="sm"
                  >
                    🚪 Sair
                  </Button>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-green-800 font-medium">
                    🎯 Você pode agora atualizar os preços dos combustíveis.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Os clientes serão notificados automaticamente sobre as mudanças.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="bg-yellow-400 p-2 rounded-full">
                <Fuel className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold">Auto Posto Mae Rainha</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
              <span>📱 Funciona em Android, iOS e PC</span>
              <span>•</span>
              <span>⚡ Preços em tempo real</span>
              <span>•</span>
              <span>🔔 Notificações automáticas</span>
            </div>
            
            <div className="text-gray-500 text-xs">
              © 2024 Auto Posto do Gaspar - Todos os direitos reservados
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}