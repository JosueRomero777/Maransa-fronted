import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Box, 
  Typography, 
  Button, 
  Stack, 
  Autocomplete, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { MyLocation as MyLocationIcon } from '@mui/icons-material';

// Fix para los íconos de Leaflet en React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  value?: { lat: number; lng: number; address?: string };
  onChange: (location: { lat: number; lng: number; address?: string }) => void;
  label?: string;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

function LocationMarker({ position, onPositionChange }: any) {
  const markerRef = useRef<any>(null);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      
      marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        onPositionChange(newPos);
      });
    }
  }, [onPositionChange]);

  return position ? (
    <Marker 
      position={position} 
      draggable={true}
      ref={markerRef}
    >
      <Popup>
        Ubicación seleccionada
        <br />
        <small>Arrastra el marcador para ajustar</small>
      </Popup>
    </Marker>
  ) : null;
}

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, label }) => {
  const [position, setPosition] = useState<L.LatLng | null>(
    value ? L.latLng(value.lat, value.lng) : null
  );
  const [address, setAddress] = useState(value?.address || '');
  const [searchAddress, setSearchAddress] = useState<AddressSuggestion | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [errorDialog, setErrorDialog] = useState({ open: false, message: '' });
  const [locationErrorDialog, setLocationErrorDialog] = useState({ open: false, message: '' });

  const handlePositionChange = useCallback((latlng: L.LatLng) => {
    setPosition(latlng);
    setMapZoom(15);
    const newAddress = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    setAddress(newAddress);
    onChange({ lat: latlng.lat, lng: latlng.lng, address: newAddress });
  }, [onChange]);

  // Buscar sugerencias mientras el usuario escribe
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setLoadingSuggestions(true);
      try {
        // Primera búsqueda: específica para Ecuador
        let response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)} Ecuador&limit=10&addressdetails=1&viewbox=-81.1,1.5,-74.0,-5.0&bounded=0`
        );
        let data = await response.json();

        // Si no encuentra resultados en Ecuador, hacer búsqueda más general
        if (data.length === 0) {
          response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&limit=10&addressdetails=1`
          );
          data = await response.json();
        }

        // Filtrar para priorizar resultados de Ecuador
        const ecuadorResults = data.filter(item => 
          item.address?.country === 'Ecuador' || 
          item.display_name.toLowerCase().includes('ecuador')
        );

        // Si hay resultados de Ecuador, mostrar esos primero, sino mostrar todos
        setSuggestions(ecuadorResults.length > 0 ? ecuadorResults : data);
      } catch (error) {
        console.error('Error obteniendo sugerencias:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
          handlePositionChange(latlng);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          setLocationErrorDialog({ 
            open: true, 
            message: 'No se pudo obtener la ubicación actual. Verifica los permisos del navegador.' 
          });
        }
      );
    } else {
      setLocationErrorDialog({ 
        open: true, 
        message: 'Geolocalización no disponible en este navegador' 
      });
    }
  };

  const handleSelectAddress = (suggestion: AddressSuggestion | null) => {
    if (suggestion) {
      const latlng = L.latLng(parseFloat(suggestion.lat), parseFloat(suggestion.lon));
      handlePositionChange(latlng);
      setSearchAddress(suggestion);
    }
  };

  const handleSearchByEnter = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim().length >= 2) {
      e.preventDefault();
      setLoadingSuggestions(true);
      try {
        // Primera búsqueda: específica para Ecuador
        let response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)} Ecuador&limit=10&addressdetails=1&viewbox=-81.1,1.5,-74.0,-5.0&bounded=0`
        );
        let data = await response.json();

        // Si no encuentra resultados en Ecuador, hacer búsqueda más general
        if (data.length === 0) {
          response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&limit=10&addressdetails=1`
          );
          data = await response.json();
        }

        // Filtrar para priorizar resultados de Ecuador
        const ecuadorResults = data.filter(item => 
          item.address?.country === 'Ecuador' || 
          item.display_name.toLowerCase().includes('ecuador')
        );

        const results = ecuadorResults.length > 0 ? ecuadorResults : data;

        if (results.length > 0) {
          // Seleccionar el primer resultado automáticamente
          handleSelectAddress(results[0]);
          setSuggestions(results);
        } else {
          // Mostrar modal si no encuentra la dirección
          setErrorDialog({
            open: true,
            message: `No se encontró la dirección "${inputValue}". Intenta con otra búsqueda o utiliza el mapa para seleccionar la ubicación.`
          });
        }
      } catch (error) {
        console.error('Error en búsqueda:', error);
        setErrorDialog({
          open: true,
          message: 'Error al buscar la dirección. Intenta de nuevo.'
        });
      } finally {
        setLoadingSuggestions(false);
      }
    }
  };

  // Ecuador center as default
  const center: [number, number] = position ? [position.lat, position.lng] : [-1.831239, -78.183406];

  const MapController = ({ target, zoom }: { target: [number, number]; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
      if (target) {
        map.flyTo(target, zoom, { duration: 0.75 });
      }
    }, [map, target, zoom]);
    return null;
  };

  return (
    <Box>
      {label && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Autocomplete
          fullWidth
          size="small"
          options={suggestions}
          getOptionLabel={(option) => option.display_name}
          value={searchAddress}
          onChange={(_, newValue) => handleSelectAddress(newValue)}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          loading={loadingSuggestions}
          noOptionsText={inputValue.length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron resultados"}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Buscar dirección..."
              onKeyDown={handleSearchByEnter}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingSuggestions ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Button
          variant="outlined"
          startIcon={<MyLocationIcon />}
          onClick={handleGetCurrentLocation}
        >
          Mi Ubicación
        </Button>
      </Stack>

      <Box sx={{ height: 480, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController target={center} zoom={mapZoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onPositionChange={handlePositionChange} />
        </MapContainer>
      </Box>

      {position && (
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Coordenadas: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </Typography>
      )}

      {/* Dialog de error de búsqueda */}
      <Dialog 
        open={errorDialog.open} 
        onClose={() => setErrorDialog({ open: false, message: '' })}
      >
        <DialogTitle>Dirección no encontrada</DialogTitle>
        <DialogContent>
          <Typography>{errorDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog({ open: false, message: '' })}>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de error de ubicación */}
      <Dialog 
        open={locationErrorDialog.open} 
        onClose={() => setLocationErrorDialog({ open: false, message: '' })}
      >
        <DialogTitle>Error de geolocalización</DialogTitle>
        <DialogContent>
          <Typography>{locationErrorDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationErrorDialog({ open: false, message: '' })}>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapPicker;
