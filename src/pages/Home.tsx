import { Link } from 'react-router-dom'
import { Title, Text, Button, Stack } from '@mantine/core'

export default function Home() {
  return (
    <div style={{ padding: 24,  maxWidth: 80%0, margin: 'auto', textAlign: 'center' }}>
      <Stack spacing="md">
        <Title>Bienvenido a Maransa</Title>
        <Text color="dimmed">Panel principal — usa la barra lateral para navegar entre módulos.</Text>
      </Stack>
    </div>
  )
}
