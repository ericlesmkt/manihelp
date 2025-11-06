// Nome do arquivo: components/NewAppointmentModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, CalendarCheck, Clock, User, Briefcase, Phone, Loader2, Plus, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

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

// clientCreationMode gerencia se estamos buscando um cliente existente ou criando um novo
type ClientMode = 'existing' | 'new';

// Campos do Formulário
type AppointmentFormData = {
  // client_id é o ID real do profile, ou o ID gerado na hora
  client_id: string; 
  service_id: string; 
  start_time: string; 
  manicure_id: string; 
  
  // Campos para Novo Cliente (temporários no estado)
  newClientName: string;
  newClientPhone: string;
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

export default function NewAppointmentModal({ isOpen, onClose, manicureId, onAppointmentCreated }: NewAppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({ ...initialFormData, manicure_id: manicureId });
  const [clients, setClients] = useState<Profile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientMode, setClientMode] = useState<ClientMode>('existing'); // NOVO ESTADO
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Carregar Clientes e Serviços da Manicure
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Busca TODOS os perfis com role 'client'
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'client')
        .order('name', { ascending: true }); // Ordena por nome
      
      // Busca Serviços
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
      setError('Falha ao carregar clientes ou serviços. Verifique a conexão com o Supabase e RLS.');
    } finally {
      setIsLoading(false);
    }
  }, [manicureId]);

  // Função para criar um novo perfil de cliente (sem Auth)
  const createNewClient = async (name: string, phone: string) => {
    // Cria um ID único para o cliente não-logado
    const tempId = crypto.randomUUID(); 
    
    const { data, error: insertError } = await supabase
      .from('profiles')
      .insert({ 
        id: tempId, 
        name: name, 
        phone_number: phone, 
        role: 'client' 
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Falha ao criar novo cliente: ${insertError.message}`);
    }
    
    // Retorna o ID gerado
    return data.id; 
  };


  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Reseta o modo e o formulário
      setClientMode('existing'); 
      setFormData({ ...initialFormData, manicure_id: manicureId }); 
    }
  }, [isOpen, fetchData, manicureId]);

  // Manipulação de Mudanças no Formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função de Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    let finalClientId = formData.client_id;
    
    try {
      // PASSO 1: TRATAR NOVO CLIENTE
      if (clientMode === 'new') {
        if (!formData.newClientName || !formData.newClientPhone) {
          setError('Nome e Telefone são obrigatórios para novos clientes.');
          setIsSaving(false);
          return;
        }
        // Cria o cliente e obtém o ID
        finalClientId = await createNewClient(formData.newClientName, formData.newClientPhone);
      }
      
      // PASSO 2: VALIDAÇÃO FINAL
      if (!finalClientId || !formData.service_id || !formData.start_time) {
        setError('Por favor, preencha todos os campos obrigatórios.');
        setIsSaving(false);
        return;
      }

      const serviceIdNumber = Number(formData.service_id);
      const selectedService = services.find(s => s.id === serviceIdNumber);
      
      if (!selectedService || isNaN(serviceIdNumber)) {
        setError('Serviço inválido ou não selecionado.');
        setIsSaving(false);
        return;
      }

      // PASSO 3: CÁLCULO E SALVAMENTO
      const startTime = new Date(formData.start_time);
      const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000); 

      const newAppointment = {
        client_id: finalClientId, // ID do cliente (existente ou novo)
        manicure_id: formData.manicure_id,
        service_id: serviceIdNumber, 
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending' as const, // Começa como PENDENTE
      };

      const { error: insertError } = await supabase
        .from('appointments')
        .insert([newAppointment]);

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
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300">
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
                    Novo Cliente
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
                  Nome do Cliente
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
              
              {/* Telefone do Cliente */}
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
                  onChange={handleChange}
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
                      {service.name} (R$ {service.price.toFixed(2)} / {service.duration_minutes} min)
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Data e Hora (Comum aos dois modos) */}
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

// Ícone para dropdown
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}