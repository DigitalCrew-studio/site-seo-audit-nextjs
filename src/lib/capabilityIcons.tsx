"use client";

import {
  Activity,
  BarChart3,
  Building2,
  Camera,
  Eye,
  FileSearch,
  Gauge,
  Globe2,
  Link2,
  Map as MapIcon,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type CapabilityIconKey =
  | "shield"
  | "fileSearch"
  | "map"
  | "link"
  | "barChart"
  | "camera"
  | "gauge"
  | "activity"
  | "building"
  | "eye"
  | "globe";

export const CAPABILITY_ICONS: Record<CapabilityIconKey, LucideIcon> = {
  shield: ShieldCheck,
  fileSearch: FileSearch,
  map: MapIcon,
  link: Link2,
  barChart: BarChart3,
  camera: Camera,
  gauge: Gauge,
  activity: Activity,
  building: Building2,
  eye: Eye,
  globe: Globe2,
};
