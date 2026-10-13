### Principales cambios que incluí:

1.  **JSON V2 (Rico):** Actualicé el bloque de código de ejemplo para mostrar la estructura con `storytelling`, `kickoff` y `sprints` detallados.
2.  **Soporte HTML:** Agregué una nota importante explicando que se pueden usar etiquetas como `<strong>` y `<br>` dentro del texto.
3.  **Kickoff:** Se documentó el nuevo campo para la fecha de onboarding.

Copia y pega todo el bloque siguiente:

---

````markdown
# 📘 Documentación Técnica: Landing Page Alquimistas

**Proyecto:** Catálogo de Cursos Alquimistas de IA (Gnius Club)  
**Tecnología:** HTML5 + TailwindCSS + Alpine.js (Sin base de datos SQL)  
**Gestión de Datos:** Archivo JSON local (`cursos.json`)

---

## 1. Arquitectura del Sitio

El sitio utiliza una arquitectura **"Static + JSON"**. Esto significa que no requiere un backend complejo (como PHP o Node.js) ni base de datos para mostrar el catálogo.

La lógica es manejada por **Alpine.js** directamente en el navegador del cliente, lo que garantiza velocidad extrema y facilidad de actualización.

### Estructura de Archivos Clave

- `index.html`: Contiene la estructura visual, el Modal V5 y los scripts de lógica.
- `cursos.json`: **La base de datos.** Aquí se agregan, editan o borran cursos.
- `assets/`: Imágenes y recursos estáticos.

---

## 2. Gestión del Catálogo (`cursos.json`)

Para actualizar la sección de "Fechas e Inscripción" y la información del **Pop-up de Detalles**, modifica el archivo `cursos.json`.

⚠️ **IMPORTANTE:** El sistema ahora soporta **HTML dentro del JSON**. Puedes usar etiquetas como `<strong>` (negritas) o `<br>` (salto de línea) en las descripciones para dar formato.

### Estructura Maestra de un Curso (V2)

```json
{
  "id": "n1-feb23",
  "nivel": 1,
  "titulo": "Prompt Estratégico",
  "subtitulo": "Del “chatear” a dirigir con precisión.",
  "fechaInicio": "2026-02-23",
  "kickoff": "Jueves 19 Feb",
  "horario": "Lu y Ju 7:00 PM <br> (CDMX)",
  "stripeUrl": "https://buy.stripe.com/...",
  "estado": "auto",
  "imagen": "assets/cover.jpg",

  "descripcion": "Descripción corta para el modal...",

  "storytelling": {
    "reto": "¿Te preocupa que la IA reemplace tu trabajo? <strong>No dejes que suceda.</strong>",
    "solucion": "Desarrolla la habilidad crítica de <strong>pensar como ingeniero</strong>."
  },

  "sprints": [
    {
      "titulo": "Sprint 1: Fundamentos",
      "descripcion": "Descripción académica del módulo...",
      "resultado": "Logras tu primer prompt maestro."
    }
    // ... Agregar los 4 sprints
  ],

  "requisitos": "Computadora con acceso a internet. <strong>No requiere experiencia.</strong>"
}
```
````

### Lógica de Disponibilidad (Campo `"estado"`)

El sistema tiene una inteligencia híbrida para mostrar si un curso está disponible o no.

| Valor en JSON    | Comportamiento (Prioridad)                                                                                                                                                                                                                                                                      | Visualización       |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| `"auto"`         | **Automático (Con Gracia de 14 días):** <br>• Si faltan **≤ 45 días**: Se ABRE la venta. <br>• Si el curso inició hace **menos de 14 días**: Sigue ABIERTO. <br>• Si el curso inició hace **más de 14 días**: Se CIERRA automáticamente. <br>• Si faltan **> 45 días**: Muestra "Próximamente". | Dinámico            |
| `"abierto"`      | **Manual:** Fuerza la apertura de ventas inmediatamente.                                                                                                                                                                                                                                        | Verde / Color Nivel |
| `"cerrado"`      | **Manual:** Cierra el curso inmediatamente.                                                                                                                                                                                                                                                     | Gris / Rojo         |
| `"waitlist"`     | **Manual:** Muestra botón de Lista de Espera.                                                                                                                                                                                                                                                   | Azul                |
| `"proximamente"` | **Manual:** Muestra etiqueta de Próximamente.                                                                                                                                                                                                                                                   | Azul                |

---

## 3. Sistema Visual de Niveles y Filtros

El sitio detecta automáticamente el nivel del curso en el JSON y aplica la **Paleta Ejecutiva**. Esto afecta el color de la tarjeta, el modal y los botones.

- **Nivel 1:** 🟡 **Dorado (Gold)** - _Fundamentos / Alquimista._
- **Nivel 2:** 🔵 **Acero / Azul (Steel Blue)** - _Automatización / Técnico._
- **Nivel 3:** 🟠 **Cobre (Copper)** - _Arquitectura / Estructura._
- **Nivel 4:** ⚪ **Platino (Platinum)** - _Maestría / Exclusivo._

### Filtros Inteligentes

Los botones de filtro en la parte superior son dinámicos.

- El botón "Nivel 4" **solo aparecerá** si existe al menos un curso con `"nivel": 4` cargado en el archivo JSON.
- Si no hay cursos de ese nivel, el botón se oculta automáticamente.

---

## 4. Rastreo de Ventas (UTMs)

El sitio incluye un script de atribución para detectar quién realizó la venta.

1.  **URL de Entrada:** `alquimistas.gnius.club/?utm_source=VENDEDOR`
2.  **Inyección:** El script toma el valor de `VENDEDOR` y lo inserta en el link de pago de Stripe.
3.  **Resultado:** En Stripe, la transacción incluirá `client_reference_id: VENDEDOR`.

---

## 5. Branding Dinámico de Partners

El sitio cuenta con un sistema de "Marca Blanca" oculto.

### ¿Cómo activarlo?

Compartir el enlace con la palabra clave en la URL:

- **Workosfera:** `alquimistas.gnius.club/?utm_source=workosfera`
- **MUNET:** `alquimistas.gnius.club/?utm_source=munet`

### ¿Qué sucede?

El script desbloquea dos secciones ocultas en el HTML:

1.  **Barra Superior:** Presenta el logo del partner activo.
2.  **Sección Inferior:** En la landing principal, Workosfera y MUNET tienen una sección visual antes del footer.

El beneficio comercial es independiente del branding: para activar un descuento, registrar monto, cupón de Stripe y niveles aplicables en `partners.json`. Nunca se debe anunciar un descuento sin un cupón válido en Stripe.

---

## 6. Automatización (Backend)

_El flujo técnico detallado se encuentra en Zapier._

1.  **Cobro:** El usuario paga en Stripe.
2.  **Trigger:** Zapier detecta el pago.
3.  **Base de Datos:** Se agrega al alumno a **Acumbamail**.
4.  **Entrega:** Invitación automática a **Google Classroom** + Email de bienvenida.

---

---

# 🎓 ANEXO: Guía Oficial para Vendedores

### Tu Enlace de Comisiones ALQUIMISTAS

Para asegurar que recibas la comisión por cada venta que generes, es vital que compartas el enlace al curso de la manera correcta.

El sistema funciona con una **"Firma Digital"**. Si envías a los clientes a la página web sin tu firma, el sistema no sabrá que fuiste tú y no podrá asignarte la venta.

### 1. La Fórmula Mágica 🧪

Tu enlace personal se compone de dos partes: la dirección de la web + tu código de vendedor.

**La estructura es esta:** `https://alquimistas.gnius.club/?utm_source=TU_CODIGO_AQUI`

### 2. ¿Cómo elijo mi Código?

Tu código es tu identificador único. Puedes usar tu nombre, tu apodo o un código numérico, pero debes seguir estas **3 REGLAS DE ORO**:

1. ✅ **Solo letras y números.**
2. ✅ **Usa guiones bajos (`_`) si quieres separar palabras.**
3. ❌ **PROHIBIDO usar espacios** o símbolos (ñ, @, tildes).

#### Ejemplos Correctos:

`juan_perez`, `mariag_01`, `equipo_alpha`

### 3. Tus Enlaces Listos para Copiar

Simplemente reemplaza la parte final con tu código.

**Ejemplo:** `https://alquimistas.gnius.club/?utm_source=roberto`

### 💡 Preguntas Frecuentes

**¿Cómo sé si funciona?**  
Haz la prueba tú mismo. Copia tu enlace, pégalo en el navegador y verifica que la página cargue bien. El sistema capturará tu nombre en segundo plano.

**¿Puedo acortar el enlace?**  
Sí, puedes usar Bitly, siempre y cuando acortes **el enlace completo** (con tu código incluido).

**¿Qué pasa si olvido poner mi código?**  
La venta se registrará como "Anónima" y no podremos asignarte la comisión. **¡Asegúrate de copiarlo siempre completo!**

---

_Equipo de Tecnología Alquimistas_
