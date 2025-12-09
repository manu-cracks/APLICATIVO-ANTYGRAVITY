import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Check, AlertTriangle } from 'lucide-react';

interface Notification {
    id: string;
    message: string;
    created_at: string;
    is_read: boolean;
    type?: 'system' | 'stock';
}

export const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

    useEffect(() => {
        fetchNotifications();
        fetchLowStock();

        // Subscribe to new notifications
        const subscription = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
                payload => {
                    setNotifications(prev => [payload.new as Notification, ...prev]);
                }
            )
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, []);

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setNotifications(data);
    };

    const fetchLowStock = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name, stock_quantity')
            .lt('stock_quantity', 5);
        if (data) setLowStockProducts(data);
    };

    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="mb-6 flex items-center gap-2">
                <Bell /> Notificaciones del Sistema
            </h2>

            <div className="flex flex-col gap-4">
                {/* Low Stock Alerts */}
                {lowStockProducts.map(p => (
                    <div key={`stock-${p.id}`} className="glass-panel flex justify-between items-start border-l-4 border-l-orange-500 bg-orange-500/10">
                        <div>
                            <p className="mb-1 font-bold text-orange-200 flex items-center gap-2">
                                <AlertTriangle size={16} /> Alerta de Stock Bajo
                            </p>
                            <p className="text-white">
                                El producto <strong>{p.name}</strong> tiene pocas existencias ({p.stock_quantity} restantes).
                            </p>
                            <span className="text-xs text-orange-400">Acción sugerida: Reabastecer pronto.</span>
                        </div>
                    </div>
                ))}

                {/* Regular Notifications */}
                {notifications.length === 0 && lowStockProducts.length === 0 ? (
                    <p className="text-center text-slate-500 py-10">No hay notificaciones</p>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className={`glass-panel flex justify-between items-start ${n.is_read ? 'opacity-50' : 'border-l-4 border-l-blue-500'}`}
                        >
                            <div>
                                <p className={`mb-1 ${n.is_read ? '' : 'font-semibold text-white'}`}>{n.message}</p>
                                <span className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</span>
                            </div>
                            {!n.is_read && (
                                <button
                                    onClick={() => markAsRead(n.id)}
                                    className="p-2 hover:bg-slate-700 rounded-full text-blue-400"
                                    title="Marcar como leída"
                                >
                                    <Check size={18} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
