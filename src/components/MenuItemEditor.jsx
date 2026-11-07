import { useEffect, useState } from 'react'
import {
  BEVERAGE_SECTIONS, COMMON_ALLERGENS, deleteMenuItem, insertMenuItem, menuPhotoUrl, removeMenuPhoto, updateMenuItem,
  uploadMenuPhoto,
} from '../lib/menu.js'
import './MenuItemEditor.css'

// Owner sheet for adding or editing one menu item. `item` is null when adding.
export default function MenuItemEditor({ item, defaultCategory, nextSortOrder, onClose, onSaved }) {
  const isNew = !item
  const [form, setForm] = useState(() => ({
    name: item?.name ?? '',
    category: item?.category ?? defaultCategory,
    // New beverages start in Coffees; '' means no section (hidden from customers).
    section: item ? (item.section ?? '') : 'coffees',
    price: item ? String(Number(item.price).toFixed(2)) : '',
    description: item?.description ?? '',
    ingredients: item?.ingredients ?? '',
    allergens: (item?.allergens ?? []).filter((a) => COMMON_ALLERGENS.includes(a)),
    otherAllergens: (item?.allergens ?? []).filter((a) => !COMMON_ALLERGENS.includes(a)).join(', '),
    onToday: item?.on_today ?? true,
    soldOut: item?.sold_out ?? false,
  }))
  const [photo, setPhoto] = useState({ file: null, preview: menuPhotoUrl(item?.photo_path), removed: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const toggleAllergen = (name) => setForm({
    ...form,
    allergens: form.allergens.includes(name) ? form.allergens.filter((a) => a !== name) : [...form.allergens, name],
  })

  // Free the preview of a newly picked photo when it is replaced or the sheet closes.
  useEffect(() => () => { if (photo.file) URL.revokeObjectURL(photo.preview) }, [photo])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) setPhoto({ file, preview: URL.createObjectURL(file), removed: false })
    e.target.value = ''
  }

  const onSave = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const price = Number(form.price.replace('$', '').trim())
    if (!name) return setError('Add a name.')
    if (form.price.trim() === '' || !Number.isFinite(price) || price < 0 || price > 9999.99) {
      return setError('Enter a price, like 4.50.')
    }

    setBusy(true)
    setError(null)
    const id = item?.id ?? crypto.randomUUID()
    let uploadedPath = null
    try {
      let photoPath = item?.photo_path ?? null
      if (photo.file) photoPath = uploadedPath = await uploadMenuPhoto(id, photo.file)
      else if (photo.removed) photoPath = null

      const other = form.otherAllergens.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean)
      const row = {
        name,
        category: form.category,
        section: form.category === 'coffee' && form.section ? form.section : null,
        price: Math.round(price * 100) / 100,
        description: form.description.trim() || null,
        ingredients: form.ingredients.trim() || null,
        allergens: [...new Set([...form.allergens, ...other])],
        photo_path: photoPath,
        on_today: form.onToday,
        sold_out: form.soldOut,
      }
      if (isNew) await insertMenuItem({ id, ...row, sort_order: nextSortOrder })
      else await updateMenuItem(id, row)

      if (item?.photo_path && item.photo_path !== photoPath) await removeMenuPhoto(item.photo_path)
      onSaved()
    } catch (err) {
      if (uploadedPath) await removeMenuPhoto(uploadedPath)
      setError(err.message)
      setBusy(false)
    }
  }

  const onDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteMenuItem(item)
      onSaved()
    } catch (err) {
      setError(err.message)
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="editor" onClick={() => !busy && onClose()}>
      <form className="editor__sheet" role="dialog" aria-modal="true" aria-labelledby="editor-title"
        onClick={(e) => e.stopPropagation()} onSubmit={onSave} noValidate>
        <h2 id="editor-title" className="editor__title">{isNew ? 'Add a menu item' : 'Edit menu item'}</h2>

        <label className="editor__field">
          Name
          <input value={form.name} onChange={set('name')} required maxLength={80} autoFocus={isNew} />
        </label>

        <div className="editor__field">
          <span>Category</span>
          <div className="editor__segmented" role="group" aria-label="Category">
            {['bakery', 'coffee'].map((c) => (
              <button key={c} type="button" aria-pressed={form.category === c}
                onClick={() => setForm({ ...form, category: c })}>
                {c === 'bakery' ? 'Bakery' : 'Beverages'}
              </button>
            ))}
          </div>
        </div>

        {form.category === 'coffee' && (
          <label className="editor__field">
            Section
            <select value={form.section} onChange={set('section')}>
              {BEVERAGE_SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
              <option value="">None (hidden from customers)</option>
            </select>
            {form.section === 'milk-options' && (
              <span className="editor__hint">Shown as an add-on price, like +$0.75.</span>
            )}
          </label>
        )}

        <label className="editor__field">
          Price
          <span className="editor__price">
            <span aria-hidden="true">$</span>
            <input value={form.price} onChange={set('price')} inputMode="decimal" placeholder="4.50" required />
          </span>
        </label>

        <label className="editor__field">
          Description
          <textarea value={form.description} onChange={set('description')} rows={2} maxLength={200} />
        </label>

        <label className="editor__field">
          Ingredients
          <textarea value={form.ingredients} onChange={set('ingredients')} rows={2} maxLength={300}
            placeholder="flour, butter, sugar" />
        </label>

        <div className="editor__field">
          <span>Allergens</span>
          <div className="editor__chips">
            {COMMON_ALLERGENS.map((a) => (
              <button key={a} type="button" className="editor__chip" aria-pressed={form.allergens.includes(a)}
                onClick={() => toggleAllergen(a)}>
                {a}
              </button>
            ))}
          </div>
          <input value={form.otherAllergens} onChange={set('otherAllergens')} placeholder="Other, separated by commas"
            aria-label="Other allergens" />
        </div>

        <div className="editor__field">
          <span>Photo</span>
          <div className="editor__photo">
            {photo.preview && !photo.removed
              ? <img src={photo.preview} alt="" width="72" height="72" />
              : <span className="editor__photo-empty">No photo</span>}
            <label className="editor__small-button">
              {photo.preview && !photo.removed ? 'Replace' : 'Add photo'}
              <input type="file" accept="image/*" onChange={pickPhoto} hidden />
            </label>
            {photo.preview && !photo.removed && (
              <button type="button" className="editor__small-button editor__small-button--plain"
                onClick={() => setPhoto({ file: null, preview: null, removed: true })}>
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="editor__switches">
          <label className="editor__switch">
            <input type="checkbox" checked={form.onToday} onChange={(e) => setForm({ ...form, onToday: e.target.checked })} />
            On today's menu
          </label>
          <label className="editor__switch">
            <input type="checkbox" checked={form.soldOut} onChange={(e) => setForm({ ...form, soldOut: e.target.checked })} />
            Sold out
          </label>
        </div>

        {error && <p className="editor__error" role="alert">{error}</p>}

        {confirmDelete ? (
          <div className="editor__confirm">
            <p>Delete {item.name}? This can't be undone.</p>
            <div className="editor__actions">
              <button type="button" className="editor__button editor__button--danger" onClick={onDelete} disabled={busy}>
                {busy ? 'Deleting...' : 'Delete'}
              </button>
              <button type="button" className="editor__button editor__button--plain"
                onClick={() => setConfirmDelete(false)} disabled={busy}>
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="editor__actions">
              <button type="submit" className="editor__button" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
              <button type="button" className="editor__button editor__button--plain" onClick={onClose} disabled={busy}>
                Cancel
              </button>
            </div>
            {!isNew && (
              <button type="button" className="editor__delete" onClick={() => setConfirmDelete(true)} disabled={busy}>
                Delete item
              </button>
            )}
          </>
        )}
      </form>
    </div>
  )
}
