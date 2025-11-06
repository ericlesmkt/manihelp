// Nome do arquivo: components/ClientAppointments.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, Check, XCircle, Calendar, Loader2, AlertTriangle } from 'lucide-react';

// --- Tipos de Agendamento (Visão do Cliente) ---
type ServiceData = { id: number; name: string; price: number };

type ClientAppointmentItem = {
    id: number;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    service_id: ServiceData[] | null; 
};

interface ClientAppointmentsProps {
    clientId: string;
}

// Dicionário de Status para a UI
const StatusDisplay = {
    pending: { label: "Pendente", color: "yellow", icon: Clock },
    confirmed: { label: "Confirmado", color: "green", icon: Check },
    cancelled: { label: "Cancelado", color: "red", icon: XCircle },
    completed: { label: "Concluído", color: "gray", icon: Calendar },
};

export default function ClientAppointments({ clientId }: ClientAppointmentsProps) {
    const [appointments, setAppointments] = useState<ClientAppointmentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState<number | null>(null); 

    // Função auxiliar para acessar o nome e o preço do serviço corretamente
    const getServiceName = (appt: ClientAppointmentItem) => appt.service_id && appt.service_id[0]?.name ? appt.service_id[0].name : 'Serviço não encontrado';
    const getServicePrice = (appt: ClientAppointmentItem) => appt.service_id && appt.service_id[0]?.price ? `R$ ${parseFloat(String(appt.service_id[0].price)).toFixed(2)}` : 'N/A';


    // Função que busca os dados e ordena (usada no fetch inicial e no Realtime)
    const fetchAndSortAppointments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id, start_time, end_time, status,
                    service_id (id, name, price)
                `)
                .eq('client_id', clientId)
                .order('start_time', { ascending: true }); 

            if (error) {
                throw new Error(error.message);
            }
            
            setAppointments(data as ClientAppointmentItem[]);
        } catch (e: any) {
            console.error('Erro ao buscar agendamentos:', e);
            setError(`Falha ao buscar agendamentos. Detalhe: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [clientId]);
    
    // NOVO: Função para Cancelar Agendamento
    const handleCancel = async (id: number) => {
        setIsCancelling(id);
        setError(null);

        try {
            // Atualiza o status no Supabase
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id)
                .select(); 

            if (updateError) {
                throw new Error(updateError.message);
            }
            
            // O Realtime (useEffect abaixo) deve pegar a mudança e atualizar a lista
            // Se o Realtime estiver ativo, a atualização é automática.

        } catch (e: any) {
            console.error('Erro ao cancelar agendamento:', e);
            setError(`Falha ao cancelar o agendamento. Tente novamente. Detalhe: ${e.message}`);
        } finally {
            setIsCancelling(null);
        }
    };


    // Efeito para configurar a escuta em tempo real (Realtime)
    // REMOVEMOS O POLLING CHATO E VOLTAMOS AO REALTIME
    useEffect(() => {
        // Busca inicial
        fetchAndSortAppointments();

        // Escuta em tempo real por INSERÇÕES, ATUALIZAÇÕES e EXCLUSÕES
        const subscription = supabase
            .channel(`client_appointments_${clientId}`) 
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments', filter: `client_id=eq.${clientId}` },
                () => {
                    // Re-busca os dados quando algo muda no banco
                    fetchAndSortAppointments();
                }
            )
            .subscribe();

        // Limpa a subscrição quando o componente é desmontado ou clientId muda
        return () => {
            supabase.removeChannel(subscription);
        };
    }, [clientId, fetchAndSortAppointments]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-mani-pink-600 animate-spin" />
                <p className="ml-3 text-gray-600">Buscando seus agendamentos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                <p className="font-bold">Erro de Dados</p>
                <p>{error}</p>
            </div>
        );
    }
    
    if (appointments.length === 0) {
        return (
            <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-gray-400 mx-auto" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">Você não tem agendamentos</h3>
                <p className="mt-1 text-gray-500">Clique em "Agendar Novo Serviço" para começar.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Seus Compromissos</h2>
            
            <ul className="divide-y divide-gray-100">
                {appointments.map((appt) => {
                    const startDate = new Date(appt.start_time);
                    const dateStr = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
                    const timeStr = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const Status = StatusDisplay[appt.status] || StatusDisplay.pending;
                    const Icon = Status.icon;
                    const isActionable = appt.status === 'confirmed' || appt.status === 'pending';
                    const isBusy = isCancelling === appt.id;

                    return (
                        <li key={appt.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition duration-150 rounded-md px-2">
                            
                            {/* Data e Serviço */}
                            <div className="space-y-1 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                                <div className="text-sm font-semibold text-gray-900 flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-mani-pink-500" />
                                    {dateStr} às {timeStr}
                                </div>
                                <div className="text-gray-600 text-sm sm:pl-0 pl-6">
                                    Serviço: <span className="font-medium">{getServiceName(appt)} ({getServicePrice(appt)})</span>
                                </div>
                            </div>

                            {/* Status e Ações */}
                            <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                                {/* Status Chip */}
                                <span className={`flex items-center text-xs font-medium text-${Status.color}-600 bg-${Status.color}-100 px-3 py-1 rounded-full`}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {Status.label}
                                </span>
                                
                                {/* Ações */}
                                {isActionable && (
                                    <button 
                                        onClick={() => handleCancel(appt.id)}
                                        disabled={isBusy}
                                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400 flex items-center"
                                    >
                                        {isBusy ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                ...
                                            </>
                                        ) : (
                                            'Cancelar'
                                        )}
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
            
            <p className="text-center pt-4 text-sm text-gray-500 border-t mt-4">
                Você tem {appointments.length} agendamentos no total.
            </p>
        </div>
    );
}