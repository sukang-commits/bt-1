import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Coffee,
  Home,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Repeat2,
  ShieldCheck,
  Star,
  Store,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

// icon은 컴포넌트가 아닌 문자열 key로만 저장합니다. 서버 컴포넌트(layout.tsx)에서
// 만든 메뉴 데이터를 클라이언트 컴포넌트(Sidebar 등)로 넘길 때, 함수(아이콘 컴포넌트)는
// RSC 경계를 직렬화해 넘길 수 없기 때문입니다. 실제 아이콘 컴포넌트로의 변환은
// 클라이언트 컴포넌트 쪽에서 MENU_ICONS로 조회합니다.
export type IconKey =
  | "home"
  | "megaphone"
  | "checklist"
  | "receipt"
  | "coffee"
  | "users"
  | "award"
  | "trending-up"
  | "layout-dashboard"
  | "store"
  | "repeat"
  | "checklist-list"
  | "bar-chart"
  | "star"
  | "trophy"
  | "shield-check";

export const MENU_ICONS: Record<IconKey, LucideIcon> = {
  home: Home,
  megaphone: Megaphone,
  checklist: ClipboardCheck,
  receipt: Receipt,
  coffee: Coffee,
  users: Users,
  award: Award,
  "trending-up": TrendingUp,
  "layout-dashboard": LayoutDashboard,
  store: Store,
  repeat: Repeat2,
  "checklist-list": ClipboardList,
  "bar-chart": BarChart3,
  star: Star,
  trophy: Trophy,
  "shield-check": ShieldCheck,
};

export interface MenuItem {
  key: string;
  label: string;
  href: string;
  icon: IconKey;
  primary?: boolean;
}

export function getWorkerMenu(storeId: string): MenuItem[] {
  const base = `/stores/${storeId}`;
  return [
    { key: "home", label: "홈", href: base, icon: "home", primary: true },
    { key: "notices", label: "공지", href: `${base}/notices`, icon: "megaphone" },
    {
      key: "checklist",
      label: "업무체크",
      href: `${base}/checklist`,
      icon: "checklist",
      primary: true,
    },
    {
      key: "settlements",
      label: "정산인증",
      href: `${base}/settlements`,
      icon: "receipt",
      primary: true,
    },
    { key: "breaks", label: "휴게인증", href: `${base}/breaks`, icon: "coffee" },
    {
      key: "shift-cover",
      label: "대타구하기",
      href: `${base}/shift-cover`,
      icon: "users",
      primary: true,
    },
    { key: "my-rank", label: "내 등급", href: `${base}/my-rank`, icon: "award" },
    {
      key: "my-performance",
      label: "내 수행도",
      href: `${base}/my-performance`,
      icon: "trending-up",
    },
  ];
}

export const ADMIN_MENU: MenuItem[] = [
  {
    key: "overview",
    label: "통합현황",
    href: "/admin",
    icon: "layout-dashboard",
    primary: true,
  },
  {
    key: "stores",
    label: "매장관리",
    href: "/admin/stores",
    icon: "store",
    primary: true,
  },
  { key: "notices", label: "공지관리", href: "/admin/notices", icon: "megaphone" },
  { key: "settlements", label: "정산관리", href: "/admin/settlements", icon: "receipt" },
  { key: "breaks", label: "휴게관리", href: "/admin/breaks", icon: "coffee" },
  { key: "shift-cover", label: "대타관리", href: "/admin/shift-cover", icon: "repeat" },
  {
    key: "checklists",
    label: "체크리스트 관리",
    href: "/admin/checklists",
    icon: "checklist-list",
    primary: true,
  },
  { key: "ranks", label: "등급관리", href: "/admin/ranks", icon: "award" },
  {
    key: "weekly-performance",
    label: "주간수행도",
    href: "/admin/weekly-performance",
    icon: "bar-chart",
  },
  {
    key: "monthly-achievement",
    label: "월 달성률",
    href: "/admin/monthly-achievement",
    icon: "trending-up",
  },
  { key: "qsc", label: "QSC 관리", href: "/admin/qsc", icon: "star" },
  {
    key: "scores",
    label: "종합점수",
    href: "/admin/scores",
    icon: "trophy",
    primary: true,
  },
  {
    key: "accounts",
    label: "계정 및 권한관리",
    href: "/admin/accounts",
    icon: "shield-check",
  },
];
