export interface Packager {
  id: number;
  name: string;
  location: string;
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  ruc?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackagerData {
  name: string;
  location: string;
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  ruc?: string;
}

export interface UpdatePackagerData {
  name?: string;
  location?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  ruc?: string;
}

export interface PackagerFilter {
  search?: string;
  location?: string;
  active?: boolean;
}
