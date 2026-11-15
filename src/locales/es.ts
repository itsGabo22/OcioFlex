import type { DeepStr } from "./types";
import type { Dict } from "./en";

export const es: DeepStr<Dict> = {
  nav: { home: "Inicio", focus: "Trabajo profundo", rest: "Entretenimiento", settings: "Ajustes", collapse: "Contraer barra lateral", expand: "Expandir barra lateral", main: "Navegación principal", running: "En curso" },
  ctx: { foco: "Foco", ocio: "Ocio", label: "Ambiente", focoHint: "Nítido y en calma", ocioHint: "Cálido y suelto" },
  common: {
    start: "Empezar", pause: "Pausar", resume: "Reanudar", reset: "Reiniciar", stop: "Terminar", save: "Guardar", cancel: "Cancelar", delete: "Quitar", edit: "Editar", add: "Añadir",
    open: "Abrir", regenerate: "Regenerar", retry: "Reintentar", close: "Cerrar", min: "min", loading: "Pensando…", skip: "Omitir", today: "Hoy",
    h: "h", m: "m", days: "{n} días", day: "{n} día", sessions: "{n} sesiones", session: "{n} sesión",
  },
  ai: {
    demo: "Demo", live: "En vivo", demoTip: "Mostrando respuestas de ejemplo. Añade una clave API en Ajustes para activarlo.", liveTip: "Respuestas generadas por tu proveedor de IA.",
    error: "El asistente no pudo responder. Te muestro un ejemplo.", poweredBy: "Asistente IA",
  },
  home: {
    morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches",
    sub: "Tu día, en equilibrio.", startSession: "Iniciar una sesión",
    focusToday: "de foco hoy", restToday: "de ocio hoy", balance: "Equilibrio", balanceHint: "foco : ocio",
    statSessions: "Sesiones de hoy", statStreak: "Racha de foco", statBest: "Mejor día",
    heatTitle: "Últimas 12 semanas", heatSub: "Minutos de foco por día", less: "Menos", more: "Más",
    weekTitle: "Esta semana", weekSub: "Minutos de foco",
    coachTitle: "Coach de equilibrio", coachSub: "Una lectura de tus últimos 7 días", coachCta: "Leer mi semana", coachTweak: "Prueba esto",
    heroAlt: "Esfera decorativa que sigue tu ambiente",
  },
  focus: {
    eyebrow: "Trabajo profundo", title: "Una sola cosa, a fondo.", taskLabel: "¿En qué vas a trabajar?", taskPlaceholder: "Redactar el informe de diseño…",
    ready: "Listo", running: "En foco", paused: "En pausa", done: "Sesión completada", minutesLeft: "Quedan {n} min",
    presets: "Duración", split: "Dividir con IA", splitting: "Planificando…", splitTitle: "Divisor de tareas", splitSub: "Convierte una tarea en bloques de foco",
    splitNeedTask: "Escribe primero una tarea.", useBlock: "Usar", block: "Bloque {n}",
    todayTitle: "Hoy", todayEmpty: "Aún no hay sesiones", todayEmptyHint: "Tu primer bloque aparecerá aquí.",
    saved: "Sesión guardada", planned: "{n} min previstos",
  },
  rest: {
    eyebrow: "Entretenimiento", title: "Descansar, a propósito.", timerLabel: "Tiempo libre", idle: "Cuando quieras", running: "Desconectando", paused: "En pausa",
    suggestTitle: "Sugeridor de descansos", suggestSub: "¿Cómo te sientes ahora mismo?", suggestCta: "Sugerir un descanso", suggestEmpty: "Elige un ánimo y recibe tres ideas.",
    moods: { tired: "Agotado", restless: "Inquieto", curious: "Curioso" },
    mediaTitle: "Acceso rápido", mediaSub: "Tus formas favoritas de desconectar", addMedia: "Añadir acceso", mediaEmpty: "Aún no hay accesos", mediaEmptyHint: "Añade un juego, una lista o un libro para abrirlo con un clic.",
    form: { title: "Acceso", name: "Nombre", url: "Enlace", namePh: "Lista de la noche", urlPh: "https://…", platform: "Tipo", invalid: "Usa un enlace que empiece por https://, steam:// o spotify:" },
    kinds: { game: "Juego", video: "Vídeo", music: "Música", book: "Libro", other: "Otro" },
    defaults: { game: "Elige un juego", video: "Algo para ver", music: "Música para la tarde", book: "Siguiente capítulo" },
    savedSession: "Descanso registrado",
  },
  settings: {
    title: "Ajustes", sub: "Haz OcioFlex a tu medida.",
    language: "Idioma", languageSub: "Se aplica al instante, en todas partes.", spanish: "Español", english: "English",
    context: "Ambiente", contextSub: "Cada página cambia de ambiente sola; puedes forzarlo cuando quieras.", focoDesc: "Verde profundo sobre marfil. Calma y precisión.", ocioDesc: "Albaricoque sobre rubor. Cálido y relajado.",
    ai: {
      title: "Asistente de IA", sub: "Impulsa el Coach, el Divisor y el Sugeridor de descansos.", status: "Estado", demoOn: "Modo demo: respuestas de ejemplo, sin red.", liveOn: "En vivo: conectado a {provider} ({model}).",
      keyLabel: "Clave API", keyPh: "Pega tu clave; no volverá a mostrarse", saveKey: "Guardar clave", removeKey: "Quitar la clave guardada", configured: "Hay una clave configurada", notConfigured: "Sin clave configurada",
      privacy: "La clave la guarda solo el núcleo de escritorio y nunca llega a la interfaz.", browserOnly: "Guardar la clave requiere la app de escritorio.",
    },
    data: { seedTasks: "Informe de diseño|Prototipo de interfaz|Lectura|Revisión de código|Sesión de estudio|Wireframes|Presentación|Notas de investigación", title: "Datos", sub: "Todo se queda en este equipo.", reset: "Restablecer datos de demostración", resetHint: "Sustituye tu historial por sesiones de ejemplo nuevas.", confirm: "Pulsa de nuevo para confirmar" },
    about: { title: "Acerca de", version: "Versión {v}", credits: "Fuentes: Fraunces, Instrument Sans, Geist Mono (SIL OFL). Iconos: Lucide (ISC). 3D: three.js (MIT)." },
  },
  toast: {
    sessionSaved: "Sesión guardada", restSaved: "Descanso registrado", keySaved: "Clave guardada de forma segura", keyRemoved: "Clave eliminada", dataReset: "Datos de demostración restaurados",
    aiFallback: "Asistente no disponible: te muestro un ejemplo", linkBlocked: "Ese enlace no está permitido", mediaSaved: "Acceso guardado", mediaRemoved: "Acceso eliminado",
  },
};
