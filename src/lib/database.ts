import { supabase } from './supabase'

export interface FuelPriceData {
  id: string
  type: string
  price: number
  previousPrice: number
  lastUpdated: Date
}

export interface PriceHistoryData {
  id: string
  fuelType: string
  oldPrice: number
  newPrice: number
  timestamp: Date
  change: 'increase' | 'decrease' | 'same'
}

// Função para buscar preços dos combustíveis
export async function getFuelPrices(): Promise<FuelPriceData[]> {
  try {
    const { data, error } = await supabase
      .from('fuel_prices')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar preços:', error)
      return getDefaultPrices()
    }

    return data?.map(item => ({
      id: item.id,
      type: item.type,
      price: item.price,
      previousPrice: item.previous_price,
      lastUpdated: new Date(item.last_updated)
    })) || getDefaultPrices()
  } catch (error) {
    console.error('Erro na conexão:', error)
    return getDefaultPrices()
  }
}

// Função para atualizar preço de combustível
export async function updateFuelPrice(id: string, newPrice: number): Promise<boolean> {
  try {
    // Primeiro, buscar o preço atual
    const { data: currentData, error: fetchError } = await supabase
      .from('fuel_prices')
      .select('price, type')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar preço atual:', fetchError)
      return false
    }

    const oldPrice = currentData.price

    // Atualizar o preço
    const { error: updateError } = await supabase
      .from('fuel_prices')
      .update({
        previous_price: oldPrice,
        price: newPrice,
        last_updated: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao atualizar preço:', updateError)
      return false
    }

    // Adicionar ao histórico
    const change = newPrice > oldPrice ? 'increase' : newPrice < oldPrice ? 'decrease' : 'same'
    
    await supabase
      .from('price_history')
      .insert({
        fuel_type: currentData.type,
        old_price: oldPrice,
        new_price: newPrice,
        change_type: change,
        timestamp: new Date().toISOString()
      })

    return true
  } catch (error) {
    console.error('Erro na atualização:', error)
    return false
  }
}

// Função para buscar histórico de preços
export async function getPriceHistory(): Promise<PriceHistoryData[]> {
  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erro ao buscar histórico:', error)
      return []
    }

    return data?.map(item => ({
      id: item.id,
      fuelType: item.fuel_type,
      oldPrice: item.old_price,
      newPrice: item.new_price,
      timestamp: new Date(item.timestamp),
      change: item.change_type
    })) || []
  } catch (error) {
    console.error('Erro na conexão:', error)
    return []
  }
}

// Função para inicializar dados padrão
export async function initializeDefaultData(): Promise<void> {
  try {
    // Verificar se já existem dados
    const { data: existingData } = await supabase
      .from('fuel_prices')
      .select('id')
      .limit(1)

    if (existingData && existingData.length > 0) {
      return // Dados já existem
    }

    // Inserir dados padrão
    const defaultPrices = [
      { id: '1', type: 'Gasolina Comum', price: 5.89, previous_price: 5.85 },
      { id: '2', type: 'Gasolina Aditivada', price: 6.15, previous_price: 6.12 },
      { id: '3', type: 'Etanol', price: 4.25, previous_price: 4.30 },
      { id: '4', type: 'Diesel', price: 6.45, previous_price: 6.40 }
    ]

    const { error } = await supabase
      .from('fuel_prices')
      .insert(defaultPrices.map(price => ({
        ...price,
        last_updated: new Date().toISOString()
      })))

    if (error) {
      console.error('Erro ao inicializar dados:', error)
    }
  } catch (error) {
    console.error('Erro na inicialização:', error)
  }
}

// Preços padrão para fallback
function getDefaultPrices(): FuelPriceData[] {
  return [
    { id: '1', type: 'Gasolina Comum', price: 5.89, previousPrice: 5.85, lastUpdated: new Date() },
    { id: '2', type: 'Gasolina Aditivada', price: 6.15, previousPrice: 6.12, lastUpdated: new Date() },
    { id: '3', type: 'Etanol', price: 4.25, previousPrice: 4.30, lastUpdated: new Date() },
    { id: '4', type: 'Diesel', price: 6.45, previousPrice: 6.40, lastUpdated: new Date() }
  ]
}