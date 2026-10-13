# Registro de cambios del FTP — Alquimistas

Ruta de publicación: `public_html/alquimistas/`. Este registro no contiene credenciales.

## 2026-10-13 — Corrección de caché para MUNET

El usuario reportó que el encabezado y la sección inferior de MUNET seguían ocultos, mientras que el banner flotante sí aparece. Esto confirma que `partners.json` identifica a MUNET; la visibilidad de los otros dos bloques depende de otro código. La ruta pública conserva `?utm_source=munet`; el HTML y `app.js` publicados contienen los bloques y la lógica para mostrarlos. `app.js` se entrega con `Cache-Control: public, max-age=604800` (siete días). `index.html` todavía pedía `app.js?v=1.1`, y `fechas.html` y `temarios.html` pedían `app.js` sin versión. La causa exacta de la falta de visibilidad en el navegador del usuario no se ha confirmado.

Corrección publicada: cambiar la URL del script en las tres páginas a `app.js?v=munet-20261012` y activar los bloques MUNET con un script corto dentro de cada página cuando la URL contiene MUNET. Así la vista no depende de que se ejecute el manejador `DOMContentLoaded` de `app.js`. El archivo `app.js`, `partners.json`, los assets y los bloques de otros partners no cambiaron.

Verificación: se subieron `index.html`, `fechas.html` y `temarios.html` y se descargaron de nuevo por FTP; las tres copias coincidieron byte por byte. Las tres páginas y este registro también se descargaron desde la web pública y coincidieron byte por byte con los archivos preparados. Una prueba de la activación incluida en cada página mostró el encabezado MUNET (y la sección inferior en la principal) con `?utm_source=munet`, sin activar esos bloques para `?utm_source=workosfera`. Falta comprobación visual en el navegador del usuario.

## 2026-10-13 — Integración MUNET

Estado: **publicado y verificado el 2026-10-13 a las 00:10 UTC**.

### Objetivo

Publicar la vista de MUNET activada por `?utm_source=munet`, con la identidad visual revisada, la sección de alianza y el código promocional `CONECTAMUNET` para un beneficio anunciado de $750 MXN.

### Inventario remoto previo

El primer acceso abrió en una raíz vacía. Con la nueva configuración, la sesión FTP inicia en `/public_html`, que también está vacío; al ejecutar `CWD ..` aparece el directorio `/alquimistas` con los archivos actuales. Las cinco copias descargadas directamente de `/alquimistas` tienen exactamente las mismas huellas SHA-256 que los archivos servidos por `https://alquimistas.gnius.club/`. Por tanto, `/alquimistas` es la ruta FTP verificada para esta publicación.

El sitio público responde `200`. Las copias de lectura web están en `deploy-backups/2026-10-12-pre-munet/` y las descargadas directamente del FTP en `deploy-backups/2026-10-12-pre-munet/ftp/`. Los tres recursos MUNET propuestos devolvieron `404` en el sitio público, por lo que serían archivos nuevos.

| Archivo público | SHA-256 antes del despliegue | Diferencia principal frente a la copia local |
| --- | --- | --- |
| `index.html` | `4a4df9710c70aa05d5dc45c5253b8e8f64eb7fbf218b0f3e32ae3528423d49d6` | Falta la integración MUNET. |
| `fechas.html` | `5b476b230ea61b0eacaececf6a9f05b582b60b8fb058f0a13f3097b96c5ecb50` | Falta el encabezado MUNET. |
| `temarios.html` | `5a33825f53c1614f8ffdad563080a09ad722c664f2b77adf17d37740e8b8a430` | Falta MUNET y la copia local ya incluye un filtro para evitar una tarjeta vacía. |
| `app.js` | `8544bcbd77687a3ce653b5d7e09706e2e8ec3c8d356399d32fef55a057b5a7c3` | Falta detectar MUNET. |
| `partners.json` | `8c3ebb660440527304964fe8531cbe152a7e4e72d1a0ebec996cef7b75110df0` | Falta MUNET y `CONECTAMUNET`. |

El breadcrumb de File Manager `public_html > alquimistas` concuerda con el contenido encontrado por FTP. Antes de la carga se volvió a descargar y comparar cada uno de los cinco archivos existentes contra el respaldo; todos seguían idénticos.

El usuario expresó preocupación por modificar Workosfera, Hyde & Seek y otros partners. El paquete en `deploy-staging/munet-2026-10-12/` se construyó sobre los archivos descargados del FTP; la comparación línea por línea muestra únicamente la nueva entrada MUNET, sus bloques visuales y una condición de tamaño para su logo en el aviso de promoción. Los objetos JSON de los demás partners son idénticos a los originales. Quedaron fuera otros cambios locales (`cursos.json`, `README.md`, el filtro local de `temarios.html` y la carga de Montserrat). Se publicó ese paquete, no los archivos de trabajo completos.

### Archivos candidatos

| Ruta | Motivo |
| --- | --- |
| `index.html` | Encabezado, sección MUNET, promoción y enlace de pago. |
| `fechas.html` | Encabezado MUNET. |
| `temarios.html` | Encabezado MUNET. |
| `app.js` | Detección de MUNET y altura del encabezado. |
| `partners.json` | Partner MUNET, cupón `CONECTAMUNET` y logo. |
| `assets/munet-logo-manual-vertical.png` | Logo con la leyenda debajo, tomado del manual. |
| `assets/munet-exhibiciones.jpeg` | Fotografía de exhibición. |
| `assets/munet-blackbox.jpeg` | Fotografía de Black Box. |

### Huellas SHA-256 del paquete preparado para el FTP

| Ruta | SHA-256 |
| --- | --- |
| `index.html` | `fb2f0b689f8873d572a358b97283a0b18816128eb9c5c140a969bdd723b63acd` |
| `fechas.html` | `683a8c990bc3dc8696986d34671ebb14ea0cca86e6d808ce2d682835878a17a3` |
| `temarios.html` | `c69f845b54f9007016ee5f5682afe22d3f88f30c0fdda28d0d9723420e8e5792` |
| `app.js` | `af956b3c9a4b069d466cc3f9f8c249026ffbeaf9a0e35be77f3a19f0d12db2af` |
| `partners.json` | `9d46cf1f46f6a2fd68575a9925197f826fbadd5362ff8582d097ca48643359ee` |
| `assets/munet-logo-manual-vertical.png` | `3286b675343649a4acdbc89cdb218e7ce2dbbfd161b5d7771e5e5a826f0cbcf5` |
| `assets/munet-exhibiciones.jpeg` | `1a3e42c7d3d80e05bf2fa0eb538f3b92edc9a8e081cb8c50c9268804b28caf02` |
| `assets/munet-blackbox.jpeg` | `6522034c426c690a060f46495a2f68357516e27d6c8d2fe4fef07de384ec901c` |

### Verificación posterior

- Se subió este registro antes de reemplazar los archivos del sitio.
- Se subieron y descargaron por FTP los ocho archivos del paquete; cada descarga coincidió byte por byte con su archivo preparado y con las huellas SHA-256 de la tabla.
- Las cinco rutas de código/datos y las tres imágenes respondieron `200` en el sitio público. Los cinco archivos de código/datos públicos coinciden byte por byte con el paquete.
- La imagen PNG pública conserva exactamente los mismos píxeles que el archivo preparado. Las dos fotos JPEG públicas conservan tamaño y contenido visual; el servidor entrega versiones recomprimidas (diferencia media RGB de aproximadamente 1 valor por canal), mientras que los archivos guardados en el FTP conservan sus huellas originales.
- `cursos.json` y los demás partners no se subieron. La existencia, importe y vigencia del código `CONECTAMUNET` aún deben confirmarse en Stripe.
