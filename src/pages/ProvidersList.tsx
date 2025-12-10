import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Text, Title, Loader, Badge, Modal } from '@mantine/core';
import { useSelectedProvider } from '../contexts/SelectedProviderContext';

type Provider = {
  id: number;
  name: string;
  type?: string;
  location?: string;
  capacity?: number;
  contact_whatsapp?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  active?: boolean;
};

export default function ProvidersList() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { selected, setSelected } = useSelectedProvider();

  useEffect(() => {
    setLoading(true);
    api
      .listProviders()
      .then((data) => setProviders(data || []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  // deletion handled by confirm modal (askDelete -> confirmDelete)

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const askDelete = (id: number, name?: string) => {
    console.log('[ProvidersList] askDelete called', { id, name });
    setDeletingId(id);
    setDeletingName(name || null);
    setActionError(null);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteProvider(deletingId);
      setProviders((p) => p.filter((x) => x.id !== deletingId));
      if (selected && selected.id === deletingId) setSelected(null);
      setConfirmOpen(false);
      setDeletingId(null);
      setDeletingName(null);
    } catch (err) {
      console.error('[ProvidersList] delete error', err);
      setActionError(String(err));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 35 , paddingLeft: 35}}>
        <Title order={2}>Proveedores</Title>
        <Link to="/providers/new" onClick={() => setSelected(null)}>
          <Button>Nuevo proveedor</Button>
        </Link>
      </div>

      {loading && <Loader />}
      {error && <Text style={{ color: 'var(--shrimp-orange)' }}>Error: {error}</Text>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 35 , paddingLeft: 35 }}>
        {providers.length === 0 ? (
          <Text style={{ color: 'var(--muted)' }}>No hay proveedores aún.</Text>
        ) : (
          providers.map((prov) => {
            const isSelected = Boolean(selected && selected.id === prov.id)
            return (
              <Card
                key={prov.id}
                shadow="xs"
                padding="md"
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--shrimp-orange)' : undefined,
                  background: isSelected ? 'rgba(255, 210, 180, 0.06)' : undefined,
                }}
                onClick={() => setSelected(prov)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text style={{ fontWeight: 700 }}>{prov.name}</Text>
                    <Text style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{prov.type} • {prov.location}</Text>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Badge color={prov.active ? 'green' : 'gray'}>{prov.active ? 'Activo' : 'Inactivo'}</Badge>
                    <Text style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{prov.capacity ?? '-'} lbs</Text>
                    <Button className="btn-edit" onClick={(e) => { e.stopPropagation(); navigate(`/providers/${prov.id}/edit`) }}>Editar</Button>
                    <Button className="btn-delete" color="red" onClick={(e) => { e.stopPropagation(); askDelete(prov.id, prov.name) }}>Eliminar</Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
      
      <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirmar eliminación" zIndex={2000}>
        <Text>¿Eliminar proveedor <strong>{deletingName}</strong>?</Text>
        {actionError && <Text style={{ color: 'red', marginTop: 8 }}>Error: {actionError}</Text>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button color="red" onClick={confirmDelete}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
