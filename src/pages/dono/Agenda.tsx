import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Settings,
  DollarSign,
  FileText,
  Building2,
  Mail,
  Users,
  UserCheck,
  ChevronDown,
  Star,
  Gift,
  MessageSquareX,
  Cake,
  Package,
  Ticket,
  Laptop,
  Smartphone,
  Facebook,
  MapPin,
  User,
  Menu,
  Star as StarIcon,
} from "lucide-react";
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "dia" | "semana" | "mes";
type AppointmentStatus = 
  | "agendado" 
  | "realizado" 
  | "sem_cadastro" 
  | "ausencia" 
  | "bloqueado" 
  | "encaixe" 
  | "confirmado" 
  | "sem_preferencia" 
  | "no_local";

type AppointmentOrigin = 
  | "sistema" 
  | "ios" 
  | "android" 
  | "site_facebook" 
  | "totem" 
  | "profissional" 
  | "cliente";

interface Appointment {
  id: string;
  profissional: string;
  cliente: string;
  horarioInicio: string;
  horarioFim: string;
  status: AppointmentStatus;
  origem?: AppointmentOrigin;
  isAniversariante?: boolean;
  isPacote?: boolean;
  temCupom?: boolean;
  pagoIntegracao?: boolean;
  isAssinante?: boolean;
  isInadimplente?: boolean;
}

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("dia");
  const [selectedProfissional, setSelectedProfissional] = useState("BRUNO");
  const [bloquearHorario, setBloquearHorario] = useState(false);

  // Horários do dia (15 em 15 minutos)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Agendamentos de exemplo
  const appointments: Appointment[] = [
    {
      id: "1",
      profissional: "BRUNO",
      cliente: "João Silva",
      horarioInicio: "07:00",
      horarioFim: "09:00",
      status: "bloqueado",
    },
    {
      id: "2",
      profissional: "BRUNO",
      cliente: "Maria Santos",
      horarioInicio: "10:00",
      horarioFim: "10:30",
      status: "agendado",
      origem: "sistema",
    },
  ];

  const navigateDate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentDate(subDays(currentDate, viewMode === "dia" ? 1 : viewMode === "semana" ? 7 : 30));
    } else {
      setCurrentDate(addDays(currentDate, viewMode === "dia" ? 1 : viewMode === "semana" ? 7 : 30));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: AppointmentStatus) => {
    const colors: Record<AppointmentStatus, string> = {
      agendado: "bg-orange-200 text-orange-800",
      realizado: "bg-green-200 text-green-800",
      sem_cadastro: "bg-orange-300 text-orange-900",
      ausencia: "bg-red-200 text-red-800",
      bloqueado: "bg-amber-700 text-white",
      encaixe: "bg-gray-600 text-white",
      confirmado: "bg-purple-200 text-purple-800",
      sem_preferencia: "bg-purple-300 text-purple-900",
      no_local: "bg-red-300 text-red-900",
    };
    return colors[status] || "bg-gray-200 text-gray-800";
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    const labels: Record<AppointmentStatus, string> = {
      agendado: "Agendado",
      realizado: "Realizado",
      sem_cadastro: "Sem Cadastro",
      ausencia: "Ausência",
      bloqueado: "Bloqueado",
      encaixe: "Encaixe",
      confirmado: "Confirmado",
      sem_preferencia: "Sem Preferência",
      no_local: "No Local",
    };
    return labels[status];
  };

  const getOriginIcon = (origin?: AppointmentOrigin) => {
    const icons: Record<AppointmentOrigin, any> = {
      sistema: Laptop,
      ios: Smartphone,
      android: Smartphone,
      site_facebook: Facebook,
      totem: MapPin,
      profissional: Building2,
      cliente: User,
    };
    return origin ? icons[origin] : null;
  };

  const formatDate = (date: Date) => {
    return format(date, "EEEE, d/MMM/yyyy", { locale: ptBR });
  };

  // Calendário mensal - primeira semana do mês
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
  const endCalendar = endOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startCalendar, end: endCalendar });

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-background -m-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            + Encaixe
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "dia" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("dia")}
          >
            Dia
          </Button>
          <Button
            variant={viewMode === "semana" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("semana")}
          >
            Semana
          </Button>
          <Button
            variant={viewMode === "mes" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("mes")}
          >
            Mês
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex">
            {/* Time Column */}
            <div className="w-20 flex-shrink-0">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-16 border-b border-gray-200 text-xs text-gray-600 px-2"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Appointments Column */}
            <div className="flex-1 relative min-h-[960px]">
              {appointments
                .filter((apt) => apt.profissional === selectedProfissional)
                .map((appointment) => {
                  const startIndex = timeSlots.indexOf(appointment.horarioInicio);
                  const endIndex = timeSlots.indexOf(appointment.horarioFim);
                  
                  if (startIndex === -1 || endIndex === -1) return null;
                  
                  const duration = endIndex - startIndex;
                  const top = startIndex * 64; // 64px por slot (h-16)

                  return (
                    <div
                      key={appointment.id}
                      className={`absolute left-0 right-4 rounded p-2 ${getStatusColor(appointment.status)} border-l-4 border-l-gray-800`}
                      style={{
                        top: `${top}px`,
                        height: `${duration * 64}px`,
                        minHeight: '64px',
                      }}
                    >
                      <div className="font-semibold text-sm mb-1">{appointment.cliente}</div>
                      <div className="text-xs opacity-90">{appointment.horarioInicio} - {appointment.horarioFim}</div>
                      {appointment.origem && (
                        <div className="mt-1">
                          {(() => {
                            const Icon = getOriginIcon(appointment.origem);
                            return Icon ? <Icon className="h-3 w-3" /> : null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l bg-white p-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bloquear"
                checked={bloquearHorario}
                onCheckedChange={(checked) => setBloquearHorario(checked === true)}
              />
              <label htmlFor="bloquear" className="text-sm font-medium">
                Bloquear Horario
              </label>
            </div>

            {/* Calendar Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa"].map((day) => (
                    <div key={day} className="text-center font-semibold text-gray-600">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`text-center p-1 rounded ${
                        isSameDay(day, currentDate)
                          ? "bg-blue-500 text-white"
                          : day.getDate() === 12
                          ? "bg-yellow-200"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Horários disponíveis
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Lista de Agendamentos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Lista de Espera
              </Button>
            </div>

            <Collapsible>
              <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                <span className="font-medium">Produtos / Serviços</span>
                <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2">
                <p className="text-sm text-gray-600">Conteúdo dos produtos e serviços...</p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t bg-white p-4 flex-shrink-0 overflow-y-auto max-h-64">
        {/* Professional Selector */}
        <div className="flex items-center gap-4 mb-4">
          <Menu className="h-5 w-5 text-gray-600" />
          <StarIcon className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium">Profissionais:</span>
          <Select value={selectedProfissional} onValueChange={setSelectedProfissional}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRUNO">BRUNO</SelectItem>
              <SelectItem value="CARLOS">CARLOS</SelectItem>
              <SelectItem value="PEDRO">PEDRO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Icons Menu */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon">
            <DollarSign className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <FileText className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Building2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Mail className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
              5
            </Badge>
          </Button>
          <Button variant="ghost" size="icon">
            <Users className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <UserCheck className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Status Legend */}
        <div className="grid grid-cols-9 gap-2 mb-4">
          {(["agendado", "realizado", "sem_cadastro", "ausencia", "bloqueado", "encaixe", "confirmado", "sem_preferencia", "no_local"] as AppointmentStatus[]).map((status) => (
            <Badge key={status} className={`${getStatusColor(status)} text-xs justify-center`}>
              {getStatusLabel(status)}
            </Badge>
          ))}
        </div>

        {/* Client Preferences */}
        <div className="flex items-center gap-6 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <MessageSquareX className="h-4 w-4" />
            <span>Cliente não deseja conversar</span>
          </div>
          <div className="flex items-center gap-2">
            <Cake className="h-4 w-4" />
            <span>Aniversariante</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Agendamento de pacote</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span>Cupom de desconto aplicado</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Pago via integração</span>
          </div>
        </div>

        {/* Appointment Origins */}
        <div className="flex items-center gap-6 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            <span>Agendamento feito via sistema</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>Agendamento feito via app IOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>Agendamento feito via app Android</span>
          </div>
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            <span>Agendamento feito via Site/Facebook</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Agendamento feito via Totem</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Agendado por profissional</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Agendado por cliente</span>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>Clube de Assinaturas</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-red-500" />
            <span>Assinante Inadimplente</span>
          </div>
        </div>

        {/* Caixa Button */}
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white h-16 w-24 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold">Caixa</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
