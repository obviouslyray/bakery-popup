import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { fetchMenu, formatPrice, menuPhotoUrl } from '../lib/menu.js'
import './Menu.css'

const SECTIONS = [
  { category: 'bakery', title: 'Bakery' },
  { category: 'coffee', title: 'Coffee' },
]

function MenuItem({ item }) {
  const photo = menuPhotoUrl(item.photo_path)
  const classes = ['menu-item', item.sold_out && 'menu-item--sold-out', !item.on_today && 'menu-item--off-today']
  return (
    <li className={classes.filter(Boolean).join(' ')}>
      {photo && <img className="menu-item__photo" src={photo} alt="" width="64" height="64" loading="lazy" />}
      <div className="menu-item__body">
        <div className="menu-item__top">
          <h3 className="menu-item__name">{item.name}</h3>
          <span className="menu-item__price">{formatPrice(item.price)}</span>
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
    </li>
  )
}

export default function Menu() {
  const { ready, session } = useAuth()
  const [state, setState] = useState({ status: 'loading', items: [] })

  // Reload when an owner signs in or out: owners also see items that are off today.
  useEffect(() => {
    if (!ready) return
    let cancelled = false
    fetchMenu()
      .then((items) => !cancelled && setState({ status: 'ready', items }))
      .catch(() => !cancelled && setState({ status: 'error', items: [] }))
    return () => { cancelled = true }
  }, [ready, session])

  return (
    <section className="menu">
      <h1>Menu</h1>

      {state.status === 'loading' && <p className="placeholder">Loading the menu...</p>}
      {state.status === 'error' && <p className="placeholder">The menu is not available right now. Please try again soon.</p>}
      {state.status === 'ready' && state.items.length === 0 && (
        <p className="placeholder">Today's menu is coming soon.</p>
      )}

      {state.status === 'ready' && SECTIONS.map(({ category, title }) => {
        const items = state.items.filter((item) => item.category === category)
        if (items.length === 0) return null
        return (
          <div key={category} className="menu__section">
            <h2 className="menu__section-title">{title}</h2>
            <ul className="menu__list">
              {items.map((item) => <MenuItem key={item.id} item={item} />)}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
