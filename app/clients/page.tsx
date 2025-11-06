// Nome do arquivo: app/clients/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// CORREÇÃO: Adicionado Bell e outros ícones necessários para o Header
import { supabase } from '../../lib/supabaseClient';
import ClientList from '../../components/ClientList';
import { Loader2, Users, AlertTriangle, Calendar, LogOut, ChevronDown, BarChart3, Settings, Bell } from 'lucide-react';

// --- Tipos ---
type ManicureProfile = {
    id: string;
    name: string;
};

// --- Componente Principal ---
export default function ClientsPage() {
    const router = useRouter();
    const [manicureProfile, setManicureProfile] = useState<ManicureProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Simula o mockUser do Dashboard (usado para o Header)
    const mockUser = {
        name: "Dona Maria",
        avatarUrl: "https://placehold.co/100x100/E62E7A/FFFFFF?text=M"
    };

    // 1. CARREGAMENTO E AUTORIZAÇÃO
    useEffect(() => {
        async function checkAuthAndRole() {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                router.replace('/'); 
                return;
            }
            
            // Verifica o perfil e a role
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, name, role')
                .eq('id', user.id)
                .single();
            
            if (error || profile?.role !== 'manicure') {
                await supabase.auth.signOut();
                router.replace('/');
                return;
            }

            setManicureProfile({ id: profile.id, name: profile.name });
            setIsLoading(false);
        }
        checkAuthAndRole();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                router.replace('/');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    if (isLoading || !manicureProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 text-mani-pink-600 animate-spin" />
                <p className="ml-3 text-gray-600">Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-inter">
            {/* Usamos o Header do dashboard aqui, garantindo o link de navegação */}
            <Header user={mockUser} /> 

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Users className="w-7 h-7 mr-3 text-mani-pink-600" />
                        Seus Clientes
                    </h1>
                    <p className="text-lg text-gray-600 mt-1">
                        Gerencie a base de clientes do ManiHelp.
                    </p>
                </div>

                {/* Componente de Lista e Busca */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <ClientList manicureId={manicureProfile.id} />
                </div>
            </main>
        </div>
    );
}

// Reutiliza o componente Header do Dashboard para manter a navegação
function Header({ user }: any) {
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
        // Busca o nome real para o Header
        async function loadProfileName() {
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
        loadProfileName();
    }, []);
    
    // Função para determinar se o link está ativo (usando o objeto window/location)
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
                            {/* LINK CLIENTES: Ativado e estilizado se ativo */}
                            <a href="/clients" 
                                className={`font-medium px-1 py-2 text-sm transition ${isActive('/clients') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Users className="inline-block w-5 h-5 mr-1" />
                                Clientes
                            </a>
                            <a href="/reports" 
                                className={`font-medium px-1 py-2 text-sm transition ${isActive('/reports') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <BarChart3 className="inline-block w-5 h-5 mr-1" />
                                Relatórios
                            </a>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Menu de Notificação e Perfil */}
                         <button className="text-gray-400 hover:text-gray-500 rounded-full p-1 relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-mani-pink-500 ring-2 ring-white" />
                        </button>
                        
                        <div className="relative">
                            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 rounded-full p-1 pr-2 hover:bg-gray-100">
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