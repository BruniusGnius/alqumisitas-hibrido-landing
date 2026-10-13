# Alquimistas de IA — guía del sitio

Este documento describe el código de la carpeta raíz y cómo actualizar cursos, partners y archivos publicados. La landing principal está en `https://alquimistas.gnius.club/`. Es un sitio de HTML, CSS y JavaScript estático: el navegador carga los datos de dos archivos JSON. Este repositorio no contiene un servidor de aplicación ni una base de datos.

## Arquitectura

```text
Navegador
  ├─ index.html / fechas.html / temarios.html
  ├─ app.js        → componentes Alpine, filtros, precios, UTMs y enlaces
  ├─ cursos.json   → cohortes, fechas, temarios, precios y enlaces Stripe
  ├─ partners.json → identificación y beneficio de cada partner
  └─ assets/       → imágenes, logos y video

Inscripción → Payment Link de Stripe → automatizaciones externas
```

Tailwind CSS, Alpine.js, Phosphor Icons, las fuentes y el chatbot se cargan desde servicios externos. La página principal también carga Google Analytics y Plausible. Los HTML usan rutas relativas; para verlos localmente hay que servirlos por HTTP, no abrirlos con `file://`.

| Ruta | Función |
| --- | --- |
| `index.html` | Landing de venta: contenido institucional, catálogo, filtros, modal de curso, calendario individual, banner promocional y alianzas. |
| `fechas.html` | Tarjetas de cohortes y calendario global. Define su componente `fechasCalendar` dentro del HTML. |
| `temarios.html` | Temario por nivel; acepta `?nivel=1`, `?nivel=2`, etc. |
| `app.js` | Lógica compartida de Alpine: carga de JSON, estados, precios, promociones, navegación, enlaces y descarga `.ics`. |
| `cursos.json` | Datos de cursos y cohortes. Cada objeto representa una cohorte. |
| `partners.json` | Datos comerciales: palabras clave, descuento, cupón, logo y niveles aplicables. |
| `assets/` | Recursos visuales referenciados por HTML y JSON. |
| `gracias.html` | Confirmación estática. El retorno después del pago se configura en Stripe, fuera del repositorio. |
| `pago-stripe.html` | Página heredada independiente; las tarjetas actuales construyen enlaces directos a Stripe desde `app.js`. |
| `sitemap.xml` | URLs públicas para buscadores. |
| `landing-v2/` | Versión alternativa en Git; lee `../cursos.json` y `../partners.json`. No integró el último paquete FTP publicado. |
| `deploy-staging/munet-2026-10-12/` | Paquete exacto preparado para el último despliegue MUNET. Puede diferir de los archivos de trabajo en la raíz. |
| `deploy-backups/2026-10-12-pre-munet/ftp/` | Cinco archivos originales descargados del FTP antes de MUNET; ver `RESTORE.md`. |
| `DEPLOY_LOG.md` | Registro de hallazgos, cambios y verificaciones del FTP. |

## Funciones implementadas

- Al iniciar Alpine, las tres páginas cargan `cursos.json` y `partners.json` en paralelo. Se añade una marca de tiempo a cada petición para solicitar datos recientes.
- El catálogo filtra por nivel y ordena primero las cohortes abiertas, luego las de lista de espera y las próximas. Oculta las cerradas en `index.html` y `fechas.html`; `temarios.html` las conserva para consulta.
- Las tarjetas muestran fecha, modalidad, precio y estado. El nivel 1 usa dorado; el 2 azul; el 3 cobre; el 4 platino. El modal de la portada muestra temario, calendario y requisitos.
- El modal puede descargar un archivo `.ics` con las sesiones que tengan fecha en `calendario`. `fechas.html` construye además un calendario global.
- La preventa depende de `eb_fecha_limite`. Un partner aplicable tiene prioridad sobre el cupón de preventa.
- El banner flotante aparece después de llegar a la sección de fechas/precios cuando hay un partner activo o una preventa activa.
- Algunos enlaces internos marcados `data-preserve-utm` conservan los parámetros de entrada. Los enlaces generados por `generarUrlConUtms()` también los incluyen.
- La inscripción usa el `stripeUrl` de cada cohorte con parámetros añadidos por `generarLinkStripe()`. El sitio no valida cupones ni cobra directamente.
- La barra superior de Workosfera, Hyde & Seek o MUNET aparece según el enlace. En `index.html` cada uno tiene una sección visual antes del footer.
- La portada incluye enlaces de contacto por correo y WhatsApp, un formulario que abre la consulta de certificado en CNAC y el chatbot externo de Chatwith. Esos servicios no se administran desde este repositorio.

### Estado y disponibilidad

`estado` puede ser `abierto`, `cerrado`, `waitlist`, `proximamente` o `auto`. Para `auto`, `app.js` compara `fechaInicio` con el día de visita: abre cuando faltan **60 días o menos**, sigue abierto hasta **11 días después del inicio** y luego cierra; si faltan más de 60 días, muestra «Próximamente». El README anterior describía límites diferentes; esta es la regla del código actual.

Solo `abierto` muestra botón de pago. Una preventa vencida deja de activar su descuento aunque la cohorte siga abierta.

## Actualizar o agregar un curso

1. Editar `cursos.json`. Para una cohorte nueva, duplicar un objeto existente del mismo nivel, darle un `id` único y revisar todas las fechas. No reutilizar el ID de otra cohorte.
2. Actualizar el contenido visible: `titulo`, `subtitulo`, `nivel_consejo`, `imagen`, `fechaInicio`, `kickoff`, `horario`, `modalidad_card`, `modalidad_nota`, `descripcion`, `target`, `requisitos`, `storytelling` y `sprints`.
3. Revisar venta y precio: `estado`, `reg_precio` (o `precio`), `eb_precio`, `eb_fecha_limite`, `eb_cupon_code`, `moneda` y `stripeUrl`. Los precios del JSON son visuales; Stripe debe tener configurados el importe y los cupones reales.
4. Revisar automatización y agenda: `fecha_email`, `hora_email` y cada entrada de `calendario` (`dia`, `fecha`, `tipo`, `tema`). `fecha_email` sustituye a `fechaInicio` en la referencia de pago. `hora_email` lleva cuatro dígitos, por ejemplo `1800`.
5. Si cambia la portada, subirla a `assets/` y comprobar la ruta de `imagen`. Si cambia el temario, editar `sprints` y `storytelling` en el JSON; las páginas los muestran desde ahí.
6. Validar el JSON y revisar tarjeta, modal, `fechas.html`, `temarios.html?nivel=N`, calendario y enlace de Stripe con y sin partner.
7. Subir al FTP `cursos.json` y los assets nuevos. Si cambió texto fijo, SEO o maquetación, subir también los HTML modificados y registrar el despliegue en `DEPLOY_LOG.md`.

Algunos campos admiten HTML porque se muestran con `x-html`, por ejemplo `<strong>` y `<br>`. Usar solo contenido de confianza. Las fechas usan `AAAA-MM-DD`. Mantener `calendario` en orden cronológico: el calendario global toma su último elemento como fecha de fin.

**Estado local frente al servidor:** `cursos.json` no se subió durante el último despliegue FTP de MUNET. En la revisión del 12 de octubre de 2026, el archivo público y el local coincidieron byte por byte. Volver a compararlos antes de publicar otro curso para no reemplazar cambios posteriores.

## Actualizar o agregar un partner

El enlace recomendado es `https://alquimistas.gnius.club/?utm_source=CODIGO`. El beneficio busca `keywords` en `utm_source` y `ref`. La barra superior también reconoce `utm_medium` y `utm_campaign`, pero esos parámetros **no bastan** para activar el beneficio comercial. Para la experiencia completa, usar `utm_source`.

1. Crear o editar el objeto en `partners.json`. Darle `id` único y `keywords` sin ambigüedades. Completar `descuento_mxn`, `cupon_stripe`, `etiqueta`, `banner_mensaje`, `icono`, `logo`, `logo_bg` y `aplica_a`. Este último vale `"todos"` o una lista como `[1, 2]`.
2. Crear el código promocional en Stripe y comprobarlo con **cada Payment Link aplicable**. El JSON no crea el cupón. Confirmar que el descuento visual (`reg_precio` menos `descuento_mxn`) coincide con el cobro real.
3. Colocar el logo en `assets/` y asignar su ruta en `logo`. Revisar su legibilidad en el banner flotante. MUNET tiene un ajuste especial de tamaño en `index.html` por la leyenda bajo el logo.
4. Si requiere barra superior y sección de alianza, añadir los bloques en `index.html`; añadir el header a `fechas.html` y `temarios.html`; y agregar su activación y altura de navegación a `app.js`. **Editar solo `partners.json` crea el beneficio y el banner flotante, pero no los bloques visuales.** MUNET también tiene un activador corto dentro de cada HTML.
5. Probar la URL con `utm_source`, navegar entre páginas y revisar header, sección inferior, tarjetas, modal, precio y `prefilled_promo_code`. Probar además la URL sin partner y las de los partners existentes.
6. Publicar solo JSON, HTML, JavaScript y assets cambiados. Registrar el estado previo y posterior en `DEPLOY_LOG.md`.

Actualmente hay datos para Workosfera, MUNET, Hyde & Seek, KCP y Centro Empresarial Tuxtla. Workosfera, Hyde & Seek y MUNET tienen una sección inferior propia en la landing principal. KCP y Tuxtla usan el beneficio comercial sin sección inferior dedicada.

### Parámetros añadidos al enlace de Stripe

`generarLinkStripe(curso)` usa `curso.stripeUrl`. Si falta o contiene `provisional`, devuelve `#`. En otro caso agrega:

| Parámetro | Valor |
| --- | --- |
| `prefilled_promo_code` | Cupón del partner aplicable; si no lo hay, cupón de preventa vigente. |
| `client_reference_id` | `origen___idCurso___fechaEmail___horaEmail`; `origen` es `utm_source` o `directo`. |
| `utm_source` | Valor de entrada, cuando existe. |

Ese formato de `client_reference_id` sirve a la integración posterior al pago. Coordinar cualquier cambio con quien administra la automatización. La configuración de Stripe, Zapier, correo, Acumbamail y Classroom no está en este repositorio; comprobarla en esas plataformas antes de anunciar una cohorte o beneficio.

## Texto fijo, SEO y otras páginas

El hero, contenido institucional, testimonios, alianzas visuales, footer y metadatos SEO están escritos en los HTML. `index.html` contiene datos estructurados y etiquetas Open Graph; `temarios.html` tiene metadatos propios. `sitemap.xml` lista las URLs públicas. Las imágenes y logos suelen estar en `assets/`.

`index.html` conserva bloques antiguos de JavaScript comentados al final. La lógica compartida activa está en `app.js`; MUNET tiene además un activador dentro de los HTML. Antes de modificar una regla, comprobar qué bloque se ejecuta realmente.

`gracias.html` muestra una confirmación estática; no demuestra por sí misma que el pago ni las automatizaciones se hayan ejecutado. `pago-stripe.html` pertenece a un flujo heredado y no es la ruta usada por las tarjetas actuales.

## Vista local, FTP y Git

Desde la raíz del proyecto:

```sh
python3 -m http.server 8765
```

Abrir `http://127.0.0.1:8765/?utm_source=munet`, `http://127.0.0.1:8765/fechas.html?utm_source=munet` o `http://127.0.0.1:8765/temarios.html?nivel=1&utm_source=munet`. Para probar sin partner, quitar `utm_source`. El servidor local muestra los archivos de trabajo; el sitio público muestra los archivos subidos al FTP.

El destino FTP verificado es `/alquimistas` y sirve `https://alquimistas.gnius.club/`. La cuenta inicia en `/public_html`; en la conexión verificada fue necesario subir un nivel y entrar a `alquimistas`. Los datos de acceso están **solo en este equipo** en `.ftp.env`, con permisos `600` y excluidos de Git. El archivo guarda `FTP_HOST`, `FTP_PORT`, `FTP_USER`, `FTP_PASSWORD` y `FTP_REMOTE_DIR`. No copiarlo al FTP, a `public_html` ni a un repositorio. Este README y `DEPLOY_LOG.md` no contienen la contraseña.

Antes de subir, comparar la versión remota con la local, guardar respaldo y preparar una lista exacta de archivos. Después, descargar lo publicado y cotejar huellas; comprobar URLs públicas y enlaces de pago. El respaldo previo a MUNET está en `deploy-backups/2026-10-12-pre-munet/ftp/` y el paquete de esa publicación en `deploy-staging/munet-2026-10-12/`. Un commit de Git registra el estado local: **no publica archivos en el FTP**.
