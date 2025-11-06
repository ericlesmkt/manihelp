// Nome do arquivo: components/ClientList.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, Search, Phone, Calendar, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

// --- Tipos ---
type ClientData = {
    id: string;
    name: string;
    phone_number: string;
    total_appointments: number;
    last_service_date: string | null;
};

interface ClientListProps {
    manicureId: string;
}

export default function ClientList({ manicureId }: ClientListProps) {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Função de busca de clientes
    const fetchClients = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Busca apenas os perfis de clientes
            let query = supabase
                .from('profiles')
                .select(`id, name, phone_number, role`)
                .eq('role', 'client')
                .order('name', { ascending: true });
            
            const { data, error } = await query;

            if (error) {
                throw new Error(error.message);
            }
            
            const clientList: ClientData[] = (data || []).map(client => ({
                id: client.id,
                name: client.name,
                phone_number: client.phone_number,
                total_appointments: Math.floor(Math.random() * 10), // Mock de histórico
                last_service_date: "20/Out" // Mock de data
            }));

            setClients(clientList);

        } catch (e: any) {
            console.error('Erro ao buscar clientes:', e);
            setError(`Falha ao buscar clientes. Detalhe: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [manicureId]); 

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Filtro (agora usando o estado clients)
    const filteredClients = clients.filter(client => 
        client.phone_number.includes(searchTerm) || client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className="space-y-6">
            
            {/* Barra de Busca (Responsiva) */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por Nome ou Telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-mani-pink-500 focus:border-mani-pink-500 shadow-sm"
                />
            </div>
            
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 text-mani-pink-600 animate-spin" />
                    <p className="ml-3 text-gray-600">Buscando clientes...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-10">
                    <AlertTriangle className="w-10 h-10 text-gray-400 mx-auto" />
                    <h3 className="mt-4 text-xl font-semibold text-gray-900">Nenhum Cliente Encontrado</h3>
                    <p className="mt-1 text-gray-500">Verifique o termo de busca ou crie um novo agendamento.</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {filteredClients.map(client => (
                        <li key={client.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition duration-150 rounded-md px-2 cursor-pointer">
                            
                            {/* Nome e Telefone (Empilha no Mobile) */}
                            <div className="flex items-start space-x-3 mb-3 sm:mb-0 w-full sm:w-auto">
                                <User className="w-6 h-6 text-mani-pink-500 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-md font-semibold text-gray-900">{client.name}</p>
                                    <p className="text-sm text-gray-600 flex items-center">
                                        <Phone className="w-3 h-3 mr-1" />
                                        {client.phone_number}
                                    </p>
                                </div>
                            </div>

                            {/* Histórico e Botão (Empilha no Mobile) */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full sm:w-auto">
                                <div className="text-sm space-y-1 sm:space-y-0 sm:space-x-4 sm:flex">
                                    <p className="text-gray-700 font-medium">Agendamentos: {client.total_appointments}</p>
                                    <p className="text-gray-500 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Último: {client.last_service_date || 'N/A'}
                                    </p>
                                </div>
                                
                                <button className="mt-3 sm:mt-0 flex items-center justify-center sm:justify-start text-sm font-medium text-mani-pink-600 hover:text-mani-pink-800 border border-mani-pink-200 sm:border-none p-2 rounded-lg">
                                    Histórico Completo
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}