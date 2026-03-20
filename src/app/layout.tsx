import './globals.css';
import { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedLayout from '@/components/Layout/ProtectedLayout';

export const metadata: Metadata = {
  title: 'Gestión Válvulas PSV/PRV CMMS',
  description: 'Sistema de Integridad Mecánica y Calibración de Válvulas de Seguridad',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <AuthProvider>
        <body>
          <ProtectedLayout>
            {children}
          </ProtectedLayout>
        </body>
      </AuthProvider>
    </html>
  );
}
