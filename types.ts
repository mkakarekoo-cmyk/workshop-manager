
export enum ToolStatus {
  IN_TRANSIT = 'W DRODZE',
  OCCUPIED = 'ZAJĘTE',
  MAINTENANCE = 'KONSERWACJA',
  FREE = 'WOLNE'
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  serial_number: string;
  status: ToolStatus;
  branch_id: string;
  image_url: string;
  responsible_person?: string;
}

export interface ToolLog {
  id: string;
  tool_id: string;
  action: 'WYDANIE' | 'PRZYJĘCIE' | 'PRZESUNIĘCIE' | 'KONSERWACJA' | 'REZERWACJA';
  from_branch_id?: string;
  to_branch_id?: string;
  notes: string;
  photo_url?: string;
  created_at: string;
  operator?: string;
}

export interface InventoryItem {
  id: string;
  lp: number;
  name: string;
  quantity: number;
  photo_url?: string;
}

export interface Mechanic {
  id: string;
  name: string;
  specialization: string;
  avatar_url: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  model: string;
  branch_id: string;
  mechanic_id?: string;
  status: 'AKTYWNY' | 'SERWIS' | 'WOLNY';
  image_url: string;
  inventory: InventoryItem[];
}

export interface WorkshopStation {
  id: string;
  name: string;
  branch_id: string;
  assigned_user_id?: string;
  status: 'AKTYWNY' | 'KONSERWACJA' | 'WOLNY';
  image_url: string;
  inventory: InventoryItem[];
}

export interface User {
  id: string;
  email: string;
  role: 'ADMINISTRATOR' | 'USER';
  name?: string;
  status: 'AKTYWNY' | 'ZABLOKOWANY';
  avatar_url?: string;
  branch_id?: string; // Phase 3: Branch assignment
}

export type ModuleType = 'NARZĘDZIA' | 'MOJA FLOTA' | 'MÓJ WARSZTAT' | 'UŻYTKOWNICY';
