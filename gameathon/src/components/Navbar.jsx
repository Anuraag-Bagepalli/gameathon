import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Moon, Sun, X } from 'lucide-react';

import logoImg from '../assets/logo.png';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('gameathon-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('gameathon-theme', theme); }, [theme]);
  const links = [['/', 'Home'], ['/about', 'Intel'], ['/gallery', 'Arena'], ['/contact', 'Contact']];
  return (
    <nav className="navbar">
      <div className="container nav-content">
        <NavLink to="/" className="logo" onClick={() => setOpen(false)}>
          <img src={logoImg} alt="logo" style={{ height: 36, width: 'auto', marginRight: 4 }} />
          <span>GAME<span>ATHON</span></span><small>8.0</small>
        </NavLink>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
        <div className={`nav-links ${open ? 'open' : ''}`}>
          {links.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({isActive}) => isActive ? 'active' : ''}>{label}</NavLink>)}
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
          <NavLink to="/register" onClick={() => setOpen(false)} className="btn btn-primary nav-cta">Register</NavLink>
        </div>
      </div>
    </nav>
  );
}
