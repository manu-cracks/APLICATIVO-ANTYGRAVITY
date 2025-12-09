import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit, AlertTriangle, X } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock_quantity: number;
    image_url: string;
}

export const Inventory: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', category: '', price: '', stock_quantity: '', image_url: '' });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (!error && data) setProducts(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const productData = {
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity),
            image_url: formData.image_url
        };

        let error;

        if (editingId) {
            // Update existing product
            const { error: updateError } = await supabase
                .from('products')
                .update(productData)
                .eq('id', editingId);
            error = updateError;
        } else {
            // Insert new product
            const { error: insertError } = await supabase
                .from('products')
                .insert([productData]);
            error = insertError;
        }

        if (!error) {
            resetForm();
            fetchProducts();
        }
    };

    const handleEdit = (product: Product) => {
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            stock_quantity: product.stock_quantity.toString(),
            image_url: product.image_url || ''
        });
        setEditingId(product.id);
        setIsAdding(true);
        // Scroll to form if needed
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este producto?')) {
            await supabase.from('products').delete().eq('id', id);
            fetchProducts();
        }
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', category: '', price: '', stock_quantity: '', image_url: '' });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2>Gestión de Inventario</h2>
                {!isAdding && (
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={18} /> Agregar Producto
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="glass-panel mb-8 relative">
                    <button onClick={resetForm} className="absolute top-4 right-4 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                    <h3 className="mb-4">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <input
                            placeholder="Nombre del Producto"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-slate-900 border-slate-700 rounded p-2 text-white"
                        />
                        <input
                            placeholder="Categoría"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="bg-slate-900 border-slate-700 rounded p-2 text-white"
                        />
                        <input
                            type="number"
                            placeholder="Precio"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            required
                            step="0.01"
                            className="bg-slate-900 border-slate-700 rounded p-2 text-white"
                        />
                        <input
                            type="number"
                            placeholder="Cantidad"
                            value={formData.stock_quantity}
                            onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                            required
                            className="bg-slate-900 border-slate-700 rounded p-2 text-white"
                        />
                        <input
                            placeholder="URL de Imagen (opcional)"
                            value={formData.image_url}
                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                            className="col-span-2 bg-slate-900 border-slate-700 rounded p-2 text-white"
                        />
                        <div className="col-span-2 flex gap-4 mt-2">
                            <button type="submit" className="btn btn-primary flex-1">
                                {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th className="p-3">Producto</th>
                            <th className="p-3">Categoría</th>
                            <th className="p-3">Precio</th>
                            <th className="p-3">Inventario</th>
                            <th className="p-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td className="p-3">
                                    <div className="font-medium">{p.name}</div>
                                </td>
                                <td className="p-3 text-secondary">{p.category}</td>
                                <td className="p-3 font-mono">${p.price}</td>
                                <td className="p-3">
                                    <span className={`badge ${p.stock_quantity < 5 ? 'badge-low-stock' : ''}`}>
                                        {p.stock_quantity} unidades
                                        {p.stock_quantity < 5 && <AlertTriangle size={12} className="inline ml-1" />}
                                    </span>
                                </td>
                                <td className="p-3 flex gap-2">
                                    <button
                                        onClick={() => handleEdit(p)}
                                        className="btn btn-secondary text-blue-400 hover:text-blue-300"
                                        style={{ padding: '0.25rem 0.5rem' }}
                                        title="Editar"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="btn btn-secondary text-red-400 hover:text-red-300"
                                        style={{ padding: '0.25rem 0.5rem' }}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
