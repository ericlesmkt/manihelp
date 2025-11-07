// Nome do arquivo: components/NotificationBell.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bell, Loader2, Trash2 } from 'lucide-react';

// --- Tipos ---
type NotificationItem = { 
    id: number; 
    message: string; 
    is_read: boolean; 
    created_at: string; 
    type: string; 
};

export default function NotificationBell({ manicureId }: { manicureId: string }) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = useCallback(async () => {
        if (!manicureId) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('manicure_id', manicureId)
            .order('created_at', { ascending: false })
            .limit(10); 

        if (!error) {
            setNotifications(data as NotificationItem[]);
        }
    }, [manicureId]);

    // Lógica de Realtime para Notificações
    useEffect(() => {
        fetchNotifications();

        // Se inscreve para receber notificações em tempo real
        const channel = supabase
            .channel(`manicure_notifications_${manicureId}`)
            .on(
                'postgres_changes',
                // O trigger SQL garante que apenas 'INSERT's cheguem aqui para notificar o sino
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `manicure_id=eq.${manicureId}` },
                () => {
                    fetchNotifications(); // Re-fetch na inserção
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [manicureId, fetchNotifications]);

    // Marca todas as notificações visíveis como lidas
    const handleMarkAsRead = async () => {
        const idsToMark = notifications.filter(n => !n.is_read).map(n => n.id);
        if (idsToMark.length === 0) return;

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', idsToMark);
            
        // Atualiza o estado local para refletir a leitura
        setNotifications(notifications.map(n => ({...n, is_read: true})));
    };
    
    // Função utilitária para formatar o tempo
    const formatTime = (isoString: string) => {
        const diff = new Date().getTime() - new Date(isoString).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Agora";
        if (minutes < 60) return `${minutes} min atrás`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} h atrás`;
        return new Date(isoString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="relative">
            <button 
                onClick={() => { setIsOpen(!isOpen); if (isOpen) handleMarkAsRead(); }} 
                className="text-gray-400 hover:text-gray-500 rounded-full p-1 relative"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-mani-pink-500 ring-2 ring-white animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-2 ring-1 ring-black ring-opacity-5 z-50 transform translate-x-2"
                    // Marca como lido quando o mouse sai do pop-up
                    onMouseLeave={() => { setIsOpen(false); handleMarkAsRead(); }}
                >
                    <div className="px-4 py-2 text-lg font-semibold text-gray-800 border-b">Notificações</div>
                    
                    {notifications.length === 0 ? (
                        <p className="p-4 text-center text-gray-500 text-sm">Nenhuma notificação recente.</p>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto">
                            {notifications.map(n => (
                                <li 
                                    key={n.id} 
                                    className={`px-4 py-3 border-b text-sm transition ${!n.is_read ? 'bg-mani-pink-50' : 'hover:bg-gray-50'}`}
                                >
                                    <p className={`font-medium ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {n.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatTime(n.created_at)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                    
                </div>
            )}
        </div>
    );
}