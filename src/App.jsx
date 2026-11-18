// #app shell - all the screens/routes live here
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import PhoneFrame from './components/PhoneFrame.jsx'
import TabBar from './components/TabBar.jsx'
import OwnerBar from './components/OwnerBar.jsx'
import Home from './screens/Home.jsx'
import Calendar from './screens/Calendar.jsx'
import Location from './screens/Location.jsx'
import Menu from './screens/Menu.jsx'
import Passport from './screens/Passport.jsx'
import Import from './screens/Import.jsx'
import Owner from './screens/Owner.jsx'
import Install from './screens/Install.jsx'

// #tab bar - pages that get the bottom tabs. /owner and /install don't
// (location has no tab button but still shows the bar)
const TAB_ROUTES = ['/', '/calendar', '/menu', '/passport', '/location']

export default function App() {
  const { pathname } = useLocation() // current page
  const showTabs = TAB_ROUTES.includes(pathname)

  return (
    <PhoneFrame>
      {/* home gets screen--full-bleed so the photo goes edge to edge */}
      <main className={['screen', showTabs && 'screen--with-tabs', pathname === '/' && 'screen--full-bleed'].filter(Boolean).join(' ')}>
        {/* #owner bar - only actually shows up if an owner is logged in */}
        {showTabs && <OwnerBar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/location" element={<Location />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/passport" element={<Passport />} />
          <Route path="/import" element={<Import />} />
          <Route path="/owner" element={<Owner />} />
          <Route path="/install" element={<Install />} />
          {/* anything else just goes back home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showTabs && <TabBar />}
    </PhoneFrame>
  )
}
