import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Bot, User, X, MessageSquare, Maximize2, Minimize2, Grip } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export const FloatingAIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: '¡Hola! Soy tu asistente de Manu-Shop. ¿En qué te puedo ayudar hoy? Puedo verificar tu stock y recomendarte componentes para tus proyectos.' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Resizing state
    const [size, setSize] = useState({ width: 400, height: 600 });
    const isResizing = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Handle global mouse events for resizing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;

            const dx = lastMousePos.current.x - e.clientX; // Dragging left increases width
            const dy = lastMousePos.current.y - e.clientY; // Dragging up increases height

            setSize(prev => ({
                width: Math.max(300, Math.min(800, prev.width + dx)), // Limits: 300px - 800px
                height: Math.max(400, Math.min(900, prev.height + dy)) // Limits: 400px - 900px
            }));

            lastMousePos.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'nw-resize';
    };

    const toggleOpen = () => setIsOpen(!isOpen);
    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

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
        Tu objetivo es ayudar al usuario (vendedor o administrador) a encontrar componentes para proyectos, verificar stock y sugerir materiales faltantes.
        
        INVENTARIO ACTUAL:
        ${inventoryContext}
        
        INSTRUCCIONES:
        1. Responde basándote PRIMORDIALMENTE en el inventario actual.
        2. Si el usuario pide componentes para un proyecto (ej. "cableado de casa"):
           - Lista los materiales necesarios.
           - Indica cuáles TENEMOS en stock (con cantidad y precio).
           - Indica cuáles FALTAN en el inventario y recomiéndalos agregar.
        3. Sé amable, conciso y profesional.
        4. Si te preguntan por algo que no es de electrónica, trata de relacionarlo o indica amablemente tu función.
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

    if (!isOpen) {
        return (
            <button
                onClick={toggleOpen}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 group"
            >
                <MessageSquare size={28} color="white" className="group-hover:animate-bounce" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
            </button>
        );
    }

    return (
        <div
            className="fixed bottom-6 right-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col transition-all duration-75 z-50"
            style={{
                width: isMinimized ? '300px' : `${size.width}px`,
                height: isMinimized ? '64px' : `${size.height}px`
            }}
        >
            {/* Resize Handle (only when not minimized) */}
            {!isMinimized && (
                <div
                    onMouseDown={startResizing}
                    className="absolute -top-2 -left-2 w-6 h-6 bg-slate-600 hover:bg-blue-500 rounded-full cursor-nw-resize z-50 flex items-center justify-center shadow-lg border border-slate-500"
                    title="Arrastra para redimensionar"
                >
                    <Grip size={12} className="text-white" />
                </div>
            )}

            {/* Header */}
            <div
                className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-2xl flex items-center justify-between cursor-pointer border-b border-slate-700 h-16 shrink-0"
                onClick={() => !isMinimized && setIsMinimized(true)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg">
                        <Bot size={20} color="white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold m-0 text-white">Asistente IA</h3>
                        <p className="text-xs text-slate-400 m-0 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleMinimize} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button onClick={toggleOpen} className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-500">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Body */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50" ref={scrollRef}>
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
                                    }`}>
                                    <div className="whitespace-pre-wrap">{m.content}</div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-700 p-3 rounded-2xl rounded-bl-none text-xs text-slate-400 animate-pulse">
                                    Analizando inventario...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2 shrink-0">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Escribe tu consulta..."
                            className="flex-1 bg-slate-900 border-slate-700 text-sm focus:ring-1 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className={`p-2 rounded-lg bg-blue-600 text-white transition-opacity ${(!input.trim() || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500'}`}
                            disabled={loading || !input.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};
