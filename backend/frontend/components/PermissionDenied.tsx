import React from 'react';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

interface PermissionDeniedProps {
  resource?: string;
  action?: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

// Componentes UI simples
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pb-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "default", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline";
  className?: string;
}) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium text-sm transition-colors";
  const variantClasses = variant === "outline" 
    ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" 
    : "bg-blue-600 text-white hover:bg-blue-700";
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  resource,
  action,
  message,
  showBackButton = true,
  showHomeButton = true
}) => {
  const defaultMessage = resource && action 
    ? `Você não tem permissão para ${action} em ${resource}.`
    : 'Você não tem permissão para acessar este recurso.';

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <ShieldX className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-red-600">
            Acesso Negado
          </CardTitle>
          <CardDescription className="text-base">
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Entre em contato com o administrador do sistema para solicitar as permissões necessárias.
            </p>
            
            {(resource || action) && (
              <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500">
                <div className="space-y-1">
                  {resource && (
                    <div>
                      <span className="font-medium">Recurso:</span> {resource}
                    </div>
                  )}
                  {action && (
                    <div>
                      <span className="font-medium">Ação:</span> {action}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              {showBackButton && (
                <Button 
                  variant="outline" 
                  onClick={handleGoBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              )}
              
              {showHomeButton && (
                <Button 
                  onClick={handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Ir para Início
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};