
import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import MapPage from './pages/MapPage'
import ChartsPage from './pages/ChartsPage'
import AboutPage from './pages/AboutPage'
import MapAirliners from './pages/MapAirliners'
import Designer from './pages/SimDesigner'
import SimRunner from "./pages/SimRunner";

function Nav() {
  const link = ({ isActive }:{isActive:boolean}) => ({ className: isActive ? 'active' : undefined })
  return (
    <header>
      <strong>MS&A Demo</strong>
      <NavLink to='/map' {...link}>Map</NavLink>
      <NavLink to="/map/airliners">Airliners (synthetic)</NavLink>
      <NavLink to='/sims' {...link}>Simulation</NavLink>
      <NavLink to='/designer' {...link}>Designer</NavLink>
      <NavLink to='/charts' {...link}>Charts</NavLink>
      <NavLink to='/about' {...link}>About</NavLink>
      <span className='badge'>React + Cesium + DevExtreme</span>
    </header>
  )
}

export default function App() {
  return (
    <>
      <Nav/>
      <main>
        <Routes>
          <Route path='/' element={<Navigate to='/map' replace/>} />
          <Route path='/map' element={<MapPage/>} />
          <Route path='/charts' element={<ChartsPage/>} />
          <Route path='/about' element={<AboutPage/>} />
	        <Route path="/map/airliners" element={<MapAirliners />} />
          <Route path='/designer' element={<Designer/>} />
          <Route path="/sims" element={<SimRunner />} />
        </Routes>
      </main>
    </>
  )
}
