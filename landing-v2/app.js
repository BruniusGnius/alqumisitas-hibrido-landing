// =========================================================================
// ALQUIMISTAS IA - LANDING V2 - CORE LOGIC (app.js)
// Paths: ../cursos.json / ../partners.json
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Ocultar burbuja auto del chatbot
  const observer = new MutationObserver((mutationsList, obs) => {
    const widgetContainer = document.getElementById("chatwith-widget-container");
    if (widgetContainer) {
      widgetContainer.style.visibility = "hidden";
      widgetContainer.style.opacity = "0";
      widgetContainer.style.pointerEvents = "none";
      widgetContainer.style.transition = "none";
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // UTM Persistence
  const urlParams = new URLSearchParams(window.location.search);
  const queryString = window.location.search;
  if (queryString) {
    document.querySelectorAll("a[data-preserve-utm]").forEach((link) => {
      try {
        const url = new URL(link.href);
        urlParams.forEach((value, key) => url.searchParams.set(key, value));
        link.href = url.toString();
      } catch (e) {}
    });
  }

  // Partner banners
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
  }
  if (checkPartner("hyde") || checkPartner("seek")) {
    document.getElementById("hydesick-branding")?.classList.remove("hidden");
  }
});

// =========================================================================
// ALPINE.JS COMPONENTS
// =========================================================================
document.addEventListener("alpine:init", () => {

  Alpine.data("navBar", () => ({
    mobileMenuOpen: false,
    topOffset: "0px",
    init() {
      this.calculateOffset();
      window.addEventListener("resize", () => this.calculateOffset());
      setTimeout(() => this.calculateOffset(), 150);
    },
    calculateOffset() {
      const hyde = document.getElementById("hydesick-branding");
      const worko = document.getElementById("top-branding");
      let offset = 0;
      if (hyde && !hyde.classList.contains("hidden")) offset = hyde.offsetHeight;
      else if (worko && !worko.classList.contains("hidden")) offset = worko.offsetHeight;
      this.topOffset = offset + "px";
    },
    toggleChatAlkIA() {
      const launcher = document.getElementById("chatwith-launcher");
      if (launcher) launcher.click();
    },
  }));

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
    chatModalOpen: false,
    showPromoBanner: false,
    promoDismissed: false,

    get hayPromocionesActivas() {
      return (
        !!this.activePartner ||
        this.cursos.some((c) => this.esEarlyBirdActivo(c))
      );
    },

    async initData() {
      setInterval(() => { this.now = new Date().getTime(); }, 1000);

      const urlParams = new URLSearchParams(window.location.search);
      this.utmSource = urlParams.get("utm_source") || "";

      const nivelParam = urlParams.get("nivel");
      if (nivelParam) {
        this.filtroNivel = parseInt(nivelParam);
      } else if (window.location.pathname.includes("temario")) {
        this.filtroNivel = 1;
      } else {
        this.filtroNivel = "todos";
      }

      try {
        const [cursosRes, partnersRes] = await Promise.all([
          fetch("../cursos.json?v=" + new Date().getTime()),
          fetch("../partners.json?v=" + new Date().getTime()),
        ]);

        let cursosData = await cursosRes.json();
        this.partners = await partnersRes.json();

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

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) this.showPromoBanner = true;
          },
          { threshold: 0.1 }
        );
        const sectionFechas = document.getElementById("fechas");
        if (sectionFechas) observer.observe(sectionFechas);

        cursosData = cursosData.map((c) => {
          c.estado = this.calcularEstadoLogico(c);
          return c;
        });

        cursosData = cursosData.filter((c) => {
          if (window.location.pathname.includes("temario")) return true;
          return c.estado !== "cerrado";
        });

        this.cursos = cursosData.sort((a, b) => {
          const pri = { abierto: 1, waitlist: 2, proximamente: 3 };
          if (pri[a.estado] !== pri[b.estado])
            return (pri[a.estado] || 4) - (pri[b.estado] || 4);
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
      const inicio = new Date(curso.fechaInicio + "T00:00:00");
      const diff = Math.ceil((inicio - hoy) / (1000 * 60 * 60 * 24));
      if (diff < -11) return "cerrado";
      if (diff <= 60) return "abierto";
      return "proximamente";
    },

    esEarlyBirdActivo(curso) {
      if (!curso.eb_fecha_limite) return false;
      return new Date() <= new Date(curso.eb_fecha_limite + "T23:59:59");
    },

    isPartnerActivoParaCurso(curso) {
      return (
        this.activePartner &&
        (this.activePartner.aplica_a === "todos" ||
          this.activePartner.aplica_a.includes(curso.nivel))
      );
    },

    tieneDescuentoVisual(curso) {
      return this.isPartnerActivoParaCurso(curso) || this.esEarlyBirdActivo(curso);
    },

    getPrecioDescuento(curso) {
      if (this.isPartnerActivoParaCurso(curso) && this.activePartner.descuento_mxn) {
        const base = parseInt(
          (curso.reg_precio || curso.precio).toString().replace(/,/g, "")
        );
        return (base - this.activePartner.descuento_mxn).toLocaleString("en-US");
      }
      return curso.eb_precio;
    },

    tienePromoActiva(curso) {
      if (this.activePartner) {
        const aplica = this.activePartner.aplica_a;
        if (aplica === "todos" || (Array.isArray(aplica) && aplica.includes(curso.nivel)))
          return "partner";
      }
      if (this.esEarlyBirdActivo(curso)) return "earlybird";
      return false;
    },

    generarLinkStripe(curso) {
      if (!curso.stripeUrl || curso.stripeUrl.includes("provisional")) return "#";
      try {
        const url = new URL(curso.stripeUrl);
        const vendedor = this.utmSource || "directo";

        if (this.isPartnerActivoParaCurso(curso) && this.activePartner.cupon_stripe) {
          url.searchParams.set("prefilled_promo_code", this.activePartner.cupon_stripe);
        } else if (this.esEarlyBirdActivo(curso) && curso.eb_cupon_code) {
          url.searchParams.set("prefilled_promo_code", curso.eb_cupon_code);
        }

        const fechaEmail = curso.fecha_email || curso.fechaInicio;
        const horaEmail = curso.hora_email || "1800";
        const packed = `${vendedor}___${curso.id}___${fechaEmail}___${horaEmail}`;
        url.searchParams.set("client_reference_id", packed);
        if (this.utmSource) url.searchParams.set("utm_source", this.utmSource);

        return url.toString();
      } catch (e) {
        return curso.stripeUrl;
      }
    },

    obtenerCountdown(fechaLimite) {
      if (!fechaLimite) return { d: "00", h: "00", m: "00", s: "00", exp: true };
      const d = new Date(fechaLimite + "T23:59:59").getTime();
      const diff = d - this.now;
      if (diff <= 0) return { d: "00", h: "00", m: "00", s: "00", exp: true };
      return {
        d: Math.floor(diff / 86400000).toString().padStart(2, "0"),
        h: Math.floor((diff % 86400000) / 3600000).toString().padStart(2, "0"),
        m: Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0"),
        s: Math.floor((diff % 60000) / 1000).toString().padStart(2, "0"),
        exp: false,
      };
    },

    descargarICS(curso) {
      if (!curso.calendario || curso.calendario.length === 0) {
        alert("Este curso aún no tiene un calendario definido.");
        return;
      }
      let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gnius Club//Alquimistas//ES\nCALSCALE:GREGORIAN\n";
      const h = curso.hora_email || "1700";
      const hFin = (parseInt(h.substring(0, 2)) + 1).toString().padStart(2, "0") + h.substring(2);
      curso.calendario.forEach((s) => {
        const f = s.fecha.replace(/-/g, "");
        ics += `BEGIN:VEVENT\nDTSTART;TZID=America/Mexico_City:${f}T${h}00\nDTEND;TZID=America/Mexico_City:${f}T${hFin}00\nSUMMARY:Alquimistas | ${s.tema}\nDESCRIPTION:Sesión ${s.dia} — ${curso.titulo}\nEND:VEVENT\n`;
      });
      ics += "END:VCALENDAR";
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      link.download = `Alquimistas_N${curso.nivel}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    get cursosFiltrados() {
      if (this.filtroNivel === "todos") return this.cursos;
      return this.cursos.filter((c) => c.nivel === this.filtroNivel);
    },

    generarUrlConUtms(urlBase, idTarget = "") {
      try {
        const base = window.location.href.replace(/[^/]*$/, "");
        const url = new URL(base + urlBase);
        new URLSearchParams(window.location.search).forEach((v, k) =>
          url.searchParams.set(k, v)
        );
        url.hash = idTarget;
        return url.toString();
      } catch (e) {
        return urlBase;
      }
    },

    abrirModal(curso, tab = "temario") {
      this.cursoSeleccionado = curso;
      this.modalTab = tab;
      if (curso.fechaInicio) this.calDate = new Date(curso.fechaInicio + "T12:00:00");
      this.modalOpen = true;
    },

    getEstilosNivel(nivel) {
      const n = parseInt(nivel);
      if (n === 2) return { texto: "text-blue-400", badge: "bg-blue-600 text-white", borde: "border-blue-500" };
      if (n === 3) return { texto: "text-orange-400", badge: "bg-orange-600 text-white", borde: "border-orange-500" };
      if (n === 4) return { texto: "text-slate-200", badge: "bg-slate-200 text-black", borde: "border-slate-300" };
      return { texto: "text-brand-gold", badge: "bg-brand-gold text-brand-black", borde: "border-brand-gold" };
    },

    formatEBDeadline(f) {
      if (!f) return "";
      return new Date(f + "T12:00:00").toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric" });
    },
    formatEstado(e) {
      return { abierto: "Inscripciones Abiertas", cerrado: "Cerrado", proximamente: "Próximamente", waitlist: "Lista de Espera" }[e] || e;
    },
    getMonthName(f) { return new Date(f + "T12:00:00").toLocaleString("es-ES", { month: "long" }); },
    getYear(f) { return new Date(f + "T12:00:00").getFullYear(); },
    formatDateFull(f) { return new Date(f + "T12:00:00").toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric" }); },
    formatDateShort(f) { return new Date(f + "T12:00:00").toLocaleString("es-ES", { day: "numeric", month: "short" }).replace(".", ""); },
    getMonthNameShort(f) { return new Date(f + "T12:00:00").toLocaleString("es-ES", { month: "short" }); },
    getDayNum(f) { return new Date(f + "T12:00:00").getDate().toString().padStart(2, "0"); },

    changeMonth(o) {
      const d = new Date(this.calDate);
      d.setMonth(d.getMonth() + o);
      this.calDate = d;
    },
    getCalTitle() { return this.calDate.toLocaleString("es-ES", { month: "long", year: "numeric" }); },
    getCalDays() {
      const y = this.calDate.getFullYear(), m = this.calDate.getMonth();
      const fd = new Date(y, m, 1).getDay();
      const startDay = fd === 0 ? 6 : fd - 1;
      const dim = new Date(y, m + 1, 0).getDate();
      let days = [];
      for (let i = 0; i < startDay; i++) days.push({ num: "", isSession: false });
      for (let i = 1; i <= dim; i++) {
        const str = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        const isSes = this.cursoSeleccionado?.calendario?.some((s) => s.fecha === str);
        days.push({ num: i, isSession: isSes });
      }
      return days;
    },
  }));
});
