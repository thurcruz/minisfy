import {
  Banknote,
  BookOpen,
  Boxes,
  Building2,
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumn,
  Church,
  Cog,
  Contact,
  Fingerprint,
  Gauge,
  GraduationCap,
  HandHeart,
  Heart,
  HeartHandshake,
  Home,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  Package,
  Plug,
  Send,
  Shield,
  Sparkles,
  Users,
  UserPlus,
  UsersRound,
  Wrench,
  Workflow,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** `ready` abre a tela; `planned` abre a página de status da fase. */
  status: "ready" | "planned";
  /** Fase do plano em docs/04-PLANO.md */
  phase?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { label: "Dashboard", href: "/", icon: Home, status: "ready" },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { label: "Membros", href: "/membros", icon: Users, status: "ready" },
      { label: "Visitantes", href: "/visitantes", icon: UserPlus, status: "ready" },
      { label: "Famílias", href: "/familias", icon: Contact, status: "planned", phase: "Fase 2" },
      { label: "Discipulado", href: "/discipulado", icon: HeartHandshake, status: "planned", phase: "Fase 7" },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { label: "Pequenos grupos", href: "/grupos", icon: UsersRound, status: "ready" },
      { label: "Ministérios", href: "/ministerios", icon: Church, status: "ready" },
      { label: "Escalas", href: "/escalas", icon: CalendarRange, status: "ready" },
      { label: "Voluntários", href: "/voluntarios", icon: HandHeart, status: "planned", phase: "Fase 5" },
    ],
  },
  {
    label: "Programação",
    items: [
      { label: "Agenda", href: "/agenda", icon: CalendarDays, status: "ready" },
      { label: "Cultos", href: "/cultos", icon: Church, status: "planned", phase: "Fase 4" },
      { label: "Eventos", href: "/eventos", icon: Sparkles, status: "planned", phase: "Fase 4" },
      { label: "Reservas", href: "/reservas", icon: Building2, status: "planned", phase: "Fase 4" },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Financeiro", href: "/financeiro", icon: Banknote, status: "ready" },
      { label: "Patrimônio", href: "/patrimonio", icon: Package, status: "planned", phase: "Fase 10" },
      { label: "Estoque", href: "/estoque", icon: Boxes, status: "planned", phase: "Fase 10" },
      { label: "Infraestrutura", href: "/infraestrutura", icon: Wrench, status: "planned", phase: "Fase 10" },
    ],
  },
  {
    label: "Cuidado e ensino",
    items: [
      { label: "Gestão pastoral", href: "/pastoral", icon: Heart, status: "planned", phase: "Fase 7" },
      { label: "Pedidos de oração", href: "/oracao", icon: HandHeart, status: "planned", phase: "Fase 7" },
      { label: "Escola bíblica", href: "/escola-biblica", icon: BookOpen, status: "planned", phase: "Fase 7" },
      { label: "Cursos", href: "/cursos", icon: GraduationCap, status: "planned", phase: "Fase 7" },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { label: "Comunicados", href: "/comunicados", icon: Megaphone, status: "planned", phase: "Fase 9" },
      { label: "Mensagens", href: "/mensagens", icon: MessageSquare, status: "planned", phase: "Fase 9" },
      { label: "Campanhas", href: "/campanhas", icon: Send, status: "planned", phase: "Fase 9" },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { label: "Relatórios", href: "/relatorios", icon: ChartNoAxesColumn, status: "planned", phase: "Fase 11" },
      { label: "Minisfy Intelligence", href: "/intelligence", icon: Sparkles, status: "planned", phase: "Fase 11" },
      { label: "Minisfy Flow", href: "/flow", icon: Workflow, status: "planned", phase: "Fase 11" },
    ],
  },
  {
    label: "Configurações",
    items: [
      { label: "Organização", href: "/config/organizacao", icon: Building2, status: "planned", phase: "Fase 1" },
      { label: "Unidades", href: "/config/unidades", icon: Church, status: "planned", phase: "Fase 1" },
      { label: "Usuários", href: "/config/usuarios", icon: Users, status: "planned", phase: "Fase 1" },
      { label: "Funções e permissões", href: "/config/permissoes", icon: Shield, status: "planned", phase: "Fase 1" },
      { label: "Minisfy Pass", href: "/config/pass", icon: Fingerprint, status: "planned", phase: "Fase 8" },
      { label: "Integrações", href: "/config/integracoes", icon: Plug, status: "planned", phase: "Fase 11" },
      { label: "Preferências", href: "/config/preferencias", icon: Cog, status: "planned", phase: "Fase 1" },
    ],
  },
];

export const READY_COUNT = navigation
  .flatMap((g) => g.items)
  .filter((i) => i.status === "ready").length;

export const TOTAL_COUNT = navigation.flatMap((g) => g.items).length;

export { Gauge };
