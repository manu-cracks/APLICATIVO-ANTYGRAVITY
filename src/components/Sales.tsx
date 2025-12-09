
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
}

interface CartItem extends Product {
    cartQuantity: number;
}

export const Sales: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').gt('stock_quantity', 0);
        if (data) setProducts(data);
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cartQuantity >= product.stock_quantity) return prev;
                return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
            }
            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.cartQuantity + delta);
                const product = products.find(p => p.id === id);
                if (product && newQty > product.stock_quantity) return item;
                return { ...item, cartQuantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);

        try {
            // 1. Create Sale
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([{ total_amount: total }])
                .select()
                .single();

            if (saleError) throw saleError;

            // 2. Create Sale Items and Update Stock
            for (const item of cart) {
                await supabase.from('sale_items').insert({
                    sale_id: saleData.id,
                    product_id: item.id,
                    quantity: item.cartQuantity,
                    unit_price: item.price
                });

                // Optimistically update stock (Trigger handles warnings)
                const currentStock = products.find(p => p.id === item.id)?.stock_quantity || 0;
                await supabase.from('products')
                    .update({ stock_quantity: currentStock - item.cartQuantity })
                    .eq('id', item.id);
            }

            setCart([]);
            fetchProducts(); // Refresh stock
            setCart([]);
            fetchProducts(); // Refresh stock
            alert('¡Venta completada exitosamente!');
        } catch (err) {
            console.error(err);
            alert('Error al procesar la venta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div className="glass-panel">
                <h2 className="mb-4">Productos Disponibles</h2>
                <div className="grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {products.map(p => (
                        <div key={p.id} className="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer" onClick={() => addToCart(p)}>
                            <div className="font-bold mb-1">{p.name}</div>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-400 font-mono">${p.price}</span>
                                <span className="text-xs text-slate-400">Existencias: {p.stock_quantity}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel flex flex-col h-[calc(100vh-4rem)] sticky top-4">
                <h2 className="mb-4 flex items-center gap-2">
                    <ShoppingCart /> Venta Actual
                </h2>

                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {cart.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">El carrito está vacío</div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2 bg-slate-800 rounded">
                                <div>
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <div className="text-xs text-slate-400">${item.price} x {item.cartQuantity}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-700 rounded"><Minus size={14} /></button>
                                    <span className="text-sm w-4 text-center">{item.cartQuantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-700 rounded"><Plus size={14} /></button>
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-400 hover:bg-slate-700 rounded ml-1"><X size={14} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="border-t border-slate-700 pt-4 mt-auto">
                    <div className="flex justify-between text-xl font-bold mb-4">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <button
                        className="btn btn-primary w-full py-3"
                        onClick={handleCheckout}
                        disabled={loading || cart.length === 0}
                    >
                        {loading ? 'Procesando...' : 'Completar Venta'}
                    </button>
                </div>
            </div>
        </div>
    );
};
