export type DeviceStatus = 'up' | 'down' | 'unknown';

export interface Device {
  id: number;
  name: string;
  hostname: string;
  check_type: 'http' | 'tcp';
  target: string;
  port: number | null;
  interval_seconds: number;
  timeout_seconds: number;
  is_enabled: boolean;
  last_status: DeviceStatus;
  last_checked_at: string | null;
}

export interface Incident {
  id: number;
  title: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  device?: { id: number; name: string; hostname: string };
  assignee?: { id: number; name: string; email: string } | null;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
