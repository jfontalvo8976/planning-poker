# Planning Poker App

Una aplicación de Planning Poker en tiempo real construida con Next.js, Socket.io y Tailwind CSS. Permite a los equipos estimar tareas de forma colaborativa con actualizaciones en tiempo real.

## Características

- ✅ Salas de Planning Poker en tiempo real
- ✅ **Sistema de roles**: Moderador, Participantes y Espectadores
- ✅ **Permisos granulares**: Solo el moderador puede revelar votos y gestionar votaciones
- ✅ **Animación de revelado**: Countdown de 3 segundos con cartas animadas
- ✅ Compartir salas mediante enlaces
- ✅ Votación anónima hasta que se revelen los votos
- ✅ Cartas de estimación personalizables (Fibonacci + opciones especiales)
- ✅ Resumen estadístico de votaciones
- ✅ Interfaz moderna y responsive
- ✅ Soporte para múltiples usuarios simultáneos
- ✅ Reconexión automática

## Roles de usuario

### 👑 Moderador
- Crea la sala automáticamente
- Define y edita las tareas a estimar
- Controla cuándo revelar los votos
- Puede iniciar nuevas votaciones
- Puede votar como cualquier participante

### 🗳️ Participante
- Puede votar en las estimaciones
- Ve cuando todos han votado
- Espera a que el moderador revele los votos
- Participa en las estadísticas finales

### 👁️ Espectador
- Solo observa el proceso
- No puede votar
- Ve todas las estadísticas una vez reveladas
- Ideal para stakeholders, managers, o aprendices

## Tecnologías utilizadas

- **Next.js 15** - Framework de React
- **Socket.io** - Comunicación en tiempo real
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos y diseño
- **Lucide React** - Iconos

## Instalación y configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

3. **Abrir la aplicación:**
   Navega a `http://localhost:3000`

## Cómo usar

### Crear una nueva sala

1. Ingresa tu nombre
2. Nombra tu sala de Planning Poker
3. Haz clic en "Crear Sala"
4. Comparte el enlace generado con tu equipo

### Unirse a una sala existente

1. Ingresa tu nombre
2. Pega el ID de la sala o usa el enlace compartido
3. Haz clic en "Unirse a Sala"

### Proceso de estimación

1. **Define la tarea:** El moderador ingresa la descripción de la tarea o pega un enlace de Jira
2. **Automático:** Si es un enlace de Jira, la aplicación extrae automáticamente toda la información
3. **Vota:** Cada participante selecciona su estimación
4. **Revela:** Una vez que todos han votado, revela los resultados
5. **Discute:** Analiza las diferencias y llega a un consenso
6. **Nueva ronda:** Reinicia para la siguiente tarea

## Integración con Jira

### Configuración inicial

1. **Obtener API Token:**
   - Ve a [Atlassian Account Security](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Crea un nuevo API token
   - Guarda el token de forma segura

2. **Configurar en la aplicación:**
   - Haz clic en "Configurar Jira" en la sala
   - Ingresa tu dominio de Jira (ej: `tuempresa.atlassian.net`)
   - Ingresa tu email de Jira
   - Ingresa el API token
   - Prueba la conexión

### Usar con Jira

1. **Automático:** Simplemente pega cualquier enlace de Jira en el campo de tarea
2. **Extracción:** La aplicación detecta automáticamente el enlace y extrae:
   - Título y descripción de la tarea
   - Tipo de issue (Story, Bug, Task, Epic)
   - Prioridad y estado
   - Asignado y reportero
   - Story points existentes
   - Labels y componentes
3. **Un clic:** Haz clic en "Usar como tarea actual" para establecer la tarea automáticamente

### Formatos de URL soportados

- `https://tuempresa.atlassian.net/browse/PROJ-123`
- `https://jira.tuempresa.com/browse/TASK-456`
- Cualquier instancia de Jira con el formato estándar

## Valores de estimación

La aplicación incluye los siguientes valores por defecto:
- **Secuencia Fibonacci:** 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89
- **Opción especial:** ? (para indicar incertidumbre o necesidad de más información)

## Características técnicas

### Comunicación en tiempo real

- Conexión WebSocket persistente con Socket.io
- Sincronización automática entre todos los participantes
- Manejo de reconexiones automáticas

### Gestión de salas

- Salas temporales que se eliminan automáticamente cuando quedan vacías
- Límite de tiempo de inactividad (5 minutos)
- Soporte para múltiples salas simultáneas

### Seguridad y privacidad

- No se almacenan datos sensibles
- Salas temporales sin persistencia en base de datos
- IDs únicos generados automáticamente

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx          # Página principal
│   ├── layout.tsx        # Layout base
│   └── globals.css       # Estilos globales
├── components/
│   ├── JoinCreateRoom.tsx # Componente para crear/unirse a salas
│   └── PokerRoom.tsx     # Componente principal de la sala
├── hooks/
│   └── useSocket.ts      # Hook personalizado para Socket.io
└── lib/
    └── socket.ts         # Tipos y configuración de Socket.io
```

## Scripts disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Ejecuta la aplicación en modo producción
- `npm run lint` - Ejecuta el linter de código

## Próximas características

- [ ] Persistencia opcional de salas
- [ ] Historial de estimaciones
- [ ] Exportar resultados
- [ ] Temas personalizables
- [ ] Estimación por tiempo además de story points
- [ ] Integración con herramientas de gestión de proyectos

## Contribución

1. Fork el proyecto
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Despliegue en Vercel

Esta aplicación está optimizada para desplegarse en Vercel:

1. **Conectar repositorio**: Conecta tu repositorio de GitHub a Vercel
2. **Configuración automática**: Vercel detectará automáticamente Next.js
3. **Socket.IO optimizado**: Configurado para funcionar con Vercel Functions
4. **Despliegue automático**: Se despliega automáticamente en cada push

### Archivos de configuración para Vercel:
- `vercel.json` - Configuración de routing simplificada
- `package.json` - Scripts optimizados para Vercel
- Socket.IO configurado como API Route en `/src/pages/api/socket.ts`

### Pasos para desplegar:

1. **Opción 1 - Dashboard de Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Importa tu repositorio desde GitHub
   - Vercel detectará Next.js automáticamente
   - Haz clic en "Deploy"

2. **Opción 2 - Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

### Verificar después del despliegue:
- ✅ La aplicación carga correctamente
- ✅ Socket.IO funciona para tiempo real
- ✅ Se pueden crear y unir salas
- ✅ La interfaz es responsive en móvil
