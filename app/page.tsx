// app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Por enquanto, apenas redireciona para o dashboard.
  // No futuro, esta será sua tela de Login.
  redirect('/dashboard');
}
