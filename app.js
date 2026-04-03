// =========================================================================
// ALQUIMISTAS IA - CORE LOGIC (app.js)
// Arquitectura MVP Conservador - Lógica compartida para Ecosistema 3 Páginas
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // --- NUEVO: Chatbot Synchronization Logic ---
  // Este código es un "vigilante" que espera a que Chatwith cree su burbuja,
  // y solo entonces la vuelve invisible para que no estorbe.
  const observer = new MutationObserver((mutationsList, obs) => {
    const widgetContainer = document.getElementById(
      "chatwith-widget-container"
    );
    if (widgetContainer) {
      widgetContainer.style.visibility = "hidden";
      widgetContainer.style.opacity = "0";
      widgetContainer.style.pointerEvents = "none";
      widgetContainer.style.transition = "none"; // Evita animaciones al ocultar

      // Una vez que lo encontramos y ocultamos, dejamos de vigilar.
      obs.disconnect();
    }
  });
  // Empezamos a vigilar el <body> para cuando se añadan nuevos elementos.
  observer.observe(document.body, { childList: true, subtree: true });
  // 1. SISTEMA DE PERSISTENCIA DE UTMs (Evita perder el tracking / descuentos)
  const urlParams = new URLSearchParams(window.location.search);
  const queryString = window.location.search;

  if (queryString) {
    // Seleccionamos todos los links que deben preservar UTMs
    const links = document.querySelectorAll("a[data-preserve-utm]");
    links.forEach((link) => {
      try {
        const url = new URL(link.href);
        // Inyectamos todas las UTMs actuales en el href objetivo conservando el #hash
        urlParams.forEach((value, key) => {
          url.searchParams.set(key, value);
        });
        link.href = url.toString();
      } catch (e) {
        console.error("Error al preservar UTM en link:", link.href);
      }
    });
  }

  // 2. SISTEMA DE DETECCIÓN DE PARTNERS (Branding)
  function checkPartner(keyword) {
    return (
      urlParams.get("utm_source")?.toLowerCase().includes(keyword) ||
      urlParams.get("utm_medium")?.toLowerCase().includes(keyword) ||
      urlParams.get("utm_campaign")?.toLowerCase().includes(keyword) ||
      urlParams.get("ref")?.toLowerCase().includes(keyword)
    );
  }

  if (checkPartner("workosfera")) {
    document.getElementById("top-branding")?.classList.remove("hidden");
    document.getElementById("alianza")?.classList.remove("hidden");
  }

  if (checkPartner("hyde") || checkPartner("seek")) {
    document.getElementById("hydesick-branding")?.classList.remove("hidden");
    document.getElementById("alianza-hyde")?.classList.remove("hidden");
  }
});

// =========================================================================
// ALPINE.JS - COMPONENTES GLOBALES
// =========================================================================
document.addEventListener("alpine:init", () => {
  // A. Componente de Navegación Global (Conexión con Widget Original)
  Alpine.data("navBar", () => ({
    mobileMenuOpen: false,
    topOffset: "0px",

    init() {
      this.calculateOffset();
      window.addEventListener("resize", () => this.calculateOffset());
      setTimeout(() => this.calculateOffset(), 100);
    },

    calculateOffset() {
      const hyde = document.getElementById("hydesick-branding");
      const worko = document.getElementById("top-branding");
      let offset = 0;
      if (hyde && !hyde.classList.contains("hidden"))
        offset = hyde.offsetHeight;
      else if (worko && !worko.classList.contains("hidden"))
        offset = worko.offsetHeight;
      this.topOffset = offset + "px";
    },

    // FUNCIÓN CONTROL REMOTO PARA EL CHAT
    toggleChatAlkIA() {
      // Buscamos el botón original del widget (el launcher)
      const launcher = document.getElementById("chatwith-launcher");
      if (launcher) {
        launcher.click(); // Simulamos el clic físico
      } else {
        console.error("El widget de AlkIA aún no ha cargado.");
      }
    },
  }));
  // B. Componente Principal de Cursos (Neuromarketing y Precios - INTACTO)
  Alpine.data("catalogoCursos", () => ({
    cargando: true,
    cursos: [],
    partners: [],
    activePartner: null,
    filtroNivel: "todos",
    modalOpen: false,
    modalTab: "temario",
    calDate: new Date(),
    cursoSeleccionado: null,
    utmSource: "",
    now: new Date().getTime(),
    showPromoBanner: false,
    promoDismissed: false,

    get hayPromocionesActivas() {
      return this.cursos.some((curso) => this.esEarlyBirdActivo(curso));
    },

    async initData() {
      const urlParams = new URLSearchParams(window.location.search);
      this.utmSource = urlParams.get("utm_source") || "";

      // --- LÓGICA DE CONTEXTO ---
      const nivelParam = urlParams.get("nivel");

      if (nivelParam) {
        // Si la URL dice ?nivel=2, todas las páginas obedecen y filtran.
        this.filtroNivel = parseInt(nivelParam);
      } else if (window.location.pathname.includes("temarios.html")) {
        // Si estamos en temarios y NO hay parámetro, forzamos Nivel 1.
        this.filtroNivel = 1;
      } else {
        // En index.html y fechas.html, el default es mostrar "todos".
        this.filtroNivel = "todos";
      }
      // ---------------------------

      // El fetch debe ser relativo (sin la / al inicio)
      // para que funcione igual en local y en servidor.
      try {
        const [cursosResponse, partnersResponse] = await Promise.all([
          fetch("cursos.json?v=" + new Date().getTime()),
          fetch("partners.json?v=" + new Date().getTime()),
        ]);

        let cursosData = await cursosResponse.json();
        this.partners = await partnersResponse.json();

        const utmString =
          (urlParams.get("utm_source") || "") + (urlParams.get("ref") || "");
        if (utmString) {
          this.activePartner =
            this.partners.find((p) =>
              p.keywords.some((k) =>
                utmString.toLowerCase().includes(k.toLowerCase())
              )
            ) || null;
        }

        cursosData = cursosData.map((curso) => {
          curso.estado = this.calcularEstadoLogico(curso);
          return curso;
        });

        cursosData = cursosData.filter((curso) => curso.estado !== "cerrado");

        this.cursos = cursosData.sort((a, b) => {
          const prioridades = { abierto: 1, waitlist: 2, proximamente: 3 };
          if (prioridades[a.estado] !== prioridades[b.estado]) {
            return (prioridades[a.estado] || 4) - (prioridades[b.estado] || 4);
          }
          return new Date(a.fechaInicio) - new Date(b.fechaInicio);
        });
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        this.cargando = false;
      }
    },

    calcularEstadoLogico(curso) {
      if (curso.estado !== "auto") return curso.estado;
      const hoy = new Date();
      const inicioCurso = new Date(curso.fechaInicio + "T00:00:00");
      const diferenciaDias = Math.ceil(
        (inicioCurso - hoy) / (1000 * 60 * 60 * 24)
      );

      if (diferenciaDias < -11) return "cerrado";
      else if (diferenciaDias <= 60) return "abierto";
      else return "proximamente";
    },

    esEarlyBirdActivo(curso) {
      if (!curso.eb_fecha_limite) return false;
      const hoy = new Date();
      const limite = new Date(curso.eb_fecha_limite + "T23:59:59");
      return hoy <= limite;
    },

    isPartnerActivoParaCurso(curso) {
      return (
        this.activePartner &&
        (this.activePartner.aplica_a === "todos" ||
          this.activePartner.aplica_a.includes(curso.nivel))
      );
    },

    tieneDescuentoVisual(curso) {
      return (
        this.isPartnerActivoParaCurso(curso) || this.esEarlyBirdActivo(curso)
      );
    },

    getPrecioDescuento(curso) {
      if (
        this.isPartnerActivoParaCurso(curso) &&
        this.activePartner.descuento_mxn
      ) {
        const regNum = parseInt(
          (curso.reg_precio || curso.precio).toString().replace(/,/g, "")
        );
        return (regNum - this.activePartner.descuento_mxn).toLocaleString(
          "en-US"
        );
      }
      return curso.eb_precio;
    },

    generarLinkStripe(curso) {
      if (!curso.stripeUrl || curso.stripeUrl.includes("provisional"))
        return "#";
      try {
        const url = new URL(curso.stripeUrl);
        const vendedor = this.utmSource || "directo";

        if (this.isPartnerActivoParaCurso(curso)) {
          url.searchParams.set(
            "prefilled_promo_code",
            this.activePartner.cupon_stripe
          );
        } else if (this.esEarlyBirdActivo(curso) && curso.eb_cupon_code) {
          url.searchParams.set("prefilled_promo_code", curso.eb_cupon_code);
        }

        if (curso.nivel === 1) {
          if (this.utmSource)
            url.searchParams.set("client_reference_id", this.utmSource);
        } else {
          const fechaEmail = curso.fecha_email || curso.fechaInicio;
          const horaEmail = curso.hora_email || "1800";
          const packedData = `${vendedor}___${curso.id}___${fechaEmail}___${horaEmail}`;
          url.searchParams.set("client_reference_id", packedData);
        }

        if (this.utmSource) url.searchParams.set("utm_source", this.utmSource);
        return url.toString();
      } catch (e) {
        return curso.stripeUrl;
      }
    },

    obtenerCountdown(fechaLimite) {
      if (!fechaLimite)
        return { d: "00", h: "00", m: "00", s: "00", exp: true };
      const d = new Date(fechaLimite + "T23:59:59").getTime();
      const diff = d - this.now;
      if (diff <= 0) return { d: "00", h: "00", m: "00", s: "00", exp: true };
      return {
        d: Math.floor(diff / (1000 * 60 * 60 * 24))
          .toString()
          .padStart(2, "0"),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          .toString()
          .padStart(2, "0"),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          .toString()
          .padStart(2, "0"),
        s: Math.floor((diff % (1000 * 60)) / 1000)
          .toString()
          .padStart(2, "0"),
        exp: false,
      };
    },

    descargarICS(curso) {
      if (!curso.calendario || curso.calendario.length === 0) {
        alert("Este curso aún no tiene un calendario definido.");
        return;
      }
      let icsContent =
        "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gnius Club//Alquimistas//ES\nCALSCALE:GREGORIAN\n";
      const horaInicio = curso.hora_email || "1700";
      const horaStr = horaInicio + "00";
      let horaNum = parseInt(horaInicio.substring(0, 2));
      let horaFinNum = horaNum + 1;
      const horaFinStr =
        horaFinNum.toString().padStart(2, "0") + horaInicio.substring(2) + "00";

      curso.calendario.forEach((sesion) => {
        const fechaClean = sesion.fecha.replace(/-/g, "");
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `DTSTART;TZID=America/Mexico_City:${fechaClean}T${horaStr}\n`;
        icsContent += `DTEND;TZID=America/Mexico_City:${fechaClean}T${horaFinStr}\n`;
        icsContent += `SUMMARY:Alquimistas | ${sesion.tema}\n`;
        icsContent += `DESCRIPTION:Sesión ${sesion.dia} del curso: ${curso.titulo}\\nNivel: ${curso.nivel}\n`;
        icsContent += "END:VEVENT\n";
      });
      icsContent += "END:VCALENDAR";
      const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `Calendario_Alquimistas_Nivel_${curso.nivel}.ics`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    get cursosFiltrados() {
      if (this.filtroNivel === "todos") return this.cursos;
      return this.cursos.filter((c) => c.nivel === this.filtroNivel);
    },

    // Helper para inyectar UTM en links de programática
    generarUrlConUtms(urlBase, idTarget = "") {
      const url = new URL(window.location.origin + "/" + urlBase);
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.forEach((value, key) => url.searchParams.set(key, value));
      url.hash = idTarget;
      return url.toString();
    },

    abrirModal(curso, tab = "temario") {
      this.cursoSeleccionado = curso;
      this.modalTab = tab;
      if (curso.fechaInicio)
        this.calDate = new Date(curso.fechaInicio + "T12:00:00");
      this.modalOpen = true;
    },

    getEstilosNivel(nivel) {
      const n = parseInt(nivel);
      if (n === 2)
        return {
          texto: "text-blue-400",
          badge: "bg-blue-600 text-white",
          borde: "border-blue-500",
          shadow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
        };
      if (n === 3)
        return {
          texto: "text-orange-400",
          badge: "bg-orange-600 text-white",
          borde: "border-orange-500",
          shadow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
        };
      if (n === 4)
        return {
          texto: "text-slate-200",
          badge: "bg-slate-200 text-black",
          borde: "border-slate-300",
          shadow: "shadow-[0_0_20px_rgba(255,255,255,0.25)]",
        };
      return {
        texto: "text-brand-gold",
        badge: "bg-brand-gold text-brand-black",
        borde: "border-brand-gold",
        shadow: "shadow-[0_0_20px_rgba(240,185,11,0.2)]",
      };
    },

    // Utilidades de formato visual mantenidas idénticas
    formatEBDeadline(fechaStr) {
      if (!fechaStr) return "";
      return new Date(fechaStr + "T12:00:00").toLocaleString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
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
      return new Date(fechaStr + "T12:00:00").toLocaleString("es-ES", {
        month: "long",
      });
    },
    getYear(fechaStr) {
      return new Date(fechaStr + "T12:00:00").getFullYear();
    },
    formatDateFull(fechaStr) {
      return new Date(fechaStr + "T12:00:00").toLocaleString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },
    formatDateShort(fechaStr) {
      return new Date(fechaStr + "T12:00:00")
        .toLocaleString("es-ES", { day: "numeric", month: "short" })
        .replace(".", "");
    },
    getMonthNameShort(fechaStr) {
      return new Date(fechaStr + "T12:00:00").toLocaleString("es-ES", {
        month: "short",
      });
    },
    getDayNum(fechaStr) {
      return new Date(fechaStr + "T12:00:00")
        .getDate()
        .toString()
        .padStart(2, "0");
    },

    changeMonth(offset) {
      const newDate = new Date(this.calDate);
      newDate.setMonth(newDate.getMonth() + offset);
      this.calDate = newDate;
    },
    getCalTitle() {
      return this.calDate.toLocaleString("es-ES", {
        month: "long",
        year: "numeric",
      });
    },

    getCalDays() {
      const year = this.calDate.getFullYear();
      const month = this.calDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Inicialización modificada para evitar el bug del parser
      let arregloDias = new Array();

      for (let i = 0; i < startDay; i++) {
        arregloDias.push({ num: "", isSession: false });
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const currentStr = `${year}-${String(month + 1).padStart(
          2,
          "0"
        )}-${String(i).padStart(2, "0")}`;
        const isSession =
          this.cursoSeleccionado &&
          this.cursoSeleccionado.calendario &&
          this.cursoSeleccionado.calendario.some((s) => s.fecha === currentStr);

        arregloDias.push({ num: i, isSession: isSession });
      }
      return arregloDias;
    },
  })); // Cierra el objeto Alpine.data('catalogoCursos')
});
