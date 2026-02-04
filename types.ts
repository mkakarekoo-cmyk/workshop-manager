
export enum ToolStatus {
  IN_TRANSIT = 'W DRODZE',
  OCCUPIED = 'ZAJĘTE',
  MAINTENANCE = 'KONSERWACJA',
  FREE = 'WOLNE',
  RESERVED = 'ZAREZERWOWANE'
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  email?: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  serial_number: string;
  status: ToolStatus;
  branch_id: number;
  description?: string | null;
  target_branch_id?: number | null;
  photo_path?: string | null;
  shipped_at?: string | null;
  last_maintenance?: string | null;
  current_branch?: { name: string };
  target_branch?: { name: string };
}

export interface ToolReservation {
  id: string;
  tool_id: string;
  branch_id: number;
  start_date: string;
  end_date: string;
  notes?: string;
  created_at: string;
  operator_id: string;
  tool?: { name: string };
  branch?: { name: string };
}

export interface ToolLog {
  id: string;
  tool_id: string;
  action: 'WYDANIE' | 'PRZYJĘCIE' | 'PRZESUNIĘCIE' | 'KONSERWACJA' | 'REZERWACJA' | 'ZAMÓWIENIE';
  from_branch_id?: number | null;
  to_branch_id?: number | null;
  notes: string;
  photo_url?: string | null;
  created_at: string;
  operator_id: string;
  from_branch?: { name: string };
  to_branch?: { name: string };
  tool?: { name: string };
}

export type UserRole = 'ADMINISTRATOR' | 'DORADCA SERWISOWY' | 'MECHANIK';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  status: 'AKTYWNY' | 'ZABLOKOWANY';
  branch_id?: string;
  assigned_van_id?: string | null;
}

export type ModuleType = 'BAZA NARZĘDZI' | 'MOJE NARZĘDZIA' | 'GRAFIK' | 'UŻYTKOWNICY';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  created_at: string;
  is_read: boolean;
  tool_id?: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  model: string;
  branch_id: number;
  status: 'AKTYWNY' | 'SERWIS' | 'WOLNY';
}

export interface VanDrawerWithItems {
  id: string;
  van_id: string;
  name: string;
  image_url?: string | null;
  items: any[];
}

export interface WorkshopStation {
  id: string;
  name: string;
  type: 'szafka' | 'sprzet';
  branch_id: number;
  status: 'AKTYWNY' | 'KONSERWACJA' | 'WOLNY';
  photo_path?: string | null;
}

export interface WorkshopDrawerWithItems {
  id: string;
  station_id: string;
  name: string;
  image_url?: string | null;
  items: any[];
}
