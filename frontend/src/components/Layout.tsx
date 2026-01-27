import { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <header className="header">
        <Link to="/" className="header-logo">AUTOTRAQ</Link>
        <nav className="header-nav">
          <NavLink to="/parts">Parts</NavLink>
          <NavLink to="/inventory">Inventory</NavLink>
          <NavLink to="/requests">Requests</NavLink>
        </nav>
        <div className="header-user">
          <span>{user?.name} ({user?.role})</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
