// Nome do arquivo: components/AppointmentDetailModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, User, Phone, Briefcase, DollarSign, Clock, Calendar, Check, AlertTriangle, CalendarCheck, Save, Loader2, MessageSquare, Trash2, Pencil } from 'lucide-react';

// --- Tipos ---
type ProfileData = { id: string; name: string; phone_number: string };
type ServiceData = { id: number; name: string; price: number; duration_minutes: number; }; // Corrigido para duration_minutes

type AppointmentItem = {
    id: number;
    start_time: string; 
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    guest_name: string | null; 
    guest_phone: string | null;
    client_id: ProfileData[] | null; 
    service_id: ServiceData[] | null; 
    notes: string | null;
    override_price: number | null; 
};

// --- Propriedades ---
interface DetailModalProps {
    appointment: AppointmentItem | null; 
    manicureId: string; // CORREÇÃO: Recebe o ID da manicure
    onClose: () => void;
    onUpdate: () => void; 
}

// --- Funções Auxiliares ---
const getClientName = (appt: AppointmentItem) => {
    if (appt.client_id && appt.client_id.length > 0) return appt.client_id[0].name;
    return appt.guest_name || 'Cliente (Convidado)';
};
const getClientPhone = (appt: AppointmentItem) => {
    if (appt.client_id && appt.client_id.length > 0) return appt.client_id[0].phone_number;
    return appt.guest_phone || 'Não informado';
};
const getServiceName = (appt: AppointmentItem) => (appt.service_id && appt.service_id[0] ? appt.service_id[0].name : 'Serviço Removido');
const getPrice = (appt: AppointmentItem) => {
    if (appt.override_price !== null) {
        return appt.override_price;
    }
    if (appt.service_id && appt.service_id[0]) {
        return appt.service_id[0].price;
    }
    return 0;
};
const getServiceId = (appt: AppointmentItem) => (appt.service_id && appt.service_id[0] ? appt.service_id[0].id : 0);

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function AppointmentDetailModal({ appointment, manicureId, onClose, onUpdate }: DetailModalProps) {
    
    // Estados para Edição
    const [notes, setNotes] = useState(appointment?.notes || '');
    const [price, setPrice] = useState('0.00');
    const [selectedServiceId, setSelectedServiceId] = useState<number>(0); 
    const [availableServices, setAvailableServices] = useState<ServiceData[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Busca todos os serviços da manicure para o dropdown
    const fetchServices = useCallback(async (mId: string) => {
        if (!mId) return;
        const { data, error } = await supabase
            .from('services')
            .select('id, name, price, duration_minutes')
            .eq('manicure_id', mId);
        
        if (!error && data) {
            setAvailableServices(data as ServiceData[]);
        }
    }, []);

    // Carrega os dados no estado local quando o modal abre
    useEffect(() => {
        if (appointment && manicureId) {
            setNotes(appointment.notes || '');
            setPrice(getPrice(appointment).toFixed(2).replace('.', ','));
            setSelectedServiceId(getServiceId(appointment));
            setError(null);
            
            // CORREÇÃO: Usa o manicureId da prop para buscar os serviços
            fetchServices(manicureId);
        }
    }, [appointment, manicureId, fetchServices]);

    if (!appointment) return null;

    // --- AÇÕES DO MODAL ---
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        value = value.replace(/[^\d.,]/g, ''); 
        value = value.replace(',', '.'); 
        setPrice(value);
    };

    // Manipulador de mudança de serviço
    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newServiceId = Number(e.target.value);
        setSelectedServiceId(newServiceId);
        
        // Atualiza o preço automaticamente para o preço do novo serviço
        const newService = availableServices.find(s => s.id === newServiceId);
        if (newService) {
            setPrice(newService.price.toFixed(2).replace('.', ','));
        }
    };


    // Salvar Preço, Serviço e Observações
    const handleSaveEdits = async () => {
        setIsSaving(true);
        setError(null);
        
        const newPrice = parseFloat(price.replace(',', '.'));
        const newServiceId = Number(selectedServiceId);
        
        if (isNaN(newPrice) || isNaN(newServiceId) || newServiceId === 0) {
            setError('Valor ou Serviço inválido.');
            setIsSaving(false);
            return;
        }
        
        const selectedService = availableServices.find(s => s.id === newServiceId);
        if (!selectedService) {
            setError('Serviço selecionado não encontrado.');
            setIsSaving(false);
            return;
        }
        
        // RECALCULA O END_TIME
        const startTime = new Date(appointment.start_time);
        const newEndTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ 
                    notes: notes,
                    override_price: newPrice,
                    service_id: newServiceId,
                    end_time: newEndTime.toISOString() 
                })
                .eq('id', appointment.id);
            if (error) throw error;
            
            onUpdate(); // Atualiza o dashboard
            onClose(); // Fecha o modal
        } catch (e: any) {
            setError('Falha ao salvar alterações.');
        } finally {
            setIsSaving(false);
        }
    };

    // Cancelar Agendamento
    const handleCancelAppointment = async () => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento? Esta ação é irreversível.')) return;
        
        setIsCancelling(true);
        setError(null);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointment.id);
            if (error) throw error;
            onUpdate(); // Atualiza o dashboard
            onClose(); // Fecha o modal
        } catch (e: any) {
            setError('Falha ao cancelar agendamento.');
        } finally {
            setIsCancelling(false);
        }
    };

    // --- DADOS FORMATADOS ---
    const clientName = getClientName(appointment);
    const clientPhone = getClientPhone(appointment);
    const date = formatDate(appointment.start_time);
    const time = formatTime(appointment.start_time);
    const status = appointment.status;

    const statusInfo = {
        pending: { text: "Pendente", icon: Clock, color: "text-yellow-600" },
        confirmed: { text: "Confirmado", icon: Check, color: "text-green-600" },
        cancelled: { text: "Cancelado", icon: X, color: "text-red-600" },
        completed: { text: "Concluído", icon: CalendarCheck, color: "text-gray-500" },
    };
    const CurrentStatus = statusInfo[status];
    const isPast = new Date(appointment.start_time) < new Date();


    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] transition-opacity duration-300"
            onClick={onClose} 
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4"
                onClick={(e) => e.stopPropagation()} 
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <Pencil className="w-6 h-6 mr-2 text-mani-pink-600" />
                        Editar Agendamento
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Corpo */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}
                    
                    {/* Status */}
                    <div className={`p-4 rounded-lg flex items-center ${CurrentStatus.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <CurrentStatus.icon className={`w-6 h-6 mr-3 ${CurrentStatus.color}`} />
                        <span className={`text-lg font-semibold ${CurrentStatus.color}`}>{CurrentStatus.text}</span>
                    </div>

                    {/* Informações (Cliente e Data/Hora são fixos) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center"><User className="w-4 h-4 mr-1" /> Cliente</label>
                            <p className="text-lg font-semibold text-gray-900">{clientName}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center"><Phone className="w-4 h-4 mr-1" /> Telefone (WhatsApp)</label>
                            <p className="text-lg font-semibold text-gray-900">{clientPhone}</p>
                        </div>
                    </div>
                    <div className="bg-mani-pink-50 p-4 rounded-lg border border-mani-pink-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><Clock className="w-4 h-4 mr-1" /> Data e Hora (Fixo)</label>
                        <p className="text-xl font-bold text-mani-pink-700">{date} às {time}</p>
                    </div>

                    
                    {/* --- CAMPOS DE EDIÇÃO --- */}
                    
                    {/* CAMPO DE SERVIÇO (Editável) */}
                    <div>
                        <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            Serviço
                        </label>
                        <select
                            id="service_id"
                            name="service_id"
                            value={selectedServiceId}
                            onChange={handleServiceChange}
                            disabled={isSaving}
                            className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-mani-pink-500 focus:border-mani-pink-500 sm:text-sm rounded-lg shadow-sm appearance-none cursor-pointer"
                        >
                            <option value={0} disabled>Selecione um serviço...</option>
                            {availableServices.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name} (R$ {service.price.toFixed(2)})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* CAMPO DE PREÇO (Editável) */}
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" /> Valor (R$) - Ajuste
                        </label>
                        <input 
                            type="text"
                            inputMode="decimal"
                            id="price"
                            value={price}
                            onChange={handlePriceChange}
                            className="text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg p-2 w-full"
                        />
                    </div>
                    
                    {/* CAMPO DE OBSERVAÇÕES */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Observações (Internas)
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="mt-1 w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-mani-pink-500 focus:border-mani-pink-500 resize-none"
                            placeholder="Ex: Cliente prefere esmalte claro, alergia a acetona..."
                        />
                    </div>
                    
                    {/* Botão de Salvar Alterações (Preço e Notas) */}
                    <button
                        onClick={handleSaveEdits}
                        disabled={isSaving}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-mani-pink-600 rounded-lg shadow-md hover:bg-mani-pink-700 transition flex items-center justify-center disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Alterações
                    </button>
                    
                </div>

                {/* Rodapé de Ações */}
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700"
                    >
                        Fechar
                    </button>
                    
                    {/* BOTÃO DE CANCELAR */}
                    {(status === 'pending' || status === 'confirmed') && !isPast && (
                         <button
                            onClick={handleCancelAppointment}
                            disabled={isCancelling}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition flex items-center justify-center disabled:opacity-50"
                        >
                            {isCancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Cancelar Agendamento
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}