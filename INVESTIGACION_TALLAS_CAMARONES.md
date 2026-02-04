# INVESTIGACIÓN: ESTÁNDARES DE TALLAS DE CAMARONES EN ECUADOR

## RESUMEN EJECUTIVO

Ecuador es el **mayor exportador de camarones del mundo**. El camarón blanco (*Penaeus vannamei*) representa el 75-90% de la producción nacional. Los estándares de tallas varían significativamente según:
- **Tipo de presentación** (vivo, con cabeza, sin cabeza)
- **Tipo de camarón** (blanco, rojo, tigre)
- **Sistema de clasificación** (piezas por libra - pieces per pound)

---

## 1. TIPOS DE CAMARONES COMERCIALES EN ECUADOR

| Tipo | Nombre Científico | % Producción | Presentación | Mercado |
|------|-------------------|--------------|--------------|---------|
| **Camarón Blanco** | *Penaeus vannamei* | 75-90% | Todas | Global |
| **Camarón Rojo** | *Farfantepenaeus californiensis* | 5-10% | Principalmente cola | Premium |
| **Camarón Tigre** | *Penaeus monodon* | 5-10% | Cola, vivo | Asia, Premium |

---

## 2. TIPOS DE PRESENTACIÓN Y SUS CARACTERÍSTICAS

### A) CAMARÓN VIVO (Live - L)
- **Peso**: Se contabiliza con agua/humedad natural (wet weight)
- **Rendimiento**: 100% (base de referencia)
- **Rango de tallas**: 6-30 piezas/libra
- **Codificación**: Por peso total, conteo de piezas
- **Vida útil**: 2-3 días (con hielo aireado)
- **Mercados**: China, Asia principalmente
- **Precio**: Más alto que otras presentaciones

### B) CAMARÓN CON CABEZA (Head-On - HO)
- **Peso**: Incluye cefalotórax completo
- **Rendimiento**: ~75% del peso en vivo
- **Rango de tallas**: 6-30 piezas/libra
- **Vida útil**: 7-10 días en hielo
- **Mercados**: Asia Oriental, algunos mercados europeos
- **Precio**: Intermedio

### C) CAMARÓN SIN CABEZA/COLA (Headless/Tail - HL)
- **Peso**: Solo abdomen
- **Rendimiento**: 45-50% del peso con cabeza
- **Rango de tallas**: 10-70 piezas/libra
- **Vida útil**: 10-14 días en hielo
- **Mercados**: EE.UU., Europa, Mercados Premium
- **Precio**: Variable según talla

### D) CAMARÓN PELADO (Peeled/Shrimp Meat)
- **Rendimiento**: 45-50% del camarón cola
- **Uso**: Principalmente para procesamiento
- **Menos común en Ecuador**

---

## 3. CLASIFICACIÓN DE TALLAS - ESTÁNDAR INTERNACIONAL

### A) CAMARÓN CON CABEZA (Head-On - HO)

| Código | Clasificación | Rango de Piezas | Rango de Piezas/Libra | Peso Unitario Aprox. |
|--------|---------------|-----------------|----------------------|----------------------|
| **Colossal** | XL Extra Grande | 6-8 piezas/lb | 6-8 | 30g+ |
| **Jumbo** | L Muy Grande | 8-12 piezas/lb | 8-12 | 23-30g |
| **Extra Large** | XL Grande | 13-15 piezas/lb | 13-15 | 18-23g |
| **Large** | L Mediano-Grande | 16-20 piezas/lb | 16-20 | 14-18g |
| **Medium** | M Mediano | 21-25 piezas/lb | 21-25 | 11-14g |
| **Small** | S Pequeño | 26-30 piezas/lb | 26-30 | 9-11g |

**Nota**: Estos rangos son aproximados. El sistema usa "piezas por libra" como estándar.

### B) CAMARÓN SIN CABEZA/COLA (Tail - HL)

| Código Estándar | Clasificación | Rango | Piezas/Libra | Peso Unitario |
|-----------------|---------------|-------|--------------|----------------|
| **10/15** | Extra Jumbo | 10-15 | 10-15 | 13-18g |
| **16/20** | Jumbo | 16-20 | 16-20 | 10-13g |
| **21/25** | Large | 21-25 | 21-25 | 8-10g |
| **26/30** | Medium-Large | 26-30 | 26-30 | 6-8g |
| **31/40** | Medium | 31-40 | 31-40 | 5-6g |
| **41/50** | Small-Medium | 41-50 | 41-50 | 4-5g |
| **51/60** | Small | 51-60 | 51-60 | 3-4g |
| **61/70** | Extra Small | 61-70 | 61-70 | 2.5-3.5g |

### C) CAMARÓN VIVO (Live)

| Clasificación | Conteo (Piezas/Libra) | Piezas/Kg | Peso Unitario |
|---------------|----------------------|-----------|----------------|
| **Jumbo** | 6-8 | 13-18 | 50-80g |
| **Large** | 8-12 | 18-27 | 35-50g |
| **Medium** | 13-20 | 27-45 | 22-35g |
| **Small** | 21-30 | 45-70 | 14-22g |

---

## 4. DIFERENCIAS CLAVES POR PRESENTACIÓN

| Característica | Vivo (L) | Con Cabeza (HO) | Sin Cabeza (Tail/HL) |
|---|---|---|---|
| **Base de Conteo** | Piezas por libra | Piezas por libra | Piezas por libra |
| **Rangos Típicos** | 6-30 piezas/lb | 6-30 piezas/lb | 10-70 piezas/lb |
| **Rendimiento** | 100% (base) | ~75% | ~45-50% |
| **Conversión Aprox.** | 1 vivo = 0.75 HO = 0.45 Tail | - | - |
| **Rango en mm aprox.** | 30-90mm | 30-80mm | 25-60mm |
| **Categorización Frecuente** | Por peso total | Por contador | Por código estándar |

---

## 5. PROBLEMAS ACTUALES EN MARANSA

**Estado Actual del Sistema**:
- Solo un input de "Talla Estimada" con 11 opciones predefinidas (U10 a U100)
- No diferencia entre tipo de presentación
- No incluye rangos (10-20, 16-20, etc.)
- Confunde codificación de camarón vivo vs procesado

**Opciones Actuales** (incompletas y genéricas):
```
U10, U12, U15, U20, U30, U40, U50, U60, U70, U80, U100
```

---

## 6. PROPUESTA DE SOLUCIÓN

### Estructura Recomendada para la Base de Datos

```typescript
// Tipos a crear
interface ShrimpType {
  id: number;
  name: string;           // "Blanco", "Rojo", "Tigre"
  scientificName: string; // Penaeus vannamei, etc.
  productionPercentage: number;
}

interface PresentationType {
  id: number;
  code: string;           // "L", "HO", "HL", "PD"
  name: string;           // "Vivo", "Con Cabeza", "Sin Cabeza", "Pelado"
  rendimiento: number;    // 100, 75, 45, etc.
  lifeSpanDays: number;   // 2, 7, 10, etc.
}

interface ShrimpSize {
  id: number;
  presentationTypeId: number;
  code: string;           // "10/15", "16/20", "U10", "U20", etc.
  classification: string; // "Jumbo", "Large", "Medium", etc.
  minPiecesPerLb: number; // 10
  maxPiecesPerLb: number; // 15
  minWeightGrams: number; // 13
  maxWeightGrams: number; // 18
  minWeightOz: number;    // 0.46
  maxWeightOz: number;    // 0.63
  displayLabel: string;   // "10/15 (Jumbo) - 13-18g"
}

// Relación en OrderFormData
interface OrderFormData {
  providerId: number;
  shrimpTypeId?: number;          // NUEVO: Tipo de camarón
  presentationTypeId?: number;    // NUEVO: Tipo de presentación
  estimatedSizeId?: number;       // REEMPLAZAR: tallaEstimada
  cantidadEstimada: number;
  // ... resto de campos
}
```

### Cambios en OrderForm.tsx

1. **Agregar selectores en cascada**:
   - Primero seleccionar tipo de camarón
   - Luego tipo de presentación
   - Finalmente talla disponible para esa presentación

2. **Mostrar información adicional**:
   - Rendimiento esperado
   - Rango en gramos
   - Rango en piezas/libra
   - Vida útil esperada

3. **Validación inteligente**:
   - Solo mostrar tallas disponibles para la presentación seleccionada
   - Mostrar conversiones entre presentaciones

### Datos de Referencia a Cargar

```typescript
// Camarón Blanco - Sin Cabeza
{
  shrimpTypeId: 1,
  presentationTypeId: 3,
  code: "10/15",
  classification: "Extra Jumbo",
  minPiecesPerLb: 10,
  maxPiecesPerLb: 15,
  minWeightGrams: 13,
  maxWeightGrams: 18,
}

// Camarón Blanco - Vivo
{
  shrimpTypeId: 1,
  presentationTypeId: 1,
  code: "6/8",
  classification: "Jumbo",
  minPiecesPerLb: 6,
  maxPiecesPerLb: 8,
  minWeightGrams: 50,
  maxWeightGrams: 80,
}
// ... más combinaciones
```

---

## 7. ESTÁNDARES Y CERTIFICACIONES APLICABLES

### Regulaciones Ecuatorianas
- **AGROCALIDAD**: Aseguramiento de la calidad
- **CÁMARA DE ACUACULTURA DEL ECUADOR**: Regulación sectorial
- **Requisitos de histamina**: Máximo 5mg/100g (FDA)
- **Contaminación bacteriana**: < 10⁶ CFU/g

### Estándares Internacionales
- **UNECE FFV-45** (Naciones Unidas)
- **SQF** (Safe Quality Food)
- **HACCP** (Hazard Analysis and Critical Control Point)
- **ASC** (Aquaculture Stewardship Council)
- **GLOBALGAP** (Prácticas agrícolas responsables)

---

## 8. REFERENCIAS Y CONVERSIONES

### Conversiones Útiles
```
1 libra = 453.6 gramos
1 kilogramo = 2.2 libras
1 onza = 28.35 gramos

Ejemplo de conversión:
- Camarón vivo 6-8 piezas/libra ≈ 50-80g por pieza
- Rendimiento ~60-70%, entonces camarón cola ≈ 30-50g por pieza
- Esto corresponde a rango 10/15 en presentación sin cabeza
```

### Rendimientos en Cadena de Frío
```
Transportación: 2-3% pérdida
Almacenamiento: 1-2% pérdida por mes
Procesamiento: 1-2% pérdida
Descongelación: 5-8% pérdida (importante documentar)
```

---

## 9. PRÓXIMOS PASOS IMPLEMENTACIÓN

### Fase 1: Base de Datos
1. Crear tablas: shrimp_types, presentation_types, shrimp_sizes
2. Cargar datos maestros (tipos de camarón, presentaciones)
3. Cargar matriz de tallas por presentación

### Fase 2: Backend API
1. Endpoints para obtener tipos de camarón
2. Endpoints para obtener presentaciones (filtradas por tipo)
3. Endpoints para obtener tallas (filtradas por presentación)

### Fase 3: Frontend
1. Actualizar OrderForm con selectores en cascada
2. Mostrar información de tallas (rango, peso, piezas/lb)
3. Actualizar vista de pedidos para mostrar información completa

### Fase 4: Documentación
1. Guía de tallas para usuarios
2. Tabla de referencia rápida
3. Conversiones y equivalencias

---

## 10. RECURSOS ADICIONALES

### Asociaciones y Organismos Reguladores
- **Cámara de Acuacultura del Ecuador**: www.camaradecuacultura.ec
- **AGROCALIDAD**: www.agrocalidad.gob.ec
- **Ministerio de Acuacultura y Pesca**: www.mapa.gob.ec

### Referencias Técnicas
- FAO Manual de Camarones: http://www.fao.org
- UNECE FFV-45 Standards: http://www.unece.org
- FDA Seafood HACCP: http://www.fda.gov

---

## Conclusión

La implementación de un sistema de tallas dinámica y contextual basado en el tipo de camarón y presentación **mejorará significativamente** la precisión en la gestión de pedidos, facilitará la comunicación con proveedores y compradores, y se alineará con los estándares internacionales de la industria camaronera ecuatoriana.
