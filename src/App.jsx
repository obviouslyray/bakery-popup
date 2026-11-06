import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import PhoneFrame from './components/PhoneFrame.jsx'
import TabBar from './components/TabBar.jsx'
import Home from './screens/Home.jsx'
import Calendar from './screens/Calendar.jsx'
import Location from './screens/Location.jsx'
import Menu from './screens/Menu.jsx'
import Passport from './screens/Passport.jsx'
import Import from './screens/Import.jsx'
import Owner from './screens/Owner.jsx'
import Install from './screens/Install.jsx'

// Routes that show the bottom tab bar. /owner and /install stand on their own.
// /location has no tab of its own but keeps the tab bar.
const TAB_ROUTES = ['/', '/calendar', '/menu', '/passport', '/location']

export default function App() {
  const { pathname } = useLocation()
  const showTabs = TAB_ROUTES.includes(pathname)

  return (
    <PhoneFrame>
      <main className={showTabs ? 'screen screen--with-tabs' : 'screen'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/location" element={<Location />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/passport" element={<Passport />} />
          <Route path="/import" element={<Import />} />
          <Route path="/owner" element={<Owner />} />
          <Route path="/install" element={<Install />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showTabs && <TabBar />}
    </PhoneFrame>
  )
}
