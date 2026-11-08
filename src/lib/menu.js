import { supabase } from './supabase.js'
import { preparePhoto } from './image.js'

const COLUMNS = 'id, name, description, price, category, ingredients, allergens, photo_path, on_today, sold_out, sort_order, section'

// Sections inside the Beverages folder (category 'coffee'), in display order.
// A beverage with no section stays in the database but is hidden from customers.
export const BEVERAGE_SECTIONS = [
  { key: 'coffees', title: 'Coffees' },
  { key: 'fresh-squeezed', title: 'Fresh-Squeezed' },
  { key: 'seasonal', title: 'Seasonal', emptyText: 'New seasonal drinks coming soon.' },
  { key: 'milk-options', title: 'Milk Options', addOn: true },
]
const BUCKET = 'menu-photos'

// Reads the menu. Row level security decides what comes back: customers get
// only items on today's menu, owners get everything.
export async function fetchMenu() {
  if (!supabase) throw new Error('Supabase is not set up')
  const { data, error } = await supabase
    .from('menu_items')
    .select(COLUMNS)
    .order('sort_order')
    .order('name')
  if (error) throw error
  return data
}

// Calls onChange whenever the menu may have changed; returns a stop function.
// Realtime covers most edits within a second or so. It can't report an item
// turned off for today (customers lose access to that row, so they get no
// event), so the menu also refreshes on return to the app and once a minute.
export function watchMenu(onChange) {
  if (!supabase) return () => {}

  let debounce
  const channel = supabase
    .channel('menu-items')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
      clearTimeout(debounce)
      debounce = setTimeout(onChange, 300)
    })
    .subscribe()

  const refreshIfVisible = () => {
    if (!document.hidden) onChange()
  }
  const poll = setInterval(refreshIfVisible, 60 * 1000)
  document.addEventListener('visibilitychange', refreshIfVisible)

  return () => {
    clearTimeout(debounce)
    clearInterval(poll)
    document.removeEventListener('visibilitychange', refreshIfVisible)
    supabase.removeChannel(channel)
  }
}

// Writes below only succeed for a signed-in owner. Row level security turns a
// refused update into "no rows", which .single() reports as an error.
const SAVE_ERROR = 'Could not save. Check your connection, or sign in again.'

export async function insertMenuItem(row) {
  const { data, error } = await supabase.from('menu_items').insert(row).select(COLUMNS).single()
  if (error) throw new Error(SAVE_ERROR)
  return data
}

export async function updateMenuItem(id, patch) {
  const { data, error } = await supabase.from('menu_items').update(patch).eq('id', id).select(COLUMNS).single()
  if (error) throw new Error(SAVE_ERROR)
  return data
}

export async function deleteMenuItem(item) {
  const { data, error } = await supabase.from('menu_items').delete().eq('id', item.id).select('id')
  if (error || data.length === 0) throw new Error('Could not delete. Check your connection, or sign in again.')
  await removeMenuPhoto(item.photo_path)
}

// Gives the items in `ordered` sort_order 10, 20, 30... and saves the ones that changed.
export async function saveOrder(ordered) {
  const changed = ordered
    .map((item, i) => ({ item, sort_order: (i + 1) * 10 }))
    .filter(({ item, sort_order }) => item.sort_order !== sort_order)
  await Promise.all(changed.map(({ item, sort_order }) => updateMenuItem(item.id, { sort_order })))
}

export async function uploadMenuPhoto(itemId, file) {
  const blob = await preparePhoto(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${itemId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type })
  if (error) throw new Error('Could not upload the photo. Try again.')
  return path
}

// Best effort: a leftover photo file is harmless, so failures are ignored.
export async function removeMenuPhoto(path) {
  if (path) await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
}

export function menuPhotoUrl(path) {
  return path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null
}

const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const formatPrice = (price) => priceFormat.format(Number(price))

export const COMMON_ALLERGENS = ['milk', 'eggs', 'wheat', 'soy', 'peanuts', 'tree nuts', 'sesame', 'fish', 'shellfish']
