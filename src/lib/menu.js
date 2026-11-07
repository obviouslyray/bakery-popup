import { supabase } from './supabase.js'

// Reads the menu. Row level security decides what comes back: customers get
// only items on today's menu, owners get everything.
export async function fetchMenu() {
  if (!supabase) throw new Error('Supabase is not set up')
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price, category, ingredients, allergens, photo_path, on_today, sold_out, sort_order')
    .order('sort_order')
    .order('name')
  if (error) throw error
  return data
}

export function menuPhotoUrl(path) {
  return path ? supabase.storage.from('menu-photos').getPublicUrl(path).data.publicUrl : null
}

const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const formatPrice = (price) => priceFormat.format(Number(price))
