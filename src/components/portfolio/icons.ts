import {
  BedDouble,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Bus,
  CalendarDays,
  CalendarHeart,
  Church,
  Flower2,
  Globe,
  GraduationCap,
  HardHat,
  HeartHandshake,
  Landmark,
  Layers,
  LayoutDashboard,
  Megaphone,
  Microscope,
  Plane,
  Scale,
  Scissors,
  Server,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sofa,
  Truck,
  Users,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { WorkKind } from "@/data/work";

/**
 * The icon vocabulary for kinds of work and for sectors. Pure and client
 * safe: only lucide components and string keys.
 */

export const KIND_ICON: Record<WorkKind, LucideIcon> = {
  system: Server,
  website: Globe,
  ecommerce: ShoppingCart,
  mobile: Smartphone,
};

const SECTOR_ICON: Record<string, LucideIcon> = {
  Hospitality: BedDouble,
  "Charity and NGOs": HeartHandshake,
  "Retail and e-commerce": ShoppingBag,
  Construction: HardHat,
  Logistics: Truck,
  "Real estate": Building2,
  Transport: Bus,
  Education: GraduationCap,
  Travel: Plane,
  Beauty: Scissors,
  Cybersecurity: ShieldCheck,
  Energy: Zap,
  Events: CalendarDays,
  "Events and NGOs": CalendarHeart,
  Finance: Landmark,
  Food: Utensils,
  Furniture: Sofa,
  "Internal operations": LayoutDashboard,
  "Landscaping and florals": Flower2,
  Legal: Scale,
  Media: Megaphone,
  "Media and faith": Church,
  "Professional services": Briefcase,
  Property: Building,
  Publishing: BookOpen,
  Research: Microscope,
  Services: Users,
};

/** The icon for a sector label, with a neutral fallback for any new sector. */
export function sectorIcon(sector: string): LucideIcon {
  return SECTOR_ICON[sector] ?? Layers;
}
