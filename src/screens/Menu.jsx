import { useCallback, useEffect, useState } from 'react'
import MenuItemEditor from '../components/MenuItemEditor.jsx'
import { useAuth } from '../lib/auth.jsx'
import { BEVERAGE_SECTIONS, fetchMenu, formatPrice, menuPhotoUrl, saveOrder, updateMenuItem, watchMenu } from '../lib/menu.js'
import './Menu.css'

// Folder tabs. The Beverages folder holds category 'coffee' in the database.
const SECTIONS = [
  { category: 'bakery', title: 'Bakery' },
  { category: 'coffee', title: 'Beverages' },
]

const isAddOn = (item) => BEVERAGE_SECTIONS.find((s) => s.key === item.section)?.addOn

const Arrow = ({ up }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
  </svg>
)

// Owner-only controls under an item: quick switches, edit, and move up/down.
function OwnerControls({ item, isFirst, isLast, busy, onToggle, onEdit, onMove }) {
  return (
    <div className="menu-owner">
      <button type="button" className="menu-owner__toggle" aria-pressed={item.sold_out} disabled={busy}
        onClick={() => onToggle(item, { sold_out: !item.sold_out })}>
        Sold out
      </button>
      <button type="button" className="menu-owner__toggle" aria-pressed={item.on_today} disabled={busy}
        onClick={() => onToggle(item, { on_today: !item.on_today })}>
        On today
      </button>
      <span className="menu-owner__spacer" />
      <button type="button" className="menu-owner__icon" aria-label={`Move ${item.name} up`}
        disabled={busy || isFirst} onClick={() => onMove(item, -1)}>
        <Arrow up />
      </button>
      <button type="button" className="menu-owner__icon" aria-label={`Move ${item.name} down`}
        disabled={busy || isLast} onClick={() => onMove(item, 1)}>
        <Arrow />
      </button>
      <button type="button" className="menu-owner__edit" disabled={busy} onClick={() => onEdit(item)}>Edit</button>
    </div>
  )
}

function MenuItem({ item, children }) {
  const photo = menuPhotoUrl(item.photo_path)
  const classes = ['menu-item', item.sold_out && 'menu-item--sold-out', !item.on_today && 'menu-item--off-today']
  return (
    <li className={classes.filter(Boolean).join(' ')}>
      <div className="menu-item__main">
        {photo && <img className="menu-item__photo" src={photo} alt="" width="64" height="64" loading="lazy" />}
        <div className="menu-item__body">
          <div className="menu-item__top">
            <h3 className="menu-item__name">{item.name}</h3>
            <span className="menu-item__price">{isAddOn(item) ? '+' : ''}{formatPrice(item.price)}</span>
          </div>
          {(item.sold_out || !item.on_today) && (
            <div className="menu-item__labels">
              {item.sold_out && <span className="menu-item__label">Sold out</span>}
              {!item.on_today && <span className="menu-item__label menu-item__label--owner">Not on today's menu</span>}
            </div>
          )}
          {item.description && <p className="menu-item__description">{item.description}</p>}
          {item.ingredients && <p className="menu-item__detail">{item.ingredients}</p>}
          {item.allergens.length > 0 && (
            <p className="menu-item__detail menu-item__allergens">Contains: {item.allergens.join(', ')}</p>
          )}
        </div>
      </div>
      {children}
    </li>
  )
}

export default function Menu() {
  const { ready, session, isOwner } = useAuth()
  const [state, setState] = useState({ status: 'loading', items: [] })
  const [editing, setEditing] = useState(null) // null | { item } | { category }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [folder, setFolder] = useState('bakery')

  // Reload after an owner change. If the reload fails (say, a weak signal at the
  // truck), keep showing the list already on screen.
  const load = useCallback(async () => {
    try {
      setState({ status: 'ready', items: await fetchMenu() })
    } catch {
      setState((prev) => (prev.status === 'ready' ? prev : { status: 'error', items: [] }))
    }
  }, [])

  // Reload when an owner signs in or out: owners also see items that are off today.
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    fetchMenu()
      .then((items) => !cancelled && setState({ status: 'ready', items }))
      .catch(() => !cancelled && setState({ status: 'error', items: [] }))
    return () => { cancelled = true }
  }, [ready, session])

  // Keep the open menu current as owners make changes.
  useEffect(() => (ready ? watchMenu(load) : undefined), [ready, load])

  const run = async (action) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    }
    await load()
    setBusy(false)
  }

  const onToggle = (item, patch) => run(() => updateMenuItem(item.id, patch))

  // Up/down moves an item within its own group (same folder and, for beverages, same section).
  const onMove = (item, step) => run(() => {
    const list = state.items.filter((i) => i.category === item.category && (i.section ?? null) === (item.section ?? null))
    const from = list.findIndex((i) => i.id === item.id)
    const reordered = [...list]
    reordered.splice(from + step, 0, ...reordered.splice(from, 1))
    return saveOrder(reordered)
  })

  const closeEditor = useCallback(() => setEditing(null), [])
  const onSaved = useCallback(() => { setEditing(null); load() }, [load])

  const nextSortOrder = (category) =>
    Math.max(0, ...state.items.filter((i) => i.category === category).map((i) => i.sort_order)) + 10

  const addButton = (category, label) => isOwner && (
    <button type="button" className="menu__add" onClick={() => setEditing({ category })}>
      + {label}
    </button>
  )

  // Folder tabs: arrow keys move between them, like any tab list.
  const onTabKey = (e) => {
    const i = SECTIONS.findIndex((s) => s.category === folder)
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: SECTIONS.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = SECTIONS[(next + SECTIONS.length) % SECTIONS.length].category
    setFolder(target)
    document.getElementById(`folder-tab-${target}`)?.focus()
  }

  const folderItems = state.items.filter((item) => item.category === folder)

  const itemList = (items) => (
    <ul className="menu__list">
      {items.map((item, i) => (
        <MenuItem key={item.id} item={item}>
          {isOwner && (
            <OwnerControls item={item} isFirst={i === 0} isLast={i === items.length - 1} busy={busy}
              onToggle={onToggle} onEdit={(it) => setEditing({ item: it })} onMove={onMove} />
          )}
        </MenuItem>
      ))}
    </ul>
  )

  // Beverages folder: all four section headers always show, each with its items
  // or a short "coming soon" line. Items with no section are hidden from customers.
  const beverageSections = () => {
    const groups = BEVERAGE_SECTIONS.map((s) => ({ ...s, items: folderItems.filter((i) => i.section === s.key) }))
    const unsectioned = folderItems.filter((i) => !BEVERAGE_SECTIONS.some((s) => s.key === i.section))
    return (
      <>
        {groups.map((g) => (
          <section key={g.key} className="menu-group" aria-labelledby={`menu-group-${g.key}`}>
            <h2 id={`menu-group-${g.key}`} className="menu-group__title">{g.title}</h2>
            {g.items.length > 0
              ? itemList(g.items)
              : <p className="menu-group__empty">{g.emptyText ?? 'Coming soon.'}</p>}
          </section>
        ))}
        {isOwner && unsectioned.length > 0 && (
          <section className="menu-group menu-group--hidden" aria-labelledby="menu-group-none">
            <h2 id="menu-group-none" className="menu-group__title">Not in a section</h2>
            <p className="menu-group__empty">Hidden from customers. Edit an item to choose a section.</p>
            {itemList(unsectioned)}
          </section>
        )}
      </>
    )
  }

  return (
    <section className="menu">
      <h1>Menu</h1>

      {error && <p className="menu__error" role="alert">{error}</p>}

      <div className="folders">
        <div className="folders__tabs" role="tablist" aria-label="Menu sections">
          {SECTIONS.map(({ category, title }) => {
            const selected = category === folder
            return (
              <button key={category} id={`folder-tab-${category}`} type="button" role="tab"
                className={`folder-tab ${selected ? 'folder-tab--selected' : ''}`}
                aria-selected={selected} aria-controls="folder-panel" tabIndex={selected ? 0 : -1}
                onClick={() => setFolder(category)} onKeyDown={onTabKey}>
                {title}
              </button>
            )
          })}
        </div>

        {/* key restarts the fade-in each time a folder comes to the front */}
        <div key={folder} id="folder-panel" className="folders__panel" role="tabpanel"
          aria-labelledby={`folder-tab-${folder}`}>
          {state.status === 'loading' && <p className="placeholder">Loading the menu...</p>}
          {state.status === 'error' && (
            <p className="placeholder">The menu is not available right now. Please try again soon.</p>
          )}
          {state.status === 'ready' && folder === 'coffee' && beverageSections()}
          {state.status === 'ready' && folder === 'bakery' && (folderItems.length > 0
            ? itemList(folderItems)
            : <p className="placeholder folders__empty">{isOwner ? 'No bakery items yet.' : 'Bakery items coming soon.'}</p>
          )}
          {state.status === 'ready' && addButton(folder, `Add ${folder === 'coffee' ? 'a beverage' : 'a bakery item'}`)}
        </div>
      </div>

      {editing && (
        <MenuItemEditor
          item={editing.item ?? null}
          defaultCategory={editing.item?.category ?? editing.category}
          nextSortOrder={nextSortOrder(editing.item?.category ?? editing.category)}
          onClose={closeEditor}
          onSaved={onSaved}
        />
      )}
    </section>
  )
}
