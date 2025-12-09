
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Bell, MessageSquare, Zap } from 'lucide-react';
import { FloatingAIAssistant } from './FloatingAIAssistant';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="flex items-center gap-2 mb-8 px-4">
                    <div className="p-2 bg-blue-500 rounded-lg" style={{ background: 'var(--accent-primary)' }}>
                        <Zap size={24} color="white" />
                    </div>
                    <h1 className="text-xl font-bold m-0" style={{ fontSize: '1.5rem', marginBottom: 0 }}>Manu-shop</h1>
                </div>

                <nav>
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Panel de Control</span>
                    </NavLink>
                    <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShoppingCart size={20} />
                        <span>Ventas y POS</span>
                    </NavLink>
                    <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Package size={20} />
                        <span>Inventario</span>
                    </NavLink>
                    <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Bell size={20} />
                        <span>Notificaciones</span>
                    </NavLink>
                    <NavLink to="/ai-assistant" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <MessageSquare size={20} />
                        <span>Asistente IA</span>
                    </NavLink>
                </nav>
            </aside>

            <main className="main-content">
                {children}
            </main>
            <FloatingAIAssistant />
        </div>
    );
};
