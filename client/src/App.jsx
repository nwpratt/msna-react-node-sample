import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Simulations from './pages/Simulations.jsx'
import About from './pages/About.jsx'
import './app.css'

export default function App() {
  return (
    <div className="container">
      <nav className="nav">
        <div className="brand">MS&A Logistics Demo</div>
        <div className="links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/simulations">Simulations</NavLink>
          <NavLink to="/about">About</NavLink>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulations" element={<Simulations />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>React + DevExtreme (charts) + Express • Sample app for portfolio</span>
      </footer>
    </div>
  )
}
