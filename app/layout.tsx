import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Descomentando a fonte
import "./globals.css"; // Agora ele DEVE encontrar este arquivo

// Configura a fonte
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter" // Passa como variável CSS para o tailwind.config
});

export const metadata: Metadata = {
  title: "ManiHelp",
  description: "Gestão de agendamentos para manicures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* A MUDANÇA ESTÁ AQUI:
        1. inter.variable -> Define a variável CSS '--font-inter'
        2. font-inter -> Aplica a classe que criamos no tailwind.config.ts
      */}
      <body className={`${inter.variable} font-inter`}>
        {children}
      </body>
    </html>
  );
}