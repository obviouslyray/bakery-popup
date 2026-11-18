// #menu section - menu tab
import { useCallback, useEffect, useState } from 'react'
import MenuItemEditor from '../components/MenuItemEditor.jsx'
import { useAuth } from '../lib/auth.jsx'
import {
  BEVERAGE_SECTIONS, deleteMenuItem, fetchMenu, formatPrice, menuPhotoUrl, saveOrder, updateMenuItem, watchMenu,
} from '../lib/menu.js'
import './Menu.css'

// #menu section - the two folder tabs. beverages is category 'coffee' in the database
const SECTIONS = [
  { category: 'bakery', title: 'Bakery' },
  { category: 'coffee', title: 'Beverages' },
]

// milk options show "+$" since they're add ons
const isAddOn = (item) => BEVERAGE_SECTIONS.find((s) => s.key === item.section)?.addOn

// up/down arrow icon for reordering
const Arrow = ({ up }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d={up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
  </svg>
)

// owner buttons under each item (sold out, on today, move, edit)
function OwnerControls({ item, isFirst, isLast, busy, onToggle, onEdit, onMove }) {
  return (
    <div className="menu-owner">
      {/* #sold out - toggles sold_out on/off */}
      <button type="button" className="menu-owner__toggle" aria-pressed={item.sold_out} disabled={busy}
        onClick={() => onToggle(item, { sold_out: !item.sold_out })}>
        Sold out
      </button>
      {/* #menu visibility - toggles on_today. off = customers can't see it */}
      <button type="button" className="menu-owner__toggle" aria-pressed={item.on_today} disabled={busy}
        onClick={() => onToggle(item, { on_today: !item.on_today })}>
        On today
      </button>
      {/* pushes the arrows + edit to the right */}
      <span className="menu-owner__spacer" />
      {/* move up/down in the list */}
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

// #menu section - one item on the menu. owner is null for customers so they don't get buttons
function MenuItem({ item, owner }) {
  const [confirming, setConfirming] = useState(false) // #menu delete - showing the "are you sure"?
  const photo = menuPhotoUrl(item.photo_path) // #menu photos
  const classes = ['menu-item', item.sold_out && 'menu-item--sold-out', !item.on_today && 'menu-item--off-today'] // faded styles for sold out / hidden items
  return (
    <li className={classes.filter(Boolean).join(' ')}>
      {/* #menu delete - small red x in the corner, only owners see it */}
      {owner && (
        <button type="button" className="menu-item__delete" aria-label={`Delete ${item.name}`}
          disabled={owner.busy || confirming} onClick={() => setConfirming(true)}>
          <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor"
            strokeWidth="3.5" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      )}
      <div className="menu-item__main">
        {/* #menu photos - small thumbnail if it has one */}
        {photo && <img className="menu-item__photo" src={photo} alt="" width="64" height="64" loading="lazy" />}
        <div className="menu-item__body">
          <div className="menu-item__top">
            <h3 className="menu-item__name">{item.name}</h3>
            {/* add ons get a + in front */}
            <span className="menu-item__price">{isAddOn(item) ? '+' : ''}{formatPrice(item.price)}</span>
          </div>
          {/* #sold out / #menu visibility - little labels */}
          {(item.sold_out || !item.on_today) && (
            <div className="menu-item__labels">
              {item.sold_out && <span className="menu-item__label">Sold out</span>}
              {!item.on_today && <span className="menu-item__label menu-item__label--owner">Not on today's menu</span>}
            </div>
          )}
          {item.description && <p className="menu-item__description">{item.description}</p>}
          {item.ingredients && <p className="menu-item__detail">{item.ingredients}</p>}
          {/* allergens list */}
          {item.allergens.length > 0 && (
            <p className="menu-item__detail menu-item__allergens">Contains: {item.allergens.join(', ')}</p>
          )}
        </div>
      </div>
      {/* #menu delete - after tapping the x it asks first, otherwise show the normal owner buttons */}
      {owner && (confirming ? (
        <div className="menu-owner menu-owner--confirm">
          <p className="menu-owner__confirm-text">Delete {item.name}? This can't be undone.</p>
          <button type="button" className="menu-owner__delete-yes" disabled={owner.busy}
            onClick={() => owner.onDelete(item)}>Delete</button>
          <button type="button" className="menu-owner__toggle" disabled={owner.busy}
            onClick={() => setConfirming(false)}>Keep</button>
        </div>
      ) : <OwnerControls item={item} {...owner} />)}
    </li>
  )
}

export default function Menu() {
  const { ready, session, isOwner } = useAuth() // session changes when someone logs in/out
  const [state, setState] = useState({ status: 'loading', items: [] }) // loading/ready/error + the items
  const [editing, setEditing] = useState(null) // null | { item } | { category } // which item the edit popup is open for
  const [busy, setBusy] = useState(false) // true while saving
  const [error, setError] = useState(null)
  const [folder, setFolder] = useState('bakery') // which folder tab is open

  // reload after an owner changes something. if it fails (bad signal at the truck)
  // just keep showing what's already on screen
  const load = useCallback(async () => {
    try {
      setState({ status: 'ready', items: await fetchMenu() })
    } catch {
      setState((prev) => (prev.status === 'ready' ? prev : { status: 'error', items: [] }))
    }
  }, [])

  // #menu visibility - reload when an owner logs in or out, owners also see the items that are off today
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    // cancelled stops it from updating after we've left the page
    fetchMenu()
      .then((items) => !cancelled && setState({ status: 'ready', items }))
      .catch(() => !cancelled && setState({ status: 'error', items: [] }))
    return () => { cancelled = true }
  }, [ready, session])

  // realtime - keeps the menu up to date when owners change stuff
  useEffect(() => (ready ? watchMenu(load) : undefined), [ready, load])

  // wrapper for owner actions: busy on, do it, show any error, reload
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

  const onToggle = (item, patch) => run(() => updateMenuItem(item.id, patch)) // #sold out / #menu visibility
  const onDelete = (item) => run(() => deleteMenuItem(item)) // #menu delete

  // move an item up/down, only within its own group (same folder + same section for drinks)
  const onMove = (item, step) => run(() => {
    const list = state.items.filter((i) => i.category === item.category && (i.section ?? null) === (item.section ?? null))
    const from = list.findIndex((i) => i.id === item.id)
    const reordered = [...list]
    reordered.splice(from + step, 0, ...reordered.splice(from, 1)) // pull it out and put it back one spot over
    return saveOrder(reordered)
  })

  const closeEditor = useCallback(() => setEditing(null), [])
  const onSaved = useCallback(() => { setEditing(null); load() }, [load])

  // new items go to the bottom of the list
  const nextSortOrder = (category) =>
    Math.max(0, ...state.items.filter((i) => i.category === category).map((i) => i.sort_order)) + 10

  // "+ Add" button, owners only
  const addButton = (category, label) => isOwner && (
    <button type="button" className="menu__add" onClick={() => setEditing({ category })}>
      + {label}
    </button>
  )

  // arrow keys switch folder tabs (for keyboard users)
  const onTabKey = (e) => {
    const i = SECTIONS.findIndex((s) => s.category === folder)
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: SECTIONS.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = SECTIONS[(next + SECTIONS.length) % SECTIONS.length].category // wraps around at the ends
    setFolder(target)
    document.getElementById(`folder-tab-${target}`)?.focus()
  }

  const folderItems = state.items.filter((item) => item.category === folder) // items in the open folder

  // builds the list of items
  const itemList = (items) => (
    <ul className="menu__list">
      {items.map((item, i) => (
        <MenuItem key={item.id} item={item} owner={isOwner ? {
          isFirst: i === 0, isLast: i === items.length - 1, busy, onToggle, onEdit: (it) => setEditing({ item: it }), onMove, onDelete,
        } : null} />
      ))}
    </ul>
  )

  // #menu visibility - beverages folder. all 4 section headers always show, with items or "coming soon"
  // drinks with no section are hidden from customers
  const beverageSections = () => {
    const groups = BEVERAGE_SECTIONS.map((s) => ({ ...s, items: folderItems.filter((i) => i.section === s.key) }))
    const unsectioned = folderItems.filter((i) => !BEVERAGE_SECTIONS.some((s) => s.key === i.section)) // no section
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
        {/* owners see the hidden ones so they can fix them */}
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

      {/* error from saving/deleting */}
      {error && <p className="menu__error" role="alert">{error}</p>}

      <div className="folders">
        {/* #menu section - folder tabs */}
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

        {/* key={folder} makes it redo the fade in animation when you switch folders */}
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

      {/* #menu editor - add/edit popup */}
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
