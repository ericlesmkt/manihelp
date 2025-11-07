// Nome do arquivo: components/NewAppointmentModal.tsx
"use client";

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
// Ícones (sem DatePicker)
import { X, CalendarCheck, Clock, User, Briefcase, Phone, Loader2, Users, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
// REMOVIDO: import DatePicker, date-fns, etc.

// --- Tipos de Dados ---
type Profile = {
  id: string; // UUID
  name: string;
};

type Service = {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
};

type ClientMode = 'existing' | 'new';

type AppointmentFormData = {
  client_id: string; 
  service_id: string; 
  start_time: string; // String do input datetime-local
  manicure_id: string; 
  
  newClientName: string;
  newClientPhone: string; // Armazena o telefone formatado
};

// --- Propriedades do Modal ---
interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  manicureId: string;
  onAppointmentCreated: () => void; 
}

const initialFormData: AppointmentFormData = {
  client_id: '',
  service_id: '', 
  start_time: '', 
  manicure_id: '',
  newClientName: '',
  newClientPhone: '',
};

// --- FUNÇÃO DE MÁSCARA (Mantida) ---
const maskPhoneNumber = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, ""); 
  if (value.length > 11) value = value.substring(0, 11);
  value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
  value = value.replace(/(\d{5})(\d)/, "$1-$2");
  return value;
};


export default function NewAppointmentModal({ isOpen, onClose, manicureId, onAppointmentCreated }: NewAppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({ ...initialFormData, manicure_id: manicureId });
  const [clients, setClients] = useState<Profile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientMode, setClientMode] = useState<ClientMode>('existing');
  // REMOVIDO: [selectedDate, setSelectedDate]
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Carregar Clientes e Serviços da Manicure
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'client')
        .order('name', { ascending: true }); 
      
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('id, name, price, duration_minutes')
        .eq('manicure_id', manicureId);

      if (clientError || serviceError) {
        throw new Error(clientError?.message || serviceError?.message);
      }
      setClients(clientData || []);
      setServices(serviceData || []);
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e);
      setError('Falha ao carregar clientes ou serviços.');
    } finally {
      setIsLoading(false);
    }
  }, [manicureId]);

  // REMOVIDO: createNewClient (agora é createGuestAppointment)
  
  useEffect(() => {
    if (isOpen) {
      fetchData();
      setClientMode('existing'); 
      setFormData({ ...initialFormData, manicure_id: manicureId }); 
      // REMOVIDO: setSelectedDate
    }
  }, [isOpen, fetchData, manicureId]);

  // Manipulador genérico
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manipulador da máscara
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = maskPhoneNumber(e.target.value);
      setFormData(prev => ({ ...prev, newClientPhone: maskedValue }));
  };
  

  // --- SUBMIT CORRIGIDO ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    // Objeto base do agendamento
    let appointmentPayload: any = {
      manicure_id: formData.manicure_id,
      status: 'pending' as const,
    };
    
    try {
      // 1. Validação de Data/Serviço
      if (!formData.start_time || !formData.service_id) {
          setError('Serviço e Data/Hora são obrigatórios.');
          setIsSaving(false);
          return;
      }
      
      const serviceIdNumber = Number(formData.service_id);
      const selectedService = services.find(s => s.id === serviceIdNumber);
      if (!selectedService) throw new Error("Serviço inválido.");

      const startTime = new Date(formData.start_time);
      const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000);
      
      appointmentPayload = {
          ...appointmentPayload,
          service_id: serviceIdNumber, 
          start_time: startTime.toISOString(), 
          end_time: endTime.toISOString(),
      };

      // 2. Validação de Cliente (Convidado ou Existente)
      if (clientMode === 'new') {
        if (!formData.newClientName || !formData.newClientPhone) {
          setError('Nome e Telefone são obrigatórios para novos clientes.');
          setIsSaving(false);
          return;
        }
        
        const cleanPhone = formData.newClientPhone.replace(/\D/g, "");
        if (cleanPhone.length !== 11) {
            setError('O Telefone deve ter 11 dígitos (DDD + 9 dígitos).');
            setIsSaving(false);
            return;
        }

        // Salva como Convidado
        appointmentPayload = {
            ...appointmentPayload,
            client_id: null, // Nulo, pois não tem perfil
            guest_name: formData.newClientName,
            guest_phone: cleanPhone, // Salva o telefone limpo
        };

      } else {
        if (!formData.client_id) {
            setError('Selecione um cliente existente.');
            setIsSaving(false);
            return;
        }
        // Salva com o Perfil existente
        appointmentPayload = {
            ...appointmentPayload,
            client_id: formData.client_id,
            guest_name: null,
            guest_phone: null,
        };
      }
      
      // 3. Inserção no Banco
      const { error: insertError } = await supabase
        .from('appointments')
        .insert([appointmentPayload]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Sucesso
      onAppointmentCreated(); 
      onClose(); 
      
    } catch (e: any) {
      console.error('Erro ao salvar agendamento:', e);
      setError(`Falha ao salvar. Detalhe: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100] transition-opacity duration-300">
      {/* REMOVIDO: Bloco <style> do DatePicker */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-300 scale-100">
        
        {/* Header do Modal */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <CalendarCheck className="w-6 h-6 mr-2 text-mani-pink-600" />
            Novo Agendamento
          </h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo do Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {/* SELETOR DE MODO DO CLIENTE (Existente vs. Novo) */}
          <div className="space-y-3 border-b border-gray-200 pb-4">
             <label className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                <Users className="w-4 h-4 mr-1 text-mani-pink-600" />
                Opções de Cliente
             </label>
             <div className="flex space-x-2">
                <button
                    type="button"
                    onClick={() => setClientMode('existing')}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition ${clientMode === 'existing' ? 'bg-mani-pink-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Cliente Existente
                </button>
                <button
                    type="button"
                    onClick={() => setClientMode('new')}
                    className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition ${clientMode === 'new' ? 'bg-mani-pink-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Novo Cliente (Convidado)
                </button>
             </div>
          </div>
          

          {/* MODO: SELECIONAR CLIENTE EXISTENTE */}
          {clientMode === 'existing' && (
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-1 text-mani-pink-600" />
                Selecionar Cliente
              </label>
              <div className="relative">
                <select
                  id="client_id"
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  disabled={isLoading || isSaving}
                  className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-mani-pink-500 focus:border-mani-pink-500 sm:text-sm rounded-lg shadow-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecione um cliente...</option>
                  {isLoading ? (
                    <option disabled>Carregando clientes...</option>
                  ) : (
                    clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* MODO: CADASTRO RÁPIDO DE CLIENTE */}
          {clientMode === 'new' && (
            <div className="space-y-4">
               {/* Nome do Cliente */}
              <div>
                <label htmlFor="newClientName" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-1 text-mani-pink-600" />
                  Nome do Cliente (Convidado)
                </label>
                <input
                  type="text"
                  id="newClientName"
                  name="newClientName"
                  value={formData.newClientName}
                  onChange={handleChange}
                  placeholder="Nome completo do novo cliente"
                  className="mt-1 block w-full py-3 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-mani-pink-500 focus:border-mani-pink-500 sm:text-sm"
                  required
                />
              </div>
              
              {/* Telefone do Cliente (COM MÁSCARA) */}
              <div>
                <label htmlFor="newClientPhone" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-1 text-mani-pink-600" />
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  id="newClientPhone"
                  name="newClientPhone"
                  value={formData.newClientPhone}
                  onChange={handlePhoneChange} 
                  maxLength={15} 
                  placeholder="(99) 99999-9999"
                  className="mt-1 block w-full py-3 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-mani-pink-500 focus:border-mani-pink-500 sm:text-sm"
                  required
                />
              </div>
            </div>
          )}

          {/* Seleção de Serviço (Comum aos dois modos) */}
          <div>
            <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Briefcase className="w-4 h-4 mr-1 text-mani-pink-600" />
              Serviço
            </label>
            <div className="relative">
              <select
                id="service_id"
                name="service_id"
                value={formData.service_id}
                onChange={handleChange}
                disabled={isLoading || isSaving}
                className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-mani-pink-500 focus:border-mani-pink-500 sm:text-sm rounded-lg shadow-sm appearance-none cursor-pointer"
              >
                <option value="" disabled>Selecione um serviço...</option>
                {isLoading ? (
                  <option disabled>Carregando serviços...</option>
                ) : (
                  services.map(service => (
                    <option key={service.id} value={String(service.id)}>
                      {service.name}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
          </div>

          {/* Data e Hora (REVERTIDO PARA HTML PADRÃO) */}
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-1 text-mani-pink-600" />
              Data e Hora
            </label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              disabled={isSaving}
              required
              // Estilo ajustado para ser mais amigável
              className="mt-1 block w-full py-3 px-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-mani-pink-500 focus:border-mani-pink-500 sm:text-sm"
            />
          </div>

          {/* Rodapé e Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-mani-pink-600 rounded-lg shadow-md hover:bg-mani-pink-700 transition flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}