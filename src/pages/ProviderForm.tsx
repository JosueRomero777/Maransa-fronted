import { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import {
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Group,
  Card,
  Title,
  Loader,
  Divider,
  Paper,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';

type FormState = {
  name: string;
  type?: string;
  location?: string;
  capacity?: number | null;
  contact_whatsapp?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
};

export default function ProviderForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormState>({
    initialValues: {
      name: '',
      type: '',
      location: '',
      capacity: null,
      contact_whatsapp: '',
      contact_email: '',
      contact_phone: '',
      notes: '',
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'Nombre requerido' : null),
      contact_email: (value) => (value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? 'Email inválido' : null),
    },
  });

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    api
      .getProvider(editId)
      .then((data) => {
        // adapt null/undefined values
        form.setValues({
          name: data.name || '',
          type: data.type || '',
          location: data.location || '',
          capacity: data.capacity ?? null,
          contact_whatsapp: data.contact_whatsapp || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          notes: data.notes || '',
        });
      })
      .catch((err) => alert(String(err)))
      .finally(() => setLoading(false));
  }, [editId]);

  const handleSubmit = async (values: FormState) => {
    try {
      if (editId) await api.updateProvider(editId, values as any);
      else await api.createProvider(values as any);
      navigate('/providers');
    } catch (err) {
      alert(String(err));
    }
  };

  return (
    <div>
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
        <Title order={2} style={{ margin: 0 }}>{editId ? 'Editar proveedor' : 'Nuevo proveedor'}</Title>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <Paper shadow="md" radius="md" p="xl" style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Card shadow="none" p={0}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <Text size="sm" color="dimmed">Rellena la información principal del proveedor</Text>
                  <TextInput label="Nombre" required placeholder="Nombre del proveedor" variant="filled" radius="md" size="md" {...form.getInputProps('name')} />

                  <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
                    <TextInput style={{ flex: 1, minWidth: 220 }} label="Tipo" placeholder="e.g. Procesador, Distribuidor" variant="filled" radius="md" {...form.getInputProps('type')} />
                    <TextInput style={{ flex: 1, minWidth: 220 }} label="Ubicación" placeholder="Ciudad / Región" variant="filled" radius="md" {...form.getInputProps('location')} />
                  </div>
                </div>
              </div>

              <Divider my="lg" />

              <div>
                <Title order={4}>Contacto y capacidad</Title>
                <Text size="sm" color="dimmed">Información de contacto y capacidad de manejo.</Text>

                <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
                  <NumberInput style={{ flex: 1, minWidth: 220 }} label="Capacidad (libras)" min={0} placeholder="0" variant="filled" radius="md" {...form.getInputProps('capacity')} />
                  <TextInput style={{ flex: 1, minWidth: 220 }} label="WhatsApp" placeholder="+51 999 999 999" variant="filled" radius="md" {...form.getInputProps('contact_whatsapp')} />
                </div>

                <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
                  <TextInput style={{ flex: 1, minWidth: 220 }} label="Email" placeholder="correo@ejemplo.com" variant="filled" radius="md" {...form.getInputProps('contact_email')} />
                  <TextInput style={{ flex: 1, minWidth: 220 }} label="Teléfono" placeholder="(01) 234-5678" variant="filled" radius="md" {...form.getInputProps('contact_phone')} />
                </div>
              </div>

              <Divider my="lg" />

              <div>
                <Title order={4}>Notas</Title>
                <Text size="sm" color="dimmed">Comentarios internos o indicaciones especiales.</Text>
                <Textarea placeholder="Notas adicionales" minRows={4} variant="filled" radius="md" {...form.getInputProps('notes')} />
              </div>

              <Group style={{ justifyContent: 'flex-end' }} spacing="sm">
                <Button variant="outline" color="gray" onClick={() => navigate('/providers')}>Cancelar</Button>
                <Button type="submit">Guardar proveedor</Button>
              </Group>
            </Card>
          </form>
        </Paper>
      )}
    </div>
  );
}
