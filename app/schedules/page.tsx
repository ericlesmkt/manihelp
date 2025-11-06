// Nome do arquivo: app/schedules/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
// CORREÇÃO: Adicionado Users, Bell, LogOut, ChevronDown, BarChart3, Settings, Lock
import { Loader2, Calendar, Clock, X, Plus, Trash2, Users, AlertTriangle, LogOut, ChevronDown, BarChart3, Settings, Bell, Lock } from 'lucide-react';

// --- Tipos de Dados ---
type ManicureProfile = { id: string; name: string; };

type ScheduleItem = {
    id: number;
    day_of_week: number;
    start_time: string; // Ex: "09:00:00"
    end_time: string;   // Ex: "18:00:00"
};

// --- Constantes ---
const DaysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// --- Componente Principal ---
export default function SchedulesPage() {
    const router = useRouter();
    const [manicureProfile, setManicureProfile] = useState<ManicureProfile | null>(null);
    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newSchedule, setNewSchedule] = useState({ day: 1, start: '09:00', end: '18:00' });
    
    const mockUser = {
        name: "Dona Maria",
        avatarUrl: "https://placehold.co/100x100/E62E7A/FFFFFF?text=M"
    };

    // Função de Busca de Horários
    const fetchSchedules = useCallback(async (id: string) => {
        setError(null);
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('manicure_id', id)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw new Error(error.message);
            setSchedules(data as ScheduleItem[]);
        } catch (e: any) {
            setError('Falha ao carregar horários: ' + e.message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 1. CARREGAMENTO E AUTORIZAÇÃO
    useEffect(() => {
        async function checkAuthAndLoadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/'); 
                return;
            }
            
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
            fetchSchedules(user.id);
        }
        checkAuthAndLoadProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') router.replace('/');
        });
        return () => subscription.unsubscribe();
    }, [router, fetchSchedules]);


    // Adicionar Novo Horário
    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        if (!manicureProfile || !newSchedule.start || !newSchedule.end) {
             setError('Preencha todos os campos.');
             setIsSaving(false);
             return;
        }

        const newEntry = {
            manicure_id: manicureProfile.id,
            day_of_week: newSchedule.day,
            start_time: `${newSchedule.start}:00`,
            end_time: `${newSchedule.end}:00`,
        };

        try {
            const { error: insertError } = await supabase
                .from('schedules')
                .insert([newEntry]);
            
            if (insertError) {
                if (insertError.code === '23505') { 
                    throw new Error('Você já tem um horário cadastrado para este dia da semana.');
                }
                throw new Error(insertError.message);
            }
            
            setNewSchedule({ day: 1, start: '09:00', end: '18:00' });
            fetchSchedules(manicureProfile.id); // Atualiza a lista
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Remover Horário
    const handleDeleteSchedule = async (id: number) => {
        // NOTA: substitua alert/confirm por um modal customizado no futuro
        if (!manicureProfile || !confirm('Tem certeza que deseja excluir este horário?')) return;
        
        setIsSaving(true);
        setError(null);
        try {
            const { error: deleteError } = await supabase
                .from('schedules')
                .delete()
                .eq('id', id);

            if (deleteError) throw new Error(deleteError.message);
            
            fetchSchedules(manicureProfile.id); // Atualiza a lista
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !manicureProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 text-mani-pink-600 animate-spin" />
                <p className="ml-3 text-gray-600">Carregando horários...</p>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-100 font-inter">
            <Header user={mockUser} /> 

            <main className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
                
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Clock className="w-7 h-7 mr-3 text-mani-pink-600" />
                        Agenda Fixa Semanal
                    </h1>
                    <p className="text-lg text-gray-600 mt-1">
                        Defina seus dias e horários de trabalho para que seus clientes possam agendar.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* Seção de Adicionar Novo Horário */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Adicionar Novo Bloco
                    </h2>
                    <form onSubmit={handleAddSchedule} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        {/* Dia da Semana */}
                        <div className="col-span-2 md:col-span-1">
                            <label htmlFor="day" className="block text-sm font-medium text-gray-700">Dia</label>
                            <select 
                                id="day"
                                value={newSchedule.day}
                                onChange={(e) => setNewSchedule({...newSchedule, day: Number(e.target.value)})}
                                className="mt-1 w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                            >
                                {DaysOfWeek.map((day, index) => (
                                    <option key={index} value={index}>{day}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Início */}
                        <div>
                            <label htmlFor="start" className="block text-sm font-medium text-gray-700">Início</label>
                            <input 
                                type="time"
                                id="start"
                                value={newSchedule.start}
                                onChange={(e) => setNewSchedule({...newSchedule, start: e.target.value})}
                                required
                                className="mt-1 w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                            />
                        </div>
                        
                        {/* Fim */}
                        <div>
                            <label htmlFor="end" className="block text-sm font-medium text-gray-700">Fim</label>
                            <input 
                                type="time"
                                id="end"
                                value={newSchedule.end}
                                onChange={(e) => setNewSchedule({...newSchedule, end: e.target.value})}
                                required
                                className="mt-1 w-full py-2 px-3 border border-gray-300 rounded-lg shadow-sm focus:ring-mani-pink-500 focus:border-mani-pink-500"
                            />
                        </div>
                        
                        {/* Botão Salvar */}
                        <div className="col-span-2 md:col-span-1">
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-2 px-4 bg-mani-pink-600 text-white font-semibold rounded-lg shadow-md hover:bg-mani-pink-700 transition disabled:opacity-50 flex items-center justify-center"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>


                {/* Seção de Horários Cadastrados */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Horários Fixos Cadastrados</h2>
                    {schedules.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                             Nenhum horário cadastrado. Comece adicionando um!
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {schedules.map((schedule) => (
                                <li key={schedule.id} className="py-3 flex justify-between items-center">
                                    {/* Informações */}
                                    <div className="flex items-center space-x-4">
                                        <div className="font-bold text-gray-900 w-24 flex-shrink-0">
                                            {DaysOfWeek[schedule.day_of_week]}
                                        </div>
                                        <div className="text-gray-600">
                                            {schedule.start_time.substring(0, 5)} até {schedule.end_time.substring(0, 5)}
                                        </div>
                                    </div>
                                    
                                    {/* Ações */}
                                    <div>
                                        <button 
                                            // NOTA: Substitua confirm por um modal customizado
                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                            disabled={isSaving}
                                            className="text-red-500 hover:text-red-700 disabled:text-gray-400 p-2 transition"
                                            title="Excluir Horário"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}

// Reutiliza o componente Header para manter a navegação (necessário para o TS)
function Header({ user }: any) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [manicureName, setManicureName] = useState(user.name);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) router.replace('/');
    };

    useEffect(() => {
        async function loadProfileName() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', authUser.id)
                .single();
            if (profile) setManicureName(profile.name);
        }
        loadProfileName();
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
                             {/* LINK DE HORÁRIOS */}
                             <a href="/schedules" 
                                className={`font-medium px-1 py-2 text-sm transition ${isActive('/schedules') ? 'text-mani-pink-600 border-b-2 border-mani-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                                <Clock className="inline-block w-5 h-5 mr-1" />
                                Horários
                            </a>
                             {/* LINK DE RELATÓRIOS (FEATURE) */}
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