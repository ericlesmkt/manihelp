// Nome do arquivo: app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Bell, 
  ChevronDown, 
  LogOut, 
  Check,
  Clock,
  Loader2,
  AlertTriangle,
  User as UserIcon,
  DollarSign,
  CalendarCheck,
  ClipboardCheck,
  Lock,
  Briefcase, 
  Trash2,
  Info 
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient'; 
import NewAppointmentModal from '../../components/NewAppointmentModal';
import NotificationBell from '../../components/NotificationBell'; 
import AppointmentDetailModal from '../../components/AppointmentDetailModal'; 


// --- Tipos de Dados (Baseados no seu esquema) ---
type ProfileData = { id: string; name: string; phone_number: string };
// CORREÇÃO: Adicionado duration_minutes para ser consistente
type ServiceData = { id: number; name: string; price: number; duration_minutes: number; }; 
type NotificationItem = { id: number; message: string; is_read: boolean; created_at: string; type: string }; 

type AppointmentItem = {
    id: number;
    start_time: string; 
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    // Colunas de Convidado
    guest_name: string | null; 
    guest_phone: string | null;
    notes: string | null;
    override_price: number | null; // NOVO CAMPO
    
    client_id: ProfileData[] | null; 
    service_id: ServiceData[] | null; // Usará o ServiceData corrigido
};

type SummaryStat = {
  label: string;
  value: string;
  icon: React.ElementType;
};

// --- Dados Mockados (adaptados) ---
const mockUser = {
  name: "Dona Maria",
  avatarUrl: "https://placehold.co/100x100/E62E7A/FFFFFF?text=M"
};


// --- Componente: Header (Ajustado para usar o Bell Component) ---
function Header({ user, manicureId }: { user: { name: string, avatarUrl: string }, manicureId: string | null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [manicureName, setManicureName] = useState(user.name);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/'); 
    }
  };

  useEffect(() => {
    async function loadProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', authUser.id)
        .single();
      
      if (profile) {
        setManicureName(profile.name);
      }
    }
    loadProfile();
  }, []);
  
  const isActive = (path: string) => typeof window !== 'undefined' && window.location.pathname === path;


  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-mani-pink-600">ManiHelp</h1>
            <nav className="hidden md:flex space-x-6">
              <a href="/dashboard" 
                 className={`font-medium px-1 py-2 text-sm transition ${isActive('/dashboard') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Calendar className="inline-block w-5 h-5 mr-1" />
                Agenda
              </a>
              <a href="/clients" 
                 className={`font-medium px-1 py-2 text-sm transition ${isActive('/clients') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Users className="inline-block w-5 h-5 mr-1" />
                Clientes
              </a>
              <a href="/services" 
                 className={`font-medium px-1 py-2 text-sm transition ${isActive('/services') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Briefcase className="inline-block w-5 h-5 mr-1" />
                Serviços
              </a>
              <a href="/schedules" 
                 className={`font-medium px-1 py-2 text-sm transition ${isActive('/schedules') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                <Clock className="inline-block w-5 h-5 mr-1" />
                Horários
              </a>
              <a href="#" 
                 className={`font-medium px-1 py-2 text-sm transition text-gray-400 cursor-not-allowed`}
                 title="Recurso em desenvolvimento"
              >
                <BarChart3 className="inline-block w-5 h-5 mr-1" />
                <Lock className="inline-block w-4 h-4 mr-1" /> 
                Relatórios
              </a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* COMPONENTE BELL ATIVO */}
            {manicureId && <NotificationBell manicureId={manicureId} />} 

            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 rounded-full p-1 pr-2 hover:bg-gray-100">
                <img 
                  className="w-8 h-8 rounded-full object-cover" 
                  src={user.avatarUrl}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src="https://placehold.co/100x100/E62E7A/FFFFFF?text=M"; }}
                />
                <span className="hidden sm:inline font-medium text-sm text-gray-700">{manicureName}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-20">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="inline-block w-4 h-4 mr-2" />
                    Configurações
                  </a>
                  <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="inline-block w-4 h-4 mr-2" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


// --- Funções Auxiliares de Dados (Atualizadas) ---
const getClientName = (appt: AppointmentItem) => appt.client_id ? appt.client_id[0]?.name : appt.guest_name || 'Cliente (Convidado)';
const getServiceName = (appt: AppointmentItem) => appt.service_id && appt.service_id[0] ? appt.service_id[0].name : 'Serviço Removido';
// CORREÇÃO: Função que checa o preço customizado (override)
const getPrice = (appt: AppointmentItem) => {
    // 1. Se override_price existir, use-o.
    if (appt.override_price !== null) {
        return appt.override_price;
    }
    // 2. Senão, use o preço do serviço.
    if (appt.service_id && appt.service_id[0]) {
        return appt.service_id[0].price;
    }
    // 3. Senão, 0.
    return 0;
};


// --- Componente: UpcomingAppointments (Agendamentos de Hoje) ---
function UpcomingAppointments({ appointments, isLoading, error, onShowDetails }: { 
    appointments: AppointmentItem[], 
    isLoading: boolean, 
    error: string | null,
    onShowDetails: (appt: AppointmentItem) => void 
}) {

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
                {/* BOTÃO ATIVADO */}
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

      <div className="p-6 bg-gray-50 text-center">
         <a href="#" className="text-sm font-medium text-mani-pink-600 hover:text-mani-pink-800">
            Ver agenda completa
          </a>
      </div>
    </div>
  );
}


// --- Componente: PendingAppointmentsCard (Novo) ---
function PendingAppointmentsCard({ appointments, onConfirm, isConfirming, onShowDetails }: { 
    appointments: AppointmentItem[], 
    onConfirm: (id: number) => void, 
    isConfirming: number | null,
    onShowDetails: (appt: AppointmentItem) => void
}) {
    
    const getClientName = (appt: AppointmentItem) => appt.client_id && appt.client_id[0] ? appt.client_id[0].name : appt.guest_name || 'Cliente (Convidado)';
    const getServiceName = (appt: AppointmentItem) => appt.service_id && appt.service_id[0] ? appt.service_id[0].name : 'Serviço Removido';

    // Filtra agendamentos PENDENTES E FUTUROS
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
                                {/* BOTÃO DE DETALHES */}
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-mani-pink-600 animate-spin" />
        <p className="ml-3 text-gray-600">Verificando autenticação...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <Header user={mockUser} manicureId={manicureId} />

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