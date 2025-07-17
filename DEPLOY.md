# 🚀 Instrucciones de Despliegue a Vercel

## ✅ Preparación Completada

Tu aplicación Planning Poker está lista para desplegarse en Vercel. Los siguientes archivos han sido configurados:

### Archivos clave:
- ✅ `vercel.json` - Configuración simplificada y funcional
- ✅ `package.json` - Scripts compatibles con Vercel
- ✅ `src/pages/api/socket.ts` - Socket.IO como API Route
- ✅ `src/hooks/useSocket.ts` - Cliente optimizado para producción
- ✅ `README.md` - Documentación completa
- ✅ `.env.example` - Variables de entorno de ejemplo

### Verificación:
- ✅ `npm run build` - Compilación exitosa
- ✅ TypeScript sin errores
- ✅ Tailwind CSS optimizado
- ✅ Socket.IO configurado correctamente

## 🌐 Desplegar Ahora

### Método 1: Dashboard Web (Recomendado)
1. Ve a https://vercel.com
2. Haz clic en "New Project"
3. Conecta tu repositorio de GitHub
4. ¡Vercel se encarga del resto automáticamente!

### Método 2: CLI
```bash
npx vercel
```

## 🔧 Configuración Automática

Vercel detectará automáticamente:
- ✅ Next.js Framework
- ✅ Node.js Runtime
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `.next`

## 🧪 Testing Post-Despliegue

Una vez desplegado, prueba en orden:

### 1. Verificar conexión Socket.IO:
- Abre la consola del navegador (F12)
- Busca mensajes como: `✅ Connected to server successfully`
- Si ves `🔥 Connection error:`, hay un problema de conexión

### 2. Debugging común:
- **Error de path**: Verifica que aparezca "Connecting to: [URL] with path: /api/socket"
- **Reconnection loops**: Normal en Vercel, debe estabilizarse en ~30 segundos
- **Polling fallback**: Si WebSocket falla, debería usar polling automáticamente

### 3. Flujo de testing:
1. **Crear una sala** → Verificar Socket.IO
2. **Abrir en incógnito/otro navegador** → Verificar tiempo real
3. **Unirse con otro dispositivo** → Verificar sincronización
4. **Compartir enlace** → Verificar routing
5. **Interfaz móvil** → Verificar responsive design
6. **Nav fixed** → Verificar que no hay delays

## 🔧 Troubleshooting en Producción

### Problema: "No se conecta a la sala"
**Síntomas**: La página carga pero no hay conexión Socket.IO

**Soluciones**:
1. **Verificar logs**: Abre consola del navegador para ver errores
2. **Reintenta conexión**: Recarga la página 2-3 veces
3. **Vercel cold start**: Primera conexión puede tardar ~10-15 segundos
4. **Fallback a polling**: Si WebSocket falla, debería usar polling

### Configuración específica para Vercel:
- ✅ Transports: ['polling', 'websocket'] - polling primero
- ✅ Reconnection: habilitada con 5 intentos
- ✅ CORS: configurado para todo origen
- ✅ Path: '/api/socket' en producción

## 📱 URL Final

Tu aplicación estará disponible en:
- `https://tu-proyecto.vercel.app`
- Actualizaciones automáticas en cada push a main

¡Listo para producción! 🎉
