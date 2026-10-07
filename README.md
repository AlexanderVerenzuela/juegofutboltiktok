# Anime Live Detector

Detector para TikTok LIVE con asignación de personajes.

## Funciones
- Conexión al TikTok LIVE mediante `tiktok-live-connector`.
- Asignación manual de personaje.
- Asignación automática por seguimiento, regalo o comentario.
- Modo "Yo decido" para dejar eventos pendientes y aprobar/ignorar cada usuario.
- Filtro opcional por nombre de regalo.
- Panel de personajes: crear, editar, eliminar y cargar imágenes desde la interfaz.
- Configuración guardada localmente en `characters.json` y `settings.json`.
- Overlay para OBS en `/overlay.html`.

## Uso
1. Ejecuta `INICIAR_ANIME_DETECTOR.bat`.
2. Abre `http://localhost:3000`.
3. Entra a **PERSONAJES Y REGLAS** para cargar tus imágenes y configurar eventos.
4. En **LIVE**, coloca tu usuario de TikTok y conecta el LIVE.
5. Para OBS usa `http://localhost:3000/overlay.html`.

La conexión de TikTok es no oficial y puede depender de los cambios de TikTok.
