// #menu section - all the database stuff for the menu
import { supabase } from './supabase.js'
import { preparePhoto } from './image.js'

// columns we read from menu_items
const COLUMNS = 'id, name, description, price, category, ingredients, allergens, photo_path, on_today, sold_out, sort_order, section'

// #menu visibility - sections inside the beverages folder, in order.
// a drink with no section stays in the database but customers don't see it
export const BEVERAGE_SECTIONS = [
  { key: 'coffees', title: 'Coffees' },
  { key: 'fresh-squeezed', title: 'Fresh-Squeezed' },
  { key: 'seasonal', title: 'Seasonal', emptyText: 'New seasonal drinks coming soon.' },
  { key: 'milk-options', title: 'Milk Options', addOn: true },
]
const BUCKET = 'menu-photos'

// #menu visibility - gets the menu. RLS decides what comes back: customers only get
// items that are on_today, owners get everything
export async function fetchMenu() {
  if (!supabase) throw new Error('Supabase is not set up')
  const { data, error } = await supabase
    .from('menu_items')
    .select(COLUMNS)
    .order('sort_order') // owner sets the order
    .order('name')
  if (error) throw error
  return data
}

// realtime - calls onChange when the menu might have changed, returns a stop function.
// realtime catches most edits in about a second. it can't tell customers when an item gets
// turned off (they lose access to the row so no event), so we also refresh every minute
// and when you come back to the app
export function watchMenu(onChange) {
  if (!supabase) return () => {}

  // waits a bit so a bunch of changes at once only reload once
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
  const poll = setInterval(refreshIfVisible, 60 * 1000) // every 60 sec
  document.addEventListener('visibilitychange', refreshIfVisible)

  return () => {
    clearTimeout(debounce)
    clearInterval(poll)
    document.removeEventListener('visibilitychange', refreshIfVisible)
    supabase.removeChannel(channel)
  }
}

// #security - these only work for a logged in owner. if RLS blocks an update it returns no rows,
// and .single() turns that into an error
const SAVE_ERROR = 'Could not save. Check your connection, or sign in again.'

// #menu editor - add a new item
export async function insertMenuItem(row) {
  const { data, error } = await supabase.from('menu_items').insert(row).select(COLUMNS).single()
  if (error) throw new Error(SAVE_ERROR)
  return data
}

// #menu editor / #sold out / #menu visibility - change an item
export async function updateMenuItem(id, patch) {
  const { data, error } = await supabase.from('menu_items').update(patch).eq('id', id).select(COLUMNS).single()
  if (error) throw new Error(SAVE_ERROR)
  return data
}

// #menu delete - deletes the row then its photo
export async function deleteMenuItem(item) {
  const { data, error } = await supabase.from('menu_items').delete().eq('id', item.id).select('id')
  if (error || data.length === 0) throw new Error('Could not delete. Check your connection, or sign in again.') // 0 rows = it didn't actually delete
  await removeMenuPhoto(item.photo_path)
}

// sets sort_order to 10, 20, 30... and only saves the ones that changed
export async function saveOrder(ordered) {
  const changed = ordered
    .map((item, i) => ({ item, sort_order: (i + 1) * 10 }))
    .filter(({ item, sort_order }) => item.sort_order !== sort_order)
  await Promise.all(changed.map(({ item, sort_order }) => updateMenuItem(item.id, { sort_order })))
}

// #menu photos - shrink then upload to the menu-photos bucket
export async function uploadMenuPhoto(itemId, file) {
  const blob = await preparePhoto(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${itemId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type })
  if (error) throw new Error('Could not upload the photo. Try again.')
  return path
}

// #menu photos - delete a photo. if it fails it's just a leftover file so we ignore it
export async function removeMenuPhoto(path) {
  if (path) await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
}

// storage path -> url for the <img>
export function menuPhotoUrl(path) {
  return path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null
}

// prices like $4.50
const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export const formatPrice = (price) => priceFormat.format(Number(price))

export const COMMON_ALLERGENS = ['milk', 'eggs', 'wheat', 'soy', 'peanuts', 'tree nuts', 'sesame', 'fish', 'shellfish'] // checkboxes in the editor
