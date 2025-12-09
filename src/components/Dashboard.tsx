
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({ daily: 0, monthly: 0, yearly: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

            // In a real app, use aggregation queries. Here we fetch and sum for simplicity or use RPC.
            // For demo, I'll fetch sales and calculate client-side or assume RPC
            // Fetching all sales might be heavy, but fine for MVP

            const { data, error } = await supabase.from('sales').select('total_amount, sale_date');

            if (error) throw error;

            if (data) {
                let d = 0, m = 0, y = 0;
                data.forEach(sale => {
                    const date = sale.sale_date.split('T')[0];
                    const amount = Number(sale.total_amount);

                    if (date === today) d += amount;
                    if (sale.sale_date >= startOfMonth) m += amount;
                    if (sale.sale_date >= startOfYear) y += amount;
                });
                setStats({ daily: d, monthly: m, yearly: y });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const data = [
        { name: 'Jan', sales: 4000 },
        { name: 'Feb', sales: 3000 },
        { name: 'Mar', sales: 2000 },
        { name: 'Apr', sales: 2780 },
        { name: 'May', sales: 1890 },
        { name: 'Jun', sales: stats.monthly }, // Live data point
    ];

    return (
        <div>
            <h2 className="mb-8">Panel de Control</h2>

            <div className="grid-cols-3 mb-8">
                <div className="glass-panel flex-col gap-2">
                    <div className="flex justify-between items-center text-secondary">
                        <span>Ventas Diarias</span>
                        <DollarSign size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">${stats.daily.toFixed(2)}</div>
                    <div className="text-sm text-green-400 flex items-center gap-1">
                        <TrendingUp size={14} /> +12% desde ayer
                    </div>
                </div>

                <div className="glass-panel flex-col gap-2">
                    <div className="flex justify-between items-center text-secondary">
                        <span>Ventas Mensuales</span>
                        <Calendar size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">${stats.monthly.toFixed(2)}</div>
                </div>

                <div className="glass-panel flex-col gap-2">
                    <div className="flex justify-between items-center text-secondary">
                        <span>Ventas Anuales</span>
                        <TrendingUp size={20} />
                    </div>
                    <div className="text-3xl font-bold text-white">${stats.yearly.toFixed(2)}</div>
                </div>
            </div>

            <div className="glass-panel" style={{ height: '400px' }}>
                <h3 className="mb-4">Resumen de Ingresos</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip
                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#f8fafc' }}
                        />
                        <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
