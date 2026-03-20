//<!-- ================================================= -->
//  <!-- SCRIPT 1: LÓGICA DEL CATÁLOGO, FECHAS Y UTMS (ALPINE.JS) -->
//<!-- ================================================= -->

/*
  ============================================================================
   MANUAL DE CONFIGURACIÓN Y LÓGICA DEL CATÁLOGO (ALQUIMISTAS)
  ============================================================================
  
  1. ARCHIVO DE DATOS: 'cursos.json'
     - Toda la información se edita en ese archivo.
  
  2. CAMPO 'ESTADO' (PRIORIDAD DE VISIBILIDAD):
     El sistema decide si muestra el curso Abierto, Cerrado o Próximamente basándose en esto:
     
     OPCIÓN A: CONTROL MANUAL (Prioridad Alta)
     Si escribes explícitamente uno de estos valores en el JSON, el sistema OBEDECE sin importar la fecha:
     - "abierto"      -> Botón de compra activo (Verde/Dorado/Cian).
     - "cerrado"      -> Tarjeta gris, botón deshabilitado (Rojo).
     - "waitlist"     -> Botón "Lista de Espera" (Azul).
     - "proximamente" -> Botón "Próximamente" (Azul).

     OPCIÓN B: MODO AUTOMÁTICO (Prioridad Lógica)
     Si escribes "auto" en el JSON, el sistema calcula el estado según la fecha de hoy:
     - Si la fecha ya pasó ................... -> "cerrado"
     - Si faltan 45 días o menos ............. -> "abierto" (Ventas activas)
     - Si faltan más de 45 días .............. -> "proximamente"

  3. COLORES POR NIVEL (Visual):
     - Nivel 1: Usa la paleta DORADA (Brand Gold).
     - Nivel 2: Usa la paleta CIAN / AZUL NEÓN (Cyan-400) para diferenciarlo.

  4. RASTREO DE VENTAS (UTMS):
     - El script detecta automáticamente ?utm_source=VENDEDOR en la URL del navegador.
     - Inyecta ese valor en el link de Stripe como 'client_reference_id'.
     - Esto permite que Zapier sepa quién vendió el curso.
  ============================================================================
  */
function catalogoCursos() {
  return {
    cargando: true,
    cursos: [],
    filtroNivel: "todos",
    modalOpen: false,
    modalTab: "temario", // 'temario' o 'calendario'
    calDate: new Date(), // Fecha que controla la vista del calendario
    cursoSeleccionado: null,
    utmSource: "",

    async initData() {
      const urlParams = new URLSearchParams(window.location.search);
      this.utmSource = urlParams.get("utm_source") || "";

      try {
        // Agregamos ?v=hora_actual para evitar que el celular use una versión vieja guardada
        const response = await fetch("cursos.json?v=" + new Date().getTime());
        let data = await response.json();

        // 1. Calcular estados (Abierto, Cerrado, Proximamente)
        data = data.map((curso) => {
          curso.estado = this.calcularEstadoLogico(curso);
          return curso;
        });

        // 2. FILTRAR: Eliminar cursos cerrados (ya no se mostrarán)
        data = data.filter((curso) => curso.estado !== "cerrado");

        // 3. ORDENAR: Prioridad Estado (Abiertos primero) > Luego Fecha
        this.cursos = data.sort((a, b) => {
          // Definimos prioridades: 1=Abierto (Top), 2=Waitlist, 3=Proximamente
          const prioridades = { abierto: 1, waitlist: 2, proximamente: 3 };

          const prioA = prioridades[a.estado] || 4; // 4 si es otro estado
          const prioB = prioridades[b.estado] || 4;

          // Si tienen diferente prioridad, gana el más importante (menor número)
          if (prioA !== prioB) {
            return prioA - prioB;
          }

          // Si tienen la misma prioridad, desempata por fecha (el más próximo primero)
          return new Date(a.fechaInicio) - new Date(b.fechaInicio);
        });
      } catch (error) {
        console.error("Error cargando cursos:", error);
      } finally {
        this.cargando = false;
      }
    },

    // NUEVA FUNCIÓN: EL CEREBRO DE LA DISPONIBILIDAD (Con 14 días de gracia)
    calcularEstadoLogico(curso) {
      // 1. PRIORIDAD JSON: Si NO dice "auto", obedecemos al JSON explícitamente
      if (curso.estado !== "auto") {
        return curso.estado;
      }

      // 2. LÓGICA JS (Si dice "auto"): Calculamos según fechas
      const hoy = new Date();
      // Agregamos hora para evitar problemas de zona horaria
      const inicioCurso = new Date(curso.fechaInicio + "T00:00:00");

      // Calculamos diferencia en días
      const diferenciaTiempo = inicioCurso - hoy;
      const diferenciaDias = Math.ceil(
        diferenciaTiempo / (1000 * 60 * 60 * 24)
      );

      /* REGLA DE TIEMPO:
                       - Menor a -11 (Pasaron 11 días o más) -> CERRADO
                       - Entre -14 y 45 (Desde hace 2 semanas hasta dentro de mes y medio) -> ABIERTO
                       - Mayor a 45 (Falta mucho) -> PRÓXIMAMENTE
                    */
      if (diferenciaDias < -11) {
        return "cerrado";
      } else if (diferenciaDias <= 60) {
        return "abierto";
      } else {
        return "proximamente";
      }
    },

    // Función de estilos por nivel (La que hicimos antes)
    // ESTILOS VISUALES POR NIVEL (PALETA EJECUTIVA / PREMIUM)
    getEstilosNivel(nivel) {
      const n = parseInt(nivel);

      switch (n) {
        case 2: // NIVEL 2: ACERO / AZUL REAL (Automatización seria)
          return {
            texto: "text-blue-400", // Azul claro pero no neón
            badge: "bg-blue-600 text-white", // Azul sólido corporativo
            borde: "border-blue-500",
            shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]", // Sombra azul sutil
          };

        case 3: // NIVEL 3: COBRE (Arquitectura / Estructura)
          return {
            texto: "text-orange-400", // Tono cobre/terracota
            badge: "bg-orange-600 text-white",
            borde: "border-orange-500",
            shadow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
          };

        case 4: // NIVEL 4: PLATINO (Maestría / Exclusivo)
          return {
            texto: "text-slate-200", // Blanco casi gris (Plata)
            badge: "bg-slate-200 text-black",
            borde: "border-slate-300",
            shadow: "shadow-[0_0_20px_rgba(255,255,255,0.25)]", // Resplandor blanco elegante
          };

        default: // NIVEL 1: ORO (Alquimista)
          return {
            texto: "text-brand-gold",
            badge: "bg-brand-gold text-brand-black",
            borde: "border-brand-gold",
            shadow: "shadow-[0_0_20px_rgba(240,185,11,0.2)]",
          };
      }
    },

    // Resto de helpers (No cambian)
    get cursosFiltrados() {
      if (this.filtroNivel === "todos") return this.cursos;
      return this.cursos.filter((c) => c.nivel === this.filtroNivel);
    },

    abrirModal(curso, tab = "temario") {
      this.cursoSeleccionado = curso;
      this.modalTab = tab;
      // Inicializar calendario en la fecha de inicio del curso
      this.calDate = new Date(curso.fechaInicio + "T12:00:00");
      this.modalOpen = true;
    },

    // GENERADOR DE LINKS STRIPE (ARQUITECTURA HÍBRIDA V4 - BLINDADA)
    // GENERADOR DE LINKS STRIPE (ARQUITECTURA V7 - 4 DATOS ÓPTIMOS)
    generarLinkStripe(curso) {
      if (!curso.stripeUrl) return "#";

      try {
        const url = new URL(curso.stripeUrl);
        const vendedor = this.utmSource || "directo";

        // Lógica Legacy Nivel 1 (Se mantiene intacta)
        if (curso.nivel === 1) {
          if (this.utmSource) {
            url.searchParams.set("client_reference_id", this.utmSource);
            url.searchParams.set("utm_source", this.utmSource);
          }
        }
        // Nueva Lógica Nivel 2 en adelante
        else {
          // Fechas limpias desde el JSON (con fallback de seguridad)
          const fechaLimpia = curso.fecha_email || curso.fechaInicio;
          const horaLimpia = curso.hora_email || "1700";

          // PAQUETE FINAL (4 datos): Vendedor ___ ID_Cohorte ___ Fecha_Email ___ Hora_Email
          const packedData = `${vendedor}___${curso.id}___${fechaLimpia}___${horaLimpia}`;

          url.searchParams.set("client_reference_id", packedData);

          // Mantenemos el UTM Source original por seguridad y analíticas
          if (this.utmSource) {
            url.searchParams.set("utm_source", this.utmSource);
          }
        }

        return url.toString();
      } catch (e) {
        return curso.stripeUrl;
      }
    },

    formatEstado(estado) {
      const map = {
        abierto: "Inscripciones Abiertas",
        cerrado: "Cerrado",
        proximamente: "Próximamente",
        waitlist: "Lista de Espera",
      };
      return map[estado] || estado;
    },

    getMonthName(fechaStr) {
      const date = new Date(fechaStr + "T12:00:00");
      return date.toLocaleString("es-ES", { month: "long" });
    },

    getYear(fechaStr) {
      const date = new Date(fechaStr + "T12:00:00");
      return date.getFullYear();
    },

    formatDateFull(fechaStr) {
      const date = new Date(fechaStr + "T12:00:00");
      return date.toLocaleString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }, // --- NUEVOS HELPERS PARA CALENDARIO ---

    // Obtener mes corto (ej: "abr")
    getMonthNameShort(fechaStr) {
      if (!fechaStr) return "";
      const date = new Date(fechaStr + "T12:00:00");
      return date.toLocaleString("es-ES", { month: "short" });
    },

    // Obtener número del día (ej: "20")
    getDayNum(fechaStr) {
      if (!fechaStr) return "";
      const date = new Date(fechaStr + "T12:00:00");
      return date.getDate().toString().padStart(2, "0");
    },

    // Generador Mágico de Archivo .ICS (CORREGIDO: 1 Hora + Nombre Amigable)
    descargarICS(curso) {
      if (!curso.calendario || curso.calendario.length === 0) {
        alert("Este curso aún no tiene un calendario definido.");
        return;
      }

      // Encabezado estándar
      let icsContent =
        "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gnius Club//Alquimistas//ES\nCALSCALE:GREGORIAN\n";

      // Configuración de Horario
      const horaInicio = curso.hora_email || "1700"; // Ej: "1700" (5 PM)
      const horaStr = horaInicio + "00"; // Formato ICS: 170000

      // CÁLCULO DURACIÓN: 1 HORA
      let horaNum = parseInt(horaInicio.substring(0, 2));
      let horaFinNum = horaNum + 1; // <--- AQUÍ CAMBIÓ (Antes era +2)

      // Reconstruimos la hora de fin (ej: 180000)
      const horaFinStr =
        horaFinNum.toString().padStart(2, "0") + horaInicio.substring(2) + "00";

      // Crear eventos
      curso.calendario.forEach((sesion) => {
        const fechaClean = sesion.fecha.replace(/-/g, ""); // 2026-04-20 -> 20260420

        icsContent += "BEGIN:VEVENT\n";
        icsContent += `DTSTART;TZID=America/Mexico_City:${fechaClean}T${horaStr}\n`;
        icsContent += `DTEND;TZID=America/Mexico_City:${fechaClean}T${horaFinStr}\n`;
        icsContent += `SUMMARY:Alquimistas | ${sesion.tema}\n`;
        icsContent += `DESCRIPTION:Sesión ${sesion.dia} del curso: ${curso.titulo}\\nNivel: ${curso.nivel}\nImportante: Conéctate puntual.\n`;
        icsContent += "END:VEVENT\n";
      });

      icsContent += "END:VCALENDAR";

      // Generar descarga con NOMBRE AMIGABLE
      const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);

      // Nombre limpio: "Calendario_Alquimistas_Nivel_2.ics"
      const nombreArchivo = `Calendario_Alquimistas_Nivel_${curso.nivel}.ics`;
      link.setAttribute("download", nombreArchivo);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    // --- LÓGICA DEL MINI CALENDARIO MACOS ---

    // Cambiar mes (-1 o +1)
    changeMonth(offset) {
      const newDate = new Date(this.calDate);
      newDate.setMonth(newDate.getMonth() + offset);
      this.calDate = newDate;
    },

    // Obtener nombre del mes y año visible
    getCalTitle() {
      return this.calDate.toLocaleString("es-ES", {
        month: "long",
        year: "numeric",
      });
    },

    // Generar los días (VERSIÓN COMPATIBLE CON SAFARI/IPHONE)
    // Generar los días (VERSIÓN COMPATIBLE CON SAFARI/IPHONE)
    getCalDays() {
      const year = this.calDate.getFullYear();
      const month = this.calDate.getMonth();

      // Ajuste: Safari prefiere YYYY/MM/DD para cálculos internos si usamos strings
      // Pero aquí usamos objetos Date directos, que es más seguro.

      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      let days = [];

      for (let i = 0; i < startDay; i++) {
        days.push({ num: "", isSession: false });
      }

      for (let i = 1; i <= daysInMonth; i++) {
        // Construimos la fecha comparativa en formato estándar ISO (YYYY-MM-DD)
        // Esto funciona porque comparamos texto con texto del JSON
        const currentStr = `${year}-${String(month + 1).padStart(
          2,
          "0"
        )}-${String(i).padStart(2, "0")}`;

        // Validación extra: Aseguramos que 'calendario' exista antes de buscar
        const hasCalendar =
          this.cursoSeleccionado.calendario &&
          Array.isArray(this.cursoSeleccionado.calendario);

        const isSession =
          hasCalendar &&
          this.cursoSeleccionado.calendario.some((s) => s.fecha === currentStr);

        days.push({ num: i, isSession: isSession });
      }

      return days;
    },
  };
}
//</script>

// <!-- SCRIPT: VISIBILIDAD BRANDING WORKOSFERA (Top & Bottom) -->
//<script>
document.addEventListener("DOMContentLoaded", function () {
  // 1. Obtenemos los parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const keyword = "workosfera";

  // 2. Verificamos si algún parámetro UTM contiene la palabra clave
  const isWorkosfera =
    urlParams.get("utm_source")?.toLowerCase().includes(keyword) ||
    urlParams.get("utm_medium")?.toLowerCase().includes(keyword) ||
    urlParams.get("utm_campaign")?.toLowerCase().includes(keyword) ||
    urlParams.get("ref")?.toLowerCase().includes(keyword);

  // 3. Si se cumple, mostramos AMBOS elementos
  if (isWorkosfera) {
    // Mostrar Barra Superior
    const topBar = document.getElementById("top-branding");
    if (topBar) topBar.classList.remove("hidden");

    // Mostrar Sección Inferior (Alianza)
    const bottomSection = document.getElementById("alianza");
    if (bottomSection) bottomSection.classList.remove("hidden");

    console.log("Modo Workosfera activado");
  }
});
//</script>
