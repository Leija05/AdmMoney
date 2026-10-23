# Adm Money — Suite Financiera & Gestión de Negocio de Galletas

Sistema integral multiplataforma compuesto por **Página Web**, **App Móvil** y **Backend API**, diseñado para:
1. **Administración de Gastos Generales**: Registro, categorías, filtros y suma automática de egresos.
2. **Escáner Inteligente de Tickets con Cámara / OCR**: Detección óptica de comercio, fecha, desglose de productos y total para mandarlo directamente a los registros de gastos.
3. **Mini Negocio de Galletas Artesanales**: Control de costos de insumos, cálculo exacto de **lo que gasto por galleta**, **lo que gano por galleta** (ganancia neta unitaria) y **margen de utilidad %**, más registro de ventas diarias.
4. **Vistas Gráficas & Analítica Visual**: Métricas interactivas de ventas, costos, ganancias y ranking de galletas más vendidas.
5. **Sincronización Total Web y Móvil**: Ambos clientes comparten la misma base de datos y API en tiempo real.
6. **Modo Dual (Datos de Prueba vs Datos Reales)**: Opción en código y en la interfaz para alternar entre datos de demostración completos o conexión al backend real.

---

## 📁 Arquitectura del Proyecto

```
Adm Money/
├── admmoney-backend/             # API en FastAPI + SQLite / OCR
│   ├── app/
│   │   ├── api/routers/          # Routers (expenses, cookies, scanner, analytics)
│   │   ├── core/                 # Configuración, Base de Datos SQLite, CORS
│   │   ├── models/               # Modelos Pydantic y Schemas
│   │   ├── services/             # Lógica de OCR, Escandallo y Analítica
│   │   └── main.py               # Entrada principal de FastAPI
│   ├── uploads/                  # Almacenamiento de imágenes de tickets
│   └── requirements.txt
│
├── AdmMoneyPage/                 # Página Web (Vite + React 18 + TypeScript)
│   └── frontend/
│       ├── src/
│       │   ├── config/appConfig.ts # 👈 ACTIVA / DESACTIVA DATOS DE PRUEBA EN WEB
│       │   ├── components/       # Layout, Modales, Tarjetas Double-Bezel, Scanner
│       │   ├── pages/            # Dashboard, Gastos Generales, Negocio Galletas, Analítica
│       │   ├── services/         # api.service.ts y mockData.ts (Modo dual)
│       │   ├── styles/           # CSS Modular (Glassmorphism, Tokens OLED, Layout)
│       │   ├── lib/              # Tipos y Constantes
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
│
├── AdmMoneyMovil/                # App Móvil (React Native + Expo Router SDK 52)
│   └── frontend/
│       ├── app/                  # Rutas con Expo Router
│       │   ├── _layout.tsx
│       │   └── (tabs)/           # Pestañas (Resumen, Gastos, Escanear, Galletas, Gráficas, Ajustes)
│       ├── src/
│       │   ├── config/appConfig.ts # 👈 ACTIVA / DESACTIVA DATOS DE PRUEBA EN MÓVIL
│       │   ├── components/       # Componentes nativos Double-Bezel, Cards y Modales
│       │   ├── services/         # api.ts y mockData.ts (Modo dual)
│       │   ├── stores/           # Store Zustand con persistencia y modo de prueba reactivo
│       │   └── theme/            # Paleta obsidian, esmeralda, ámbar y espaciados
│       ├── app.json
│       └── package.json
│
├── iniciar_todo.bat              # Inicia Backend, Web y Móvil simultáneamente
├── iniciar_backend.bat           # Inicia FastAPI en puerto 8000
├── iniciar_web.bat               # Inicia Vite en puerto 5173
└── iniciar_movil.bat             # Inicia Expo en puerto 8081
```

---

## 🧪 Activar y Desactivar Datos de Prueba (Modo Demo vs Real)

Tienes **dos formas** de activar o desactivar los datos de prueba:

### Opción A: Directamente en Código (Recomendado)

#### 1. En la Página Web:
Abre el archivo:
`AdmMoneyPage/frontend/src/config/appConfig.ts`
```typescript
export const APP_CONFIG = {
  USE_MOCK_DATA: true,  // 👈 'true' = Datos de prueba (Demo) | 'false' = Datos reales (FastAPI)
  API_BASE_URL: 'http://localhost:8000/api',
};
```

#### 2. En la App Móvil:
Abre el archivo:
`AdmMoneyMovil/frontend/src/config/appConfig.ts`
```typescript
export const APP_CONFIG = {
  USE_MOCK_DATA: true,  // 👈 'true' = Datos de prueba (Demo) | 'false' = Datos reales (FastAPI)
  DEFAULT_API_HOST: 'http://localhost:8000',
};
```

### Opción B: Directamente en la Interfaz (1 Clic)
- **En la Web**: En la barra superior de navegación verás el botón `[🧪 Datos de Prueba]`. Haz clic para alternar instantáneamente entre datos de prueba y datos reales en vivo.
- **En el Móvil**: Ve a la pestaña **Ajustes** y activa o desactiva el interruptor **"Modo Datos de Prueba"**.

---

## 📱 Cómo Ejecutar la App Móvil (Paso a Paso)

### Método 1: Doble Clic (El Más Rápido)
Haz doble clic en el archivo raíz:
```bash
iniciar_movil.bat
```
Esto abrirá la consola de Expo con el servidor de desarrollo en el puerto 8081.

---

### Método 2: Por Terminal
Abre PowerShell o CMD y ejecuta:
```bash
cd AdmMoneyMovil\frontend
npx expo start
```

---

### ¿Cómo ver la App Móvil en tu dispositivo?

Una vez que Expo inicie en la terminal, tienes 3 opciones:

#### 1. Ver en tu Celular Físico (Android o iPhone)
1. Instala la aplicación gratuita **Expo Go** desde Google Play Store o Apple App Store en tu celular.
2. Asegúrate de que tu celular y tu computadora estén conectados a la **misma red Wi-Fi**.
3. En la terminal de tu computadora verás un **código QR**:
   - En **Android**: Abre la app *Expo Go* y presiona **"Scan QR code"**.
   - En **iPhone**: Abre la aplicación de la **Cámara** nativa y enfoca el código QR.
4. La aplicación se compilará y abrirá en tu teléfono al instante.

#### 2. Ver en el Navegador Web (Sin instalar nada en el celular)
En la terminal donde corre Expo, simplemente presiona la tecla:
```
w
```
Esto abrirá la versión móvil directamente en tu navegador web en `http://localhost:8081`.

#### 3. Ver en Emulador Android (Android Studio)
Si tienes Android Studio con un emulador configurado:
1. Inicia tu emulador en Android Studio.
2. En la terminal de Expo, presiona la tecla:
```
a
```

---

## 📦 Cómo Exportar el APK Nativo de Android

He dejado el proyecto completamente configurado con el paquete nativo `com.admmoney.app` y el archivo `eas.json` listo para generar un archivo **`.apk` independiente** que puedes instalar en cualquier teléfono Android:

### Opción 1: Un Solo Clic con el Script
Haz doble clic en:
```bash
exportar_apk_android.bat
```

### Opción 2: Desde la Terminal
```powershell
cd "AdmMoneyMovil\frontend"
npx eas build -p android --profile preview
```

> **¿Qué sucederá?**
> 1. Si es tu primera vez, te pedirá ingresar tu cuenta gratuita de [expo.dev](https://expo.dev) (se crea en 1 minuto).
> 2. Expo compilará el código en la nube sin necesidad de tener Android Studio o Java configurados en tu PC.
> 3. Al terminar, la terminal te entregará un **enlace directo de descarga** y un **código QR** para descargar el archivo `.apk` directamente en tu celular e instalarlo.

---


## 🍪 Unit Economics del Negocio de Galletas (Cálculo Exacto)

### 1. Resumen de la Receta y Producción
- **Rendimiento por tanda**: 16 galletas.
- **Ingredientes principales**: Mantequilla, azúcar mascabado, azúcar estándar, huevo, vainilla, harina, polvo para hornear, bicarbonato, maizena, sal, galletas Oreo y chispas de chocolate.
- **Costo de ingredientes por tanda (16 galletas)**: **$108.38 MXN**
- **Costo de ingrediente por galleta**: **$6.77 MXN** ($108.38 / 16)

### 2. Estructura de Costos por Galleta Individual
Para tener un cálculo exacto de la utilidad, se consideraron tanto los insumos básicos como el empaque individual:

| Concepto | Costo Unitario (MXN) |
| :--- | :--- |
| **Ingredientes** | $6.77 |
| **Empaque individual** | $2.90 |
| **Costo Total Unitario (Lote empaquetado)** | **$9.67** |

### 3. Precios de Venta y Margen de Utilidad
Se definieron dos esquemas principales de venta al público para maximizar el flujo de clientes y el volumen de compra:

#### A. Venta Individual ($35.00 MXN)
- **Precio de venta**: $35.00 MXN
- **Costo unitario (con empaque)**: $9.67 MXN
- **Ganancia neta por galleta**: **+$25.33 MXN**
- **Margen de rendimiento**: **~262%** (Margen sobre venta: 72.37%)

#### B. Promoción 3 x $90.00 MXN ($30.00 MXN c/u)
- **Precio del paquete (3 piezas)**: $90.00 MXN
- **Costo total del paquete (3 piezas con empaque)**: $29.01 MXN ($9.67 × 3)
- **Ganancia neta por paquete**: **+$60.99 MXN**
- **Ganancia neta por galleta**: **+$20.33 MXN**
- **Margen de rendimiento**: **~210%** (Margen sobre venta: 67.77%)

