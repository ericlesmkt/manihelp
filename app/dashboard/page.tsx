"use client"; // Obrigatório! Estamos usando useState para o dropdown.

import React, { useState } from 'react';
// Ícones: npm install lucide-react
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
  Clock
} from 'lucide-react';

// --- Tipos (Já que estamos usando TypeScript) ---
type User = {
  name: string;
  avatarUrl: string;
};

type Appointment = {
  id: number;
  client: string;
  service: string;
  time: string;
  status: 'confirmed' | 'pending';
};

type SummaryStat = {
  label: string;
  value: string;
};

// --- Dados Mockados ---
const mockUser: User = {
  name: "Dona Maria", // A mãe!
  avatarUrl: "https://placehold.co/100x100/E9D5FF/4C1D95?text=M"
};

const mockAppointments: Appointment[] = [
  { id: 1, client: "Ana Silva", service: "Mão e Pé", time: "10:30", status: "confirmed" },
  { id: 2, client: "Beatriz Costa", service: "Pé (Acrigel)", time: "11:45", status: "confirmed" },
  { id: 3, client: "Carla Dias", service: "Mão", time: "14:00", status: "pending" },
  { id: 4, client: "Daniela Fernandes", service: "Spa dos Pés", time: "15:15", status: "confirmed" },
];

const mockSummary: SummaryStat[] = [
  { label: "Clientes Hoje", value: "4" },
  { label: "Receita Estimada", value: "R$ 280,00" },
  { label: "Novos Clientes (Mês)", value: "12" },
];
// -----------------------


/**
 * Componente: Header (Navegação Superior)
 */
function Header({ user }: { user: User }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Navegação Principal */}
          <div className="flex items-center space-x-8">
            {/* ATUALIZADO: Usando a nova cor 'mani-pink' */}
            <h1 className="text-2xl font-bold text-mani-pink-600">ManiHelp</h1>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="font-medium text-mani-pink-600 border-b-2 border-mani-pink-600 px-1 py-2 text-sm">
                <Calendar className="inline-block w-5 h-5 mr-1" />
                Agenda
              </a>
              <a href="#" className="font-medium text-gray-500 hover:text-gray-700 px-1 py-2 text-sm">
                <Users className="inline-block w-5 h-5 mr-1" />
                Clientes
              </a>
              <a href="#" className="font-medium text-gray-500 hover:text-gray-700 px-1 py-2 text-sm">
                <BarChart3 className="inline-block w-5 h-5 mr-1" />
                Relatórios
              </a>
            </nav>
          </div>

          {/* Menu do Usuário e Notificações */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-500 rounded-full p-1 relative">
              <Bell className="w-6 h-6" />
              {/* ATUALIZADO: Usando a nova cor 'mani-pink' */}
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-mani-pink-500 ring-2 ring-white" />
            </button>

            {/* Dropdown do Usuário */}
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 rounded-full p-1 pr-2 hover:bg-gray-100">
                <img 
                  className="w-8 h-8 rounded-full object-cover" 
                  src={user.avatarUrl}
                  alt="Avatar do usuário" 
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src="https://placehold.co/100x100/E9D5FF/4C1D95?text=M"; }}
                />
                <span className="hidden sm:inline font-medium text-sm text-gray-700">{user.name}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Menu Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 ring-1 ring-black ring-opacity-5 z-20">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="inline-block w-4 h-4 mr-2" />
                    Configurações
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="inline-block w-4 h-4 mr-2" />
                    Sair
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Componente: UpcomingAppointments (Lista de Próximos Agendamentos)
 */
function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header do Card */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Próximos Agendamentos</h2>
        <p className="text-sm text-gray-500 mt-1">Visão geral dos seus compromissos de hoje.</p>
      </div>

      {/* Lista de Agendamentos */}
      <ul className="divide-y divide-gray-200">
        {appointments.map((appt) => (
          <li key={appt.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              {/* ATUALIZADO: Usando a nova cor 'mani-pink' */}
              <div className="flex-shrink-0 w-12 h-12 bg-mani-pink-100 text-mani-pink-600 rounded-full flex items-center justify-center font-bold text-lg">
                {appt.time.split(':')[0]}h
              </div>
              <div>
                <p className="text-md font-semibold text-gray-900">{appt.client}</p>
                <p className="text-sm text-gray-600">{appt.service}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {appt.status === 'confirmed' ? (
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
               {/* ATUALIZADO: Usando a nova cor 'mani-pink' */}
               <button className="text-sm font-medium text-mani-pink-600 hover:text-mani-pink-800">
                Detalhes
               </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer do Card */}
      <div className="p-6 bg-gray-50 text-center">
         {/* ATUALIZADO: Usando a nova cor 'mani-pink' */}
         <a href="#" className="text-sm font-medium text-mani-pink-600 hover:text-mani-pink-800">
            Ver agenda completa
          </a>
      </div>
    </div>
  );
}

/**
 * Componente: SummaryCard (Cards de Resumo Rápido)
 */
function SummaryCard({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Dia</h3>
      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex justify-between items-baseline">
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Componente: DashboardPage (O Layout Principal)
 */
export default function DashboardPage() {
  return (
    /* * ATUALIZADO: 
     * Usando 'font-inter' que agora é o nosso 'font-sans' padrão
     * definido no tailwind.config
    */
    <div className="min-h-screen bg-gray-100 font-inter">
      {/* Header Fixo */}
      <Header user={mockUser} />

      {/* Conteúdo Principal da Página */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho de Boas-Vindas e Ação Rápida */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vinda de volta, {mockUser.name}!
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Você tem {mockAppointments.length} agendamentos hoje.
            </p>
          </div>
          {/* ATUALIZADO: Usando a nova cor 'mani-pink' */}
          <button className="mt-4 md:mt-0 flex items-center justify-center bg-mani-pink-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-mani-pink-700 transition-all duration-300 transform hover:scale-105">
            <Plus className="w-5 h-5 mr-2" />
            Novo Agendamento
          </button>
        </div>

        {/* Grid Principal (Agenda e Resumo) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal (Agenda) */}
          <div className="lg:col-span-2">
            <UpcomingAppointments appointments={mockAppointments} />
          </div>

          {/* Coluna Lateral (Resumo) */}
          <div className="lg:col-span-1 space-y-8">
            <SummaryCard stats={mockSummary} />
          </div>
        </div>
      </main>
    </div>
  );
}