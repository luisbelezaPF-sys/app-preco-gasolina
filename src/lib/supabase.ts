import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface FuelPrice {
  id: string
  type: string
  price: number
  previous_price: number
  last_updated: string
  created_at: string
}

export interface PriceHistory {
  id: string
  fuel_type: string
  old_price: number
  new_price: number
  change_type: 'increase' | 'decrease' | 'same'
  timestamp: string
  created_at: string
}

export interface NotificationSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}