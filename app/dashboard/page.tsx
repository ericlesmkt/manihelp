// Nome do arquivo: app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Ícones necessários (apenas para esta página)
import { 
  Calendar, 
  Users, 
  Plus, 
  Check,
  Clock,
  Loader2,
  AlertTriangle,
  User as UserIcon,
  DollarSign,
  CalendarCheck,
  ClipboardCheck,
  Info 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient'; 
import NewAppointmentModal from '../../components/NewAppointmentModal';
import AppointmentDetailModal from '../../components/AppointmentDetailModal'; 
import ManicureHeader from '../../components/ManicureHeader'; // NOVO HEADER

// --- Tipos de Dados ---
type ProfileData = { id: string; name: string; phone_number: string };
type ServiceData = { id: number; name: string; price: number; duration_minutes: number; }; 

type AppointmentItem = {
    id: number;
    start_time: string; 
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    guest_name: string | null; 
    guest_phone: string | null;
    notes: string | null;
    override_price: number | null; 
    client_id: ProfileData[] | null; 
    service_id: ServiceData[] | null; 
};

type SummaryStat = {
  label: string;
  value: string;
  icon: React.ElementType;
};

// --- Dados Mockados ---
const mockUser = {
  name: "Dona Maria",
  avatarUrl: "https://placehold.co/100x100/E62E7A/FFFFFF?text=M"
};


// --- Componente: UpcomingAppointments (Agendamentos de Hoje) ---
function UpcomingAppointments({ appointments, isLoading, error, onShowDetails }: { 
    appointments: AppointmentItem[], 
    isLoading: boolean, 
    error: string | null,
    onShowDetails: (appt: AppointmentItem) => void 
}) {
  
  // FUNÇÃO AUXILIAR CORRIGIDA (para aceitar convidados)
  const getClientName = (appt: AppointmentItem) => appt.client_id ? appt.client_id[0]?.name : appt.guest_name || 'Cliente (Convidado)';
  const getServiceName = (appt: AppointmentItem) => appt.service_id && appt.service_id[0] ? appt.service_id[0].name : 'Serviço Removido';

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-10 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-mani-pink-600 animate-spin" />
        <p className="mt-4 text-gray-600">Carregando agendamentos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-lg" role="alert">
        <p className="font-bold">Erro de Conexão</p>
        <p>Não foi possível carregar os agendamentos. Detalhes: {error}</p>
      </div>
    );
  }
  
  const todayAppointments = appointments.filter(appt => appt.status !== 'cancelled' && appt.status !== 'pending');

  if (todayAppointments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-10 text-center">
        <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto" />
        <h3 className="mt-4 text-xl font-semibold text-gray-900">Nenhum Agendamento Hoje</h3>
        <p className="mt-1 text-gray-500">Seu dia está livre, ou talvez você deva criar um novo agendamento!</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Próximos Agendamentos de Hoje ({todayAppointments.length})</h2>
        <p className="text-sm text-gray-500 mt-1">Compromissos confirmados para as próximas horas.</p>
      </div>

      <ul className="divide-y divide-gray-200">
        {todayAppointments.map((appt) => {
            const time = new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const isConfirmed = appt.status === 'confirmed' || appt.status === 'completed';
            
            return (
            <li key={appt.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-mani-pink-100 text-mani-pink-600 rounded-full flex items-center justify-center font-bold text-base sm:text-lg">
                    {time.split(':')[0]}h
                </div>
                <div>
                    <p className="text-md font-semibold text-gray-900">{getClientName(appt)}</p>
                    <p className="text-sm text-gray-600">{getServiceName(appt)}</p>
                </div>
                </div>
                
                <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                {isConfirmed ? (
                    <span className="flex items-center text-xs font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    <Check className="w-3 h-3 mr-1" />
                    Confirmado
                    </span>
                ) : (
                    <span className="flex items-center text-xs font-medium text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">
                    <Clock className="w-3 h-3 mr-1" />
                    Pendente
                    </span>
                )}
                <button 
                    onClick={() => onShowDetails(appt)} 
                    className="text-sm font-medium text-mani-pink-600 hover:text-mani-pink-800"
                >
                    Detalhes
                </button>
                </div>
            </li>
        )})}
      </ul>
    </div>
  );
}


// --- Componente: PendingAppointmentsCard ---
function PendingAppointmentsCard({ appointments, onConfirm, isConfirming, onShowDetails }: { 
    appointments: AppointmentItem[], 
    onConfirm: (id: number) => void, 
    isConfirming: number | null,
    onShowDetails: (appt: AppointmentItem) => void
}) {
    
    const getClientName = (appt: AppointmentItem) => appt.client_id && appt.client_id[0] ? appt.client_id[0].name : appt.guest_name || 'Cliente (Convidado)';
    const getServiceName = (appt: AppointmentItem) => appt.service_id && appt.service_id[0] ? appt.service_id[0].name : 'Serviço Removido';

    const pendingAppointments = appointments.filter(appt => {
        const isFuture = new Date(appt.start_time) > new Date();
        return appt.status === 'pending' && isFuture;
    });

    if (pendingAppointments.length === 0) {
        return null;
    }
    
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8">
            <div className="p-6 border-b border-yellow-200 bg-yellow-50">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <AlertTriangle className="w-6 h-6 mr-2 text-yellow-600" />
                    Aprovar Agendamentos ({pendingAppointments.length})
                </h2>
                <p className="text-sm text-gray-600 mt-1">Requisições de serviço pendentes de sua confirmação.</p>
            </div>
            
            <ul className="divide-y divide-gray-200">
                {pendingAppointments.map((appt) => {
                    const time = new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const date = new Date(appt.start_time).toLocaleDateString('pt-BR');
                    const isBusy = isConfirming === appt.id;

                    return (
                        <li key={appt.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-yellow-50 transition-colors">
                            
                            {/* Informações */}
                            <div className="flex-1 space-y-1 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    {date} às {time}
                                </div>
                                <div>
                                    <p className="text-md font-semibold text-gray-900">{getClientName(appt)}</p>
                                    <p className="text-sm text-gray-600">{getServiceName(appt)}</p>
                                </div>
                            </div>
                            
                            {/* Ações */}
                            <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                                <button 
                                    onClick={() => onShowDetails(appt)} 
                                    disabled={isBusy}
                                    className="px-3 py-2 text-sm font-medium text-mani-pink-600 hover:text-mani-pink-800 transition rounded-lg hover:bg-mani-pink-50"
                                >
                                    <Info className="w-4 h-4" />
                                </button>
                                
                                <button 
                                    onClick={() => onConfirm(appt.id)}
                                    disabled={isBusy}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50"
                                >
                                    {isBusy ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <>
                                            <ClipboardCheck className="w-4 h-4 mr-2" />
                                            Confirmar
                                        </>
                                    )}
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}


// --- Componente: SummaryCard ---
function SummaryCard({ stats }: { stats: SummaryStat[] }) {
  const statIcons: { [key: string]: React.ElementType } = {
    'Agendamentos Hoje': Calendar,
    'Requisições Pendentes': AlertTriangle,
    'Receita Estimada (Hoje)': DollarSign,
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Dia</h3>
      <div className="space-y-4">
        {stats.map((stat) => {
          const Icon = statIcons[stat.label] || AlertTriangle;
          return (
            <div key={stat.label} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
              <div className="flex items-center">
                <Icon className="w-4 h-4 mr-2 text-mani-pink-500" />
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  );
}


// --- Componente Principal: DashboardPage ---
export default function DashboardPage() {
  const router = useRouter(); 
  const [allAppointments, setAllAppointments] = useState<AppointmentItem[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manicureId, setManicureId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState<number | null>(null); 
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  // Função para confirmar um agendamento
  const handleConfirm = async (id: number) => {
    setIsConfirming(id);
    try {
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', id);
        if (updateError) throw new Error(updateError.message);
    } catch (e: any) {
        console.error("Erro ao confirmar agendamento:", e);
        alert(`Falha ao confirmar. Detalhes: ${e.message}`);
    } finally {
        setIsConfirming(null);
    }
  };


  // Filtra agendamentos que são HOJE
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };
  
  // Função que busca TODOS os agendamentos (Hoje + Pendentes + Futuros)
  const fetchAppointments = useCallback(async () => {
    // setIsLoading(true); // Não seta para evitar o "piscar" no Realtime
    setError(null);
    if (!manicureId) return; 

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, start_time, end_time, status,
          guest_name, guest_phone, notes, override_price, 
          client_id (id, name, phone_number),
          service_id (id, name, price, duration_minutes)
        `)
        .eq('manicure_id', manicureId)
        .gte('start_time', yesterday.toISOString()) 
        .order('start_time', { ascending: true }); 

      if (error) {
        throw new Error(error.message);
      }
      
      setAllAppointments(data as AppointmentItem[]);

    } catch (e: any) {
      console.error('Erro ao buscar agendamentos:', e);
      setError(`Falha ao buscar dados: ${e.message}`);
    } finally {
      setIsLoading(false); 
    }
  }, [manicureId]);


  // 1. CARREGAMENTO E AUTORIZAÇÃO
  useEffect(() => {
    async function checkAuthAndRole() {
      setIsLoading(true); 
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/'); 
        return;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error || profile?.role !== 'manicure') {
        await supabase.auth.signOut();
        router.replace('/');
        return;
      }

      setManicureId(user.id);
    }
    checkAuthAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);


  // 2. REALTIME (Sem Polling)
  useEffect(() => {
    if (manicureId) {
      fetchAppointments();
      
      const channel = supabase
        .channel(`dashboard_appointments_${manicureId}`)
        .on(
            'postgres_changes',
            { 
              event: '*', 
              schema: 'public', 
              table: 'appointments', 
              filter: `manicure_id=eq.${manicureId}` 
            },
            () => {
                fetchAppointments();
            }
        )
        .subscribe();
        
      return () => {
          supabase.removeChannel(channel);
      };
    }
  }, [manicureId, fetchAppointments]); 

  
  // 3. Divisão dos Agendamentos
  const todayAppointments = allAppointments.filter(appt => isToday(appt.start_time));
  const pendingAppointments = allAppointments.filter(appt => appt.status === 'pending');
  

  // 4. Calcular Estatísticas do Resumo do Dia
  const todayRevenue = todayAppointments.reduce((sum, appt) => {
    if (appt.status === 'completed' || appt.status === 'confirmed') {
      return sum + getPrice(appt);
    }
    return sum;
  }, 0);

  const summaryStats: SummaryStat[] = [
    { label: "Agendamentos Hoje", value: todayAppointments.length.toString(), icon: Calendar },
    { label: "Requisições Pendentes", value: pendingAppointments.length.toString(), icon: AlertTriangle },
    { label: "Receita Estimada (Hoje)", value: `R$ ${todayRevenue.toFixed(2)}`, icon: DollarSign },
  ];
  
  // Função para re-fetch quando um novo agendamento for criado
  const handleAppointmentCreated = () => {
    setIsModalOpen(false); 
    fetchAppointments(); // Força a atualização imediata
  };
  
  // Exibir loader enquanto o estado de auth e role não é definido
  if (!manicureId && !error && isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 font-inter">
        <Loader2 className="w-8 h-8 text-mani-pink-600 animate-spin" />
        <p className="ml-3 text-gray-600">Verificando autenticação...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {/* HEADER CENTRALIZADO */}
      <ManicureHeader mockUser={mockUser} />

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vinda de volta, Dona Maria!
            </h1>
            <p className="lg:text-lg text-gray-600 mt-1">
              Você tem {todayAppointments.length} agendamentos confirmados para hoje.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 md:mt-0 flex items-center justify-center bg-mani-pink-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-mani-pink-700 transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Agendamento
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* CARD 1: AGENDAMENTOS DE HOJE */}
            <UpcomingAppointments 
                appointments={todayAppointments} 
                isLoading={isLoading} 
                error={error} 
                onShowDetails={setSelectedAppointment} 
            />
            
            {/* CARD 2: AGENDAMENTOS PENDENTES (NOVO) */}
            <PendingAppointmentsCard 
                appointments={allAppointments} 
                onConfirm={handleConfirm} 
                isConfirming={isConfirming} 
                onShowDetails={setSelectedAppointment} 
            />

          </div>

          <div className="lg:col-span-1 space-y-8">
            <SummaryCard stats={summaryStats} />
          </div>
        </div>
      </main>
      
      {/* Modal de Novo Agendamento */}
      {manicureId && (
        <NewAppointmentModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          manicureId={manicureId}
          onAppointmentCreated={handleAppointmentCreated}
        />
      )}
      
      {/* Modal de Detalhes (Renderizado aqui) */}
      <AppointmentDetailModal 
        appointment={selectedAppointment} 
        manicureId={manicureId || ''} 
        onClose={() => setSelectedAppointment(null)} 
        onUpdate={fetchAppointments} // Passa a função de re-fetch
      />
    </div>
  );
}