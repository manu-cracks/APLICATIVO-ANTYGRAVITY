
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Bot, User } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export const AIAssistant: React.FC = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: '¡Hola! Puedo ayudarte a encontrar componentes para tus proyectos. Intenta preguntar algo como "Quiero construir una red local" o "Necesito arreglar una lámpara".' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // 1. Fetch current inventory context
            const { data: products } = await supabase.from('products').select('name, stock_quantity, price, category');

            const inventoryContext = products
                ? products.map(p => `- ${p.name} (Stock: ${p.stock_quantity}, Precio: $${p.price}, Categoria: ${p.category})`).join('\n')
                : 'No hay productos en el inventario.';

            const systemPrompt = `
        Eres un asistente experto en componentes electrónicos y ventas para el sistema "ElectroMonitor".
        Tu objetivo es verificar inventario y sugerir componentes.
        
        INVENTARIO ACTUAL:
        ${inventoryContext}
        
        INSTRUCCIONES:
        1. Responde basándote PRIMORDIALMENTE en el inventario actual.
        2. Indica qué tenemos en stock y qué falta para el proyecto del usuario.
        `;

            // 2. Call OpenRouter API
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": import.meta.env.VITE_AI_MODEL || "google/gemini-2.5-flash-lite",
                    "messages": [
                        { "role": "system", "content": systemPrompt },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { "role": "user", "content": userMessage.content }
                    ]
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'Error en la API');
            }

            const aiContent = data.choices[0]?.message?.content || "Lo siento, no pude procesar tu solicitud.";
            setMessages(prev => [...prev, { id: 'ai-' + Date.now(), role: 'assistant', content: aiContent }]);

        } catch (err: any) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: 'error-' + Date.now(),
                role: 'assistant',
                content: `Error: ${err.message || 'Error desconocido'}. (Verifica tu API Key)`
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <div className="glass-panel flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex items-center gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                        <Bot size={24} color="white" />
                    </div>
                    <div>
                        <h3 className="m-0">Asesor de Componentes IA</h3>
                        <p className="text-xs m-0">Impulsado por ElectroMonitor Intelligence</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages.map(m => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-700 text-slate-200 rounded-bl-none'
                                }`}>
                                <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-bold uppercase">
                                    {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    {m.role === 'user' ? 'Tú' : 'Asistente'}
                                </div>
                                <div className="whitespace-pre-wrap">{m.content}</div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-700 p-4 rounded-2xl rounded-bl-none animate-pulse">
                                Pensando...
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-slate-700/50 bg-slate-800/30 flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Describe tu proyecto (ej. 'Quiero instalar cableado ethernet')..."
                        className="flex-1"
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
