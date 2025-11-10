// Nome do arquivo: components/ManicureHeader.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import NotificationBell from './NotificationBell'; // Importa o Sino
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Bell, 
  ChevronDown, 
  LogOut, 
  Clock,
  Lock,
  Briefcase
} from 'lucide-react';

// --- Propriedades ---
interface ManicureHeaderProps {
    mockUser: { // Usamos o mockUser para o avatar enquanto o perfil não carrega
        name: string;
        avatarUrl: string;
    };
}

export default function ManicureHeader({ mockUser }: ManicureHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [manicureName, setManicureName] = useState(mockUser.name);
  const [manicureId, setManicureId] = useState<string | null>(null);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/'); 
    }
  };

  // Carrega o ID e Nome da Manicure (para o Sino e para o Nome)
  useEffect(() => {
    async function loadProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      
      setManicureId(authUser.id); // Define o ID para o Bell

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
  
  const isActive = (path: string) => typeof window !== 'undefined' && window.location.pathname.startsWith(path);


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
            {/* COMPONENTE BELL ATIVO E CENTRALIZADO */}
            {manicureId && <NotificationBell manicureId={manicureId} />} 

            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 rounded-full p-1 pr-2 hover:bg-gray-100">
                <img 
                  className="w-8 h-8 rounded-full object-cover" 
                  src={mockUser.avatarUrl}
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