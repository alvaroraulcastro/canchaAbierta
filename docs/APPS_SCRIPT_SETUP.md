# Apps Script — Setup paso a paso

> **Resultado esperado**: un trigger instalado en el Sheets que, ante cualquier cambio, notifica a `/api/sheets/revalidate` para que Next.js invalide el cache de la hoja correspondiente.

## 1. Abrir el editor de Apps Script

1. Abrir https://docs.google.com/spreadsheets/d/`1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM`/edit
2. Menú **Extensiones** → **Apps Script**
3. Se abre el editor en otra pestaña

## 2. Pegar el código del trigger

Borrar el contenido del archivo `Código.gs` por defecto y pegar este código (también disponible en [`docs/scripts/apps-script.gs`](./scripts/apps-script.gs)):

```javascript
const SHEET_TO_TAG = {
  Venues: "venues",
  Canchas: "courts",
  Partidos: "matches",
  Jugadores: "players",
  Inscripciones: "inscriptions",
  Notificaciones: "notifications",
  AdminAudit: "audit",
};

function onChange(e) {
  const props = PropertiesService.getScriptProperties();
  const siteUrl = props.getProperty("NEXT_PUBLIC_SITE_URL");
  const secret = props.getProperty("SHEETS_REVALIDATE_SECRET");

  if (!siteUrl || !secret) {
    console.error("Faltan NEXT_PUBLIC_SITE_URL o SHEETS_REVALIDATE_SECRET en propiedades del script");
    return;
  }

  let sheetName;
  try {
    sheetName = e && e.source ? e.source.getActiveSheet().getName() : null;
  } catch (err) {
    console.warn("No se pudo obtener hoja activa desde el evento:", err);
  }

  if (!sheetName) {
    console.warn("No se pudo determinar el nombre de la hoja");
    return;
  }

  const tag = SHEET_TO_TAG[sheetName];
  if (!tag) {
    console.warn(`Sin mapeo de tag para la hoja "${sheetName}"`);
    return;
  }

  const endpoint = `${siteUrl.replace(/\/$/, "")}/api/sheets/revalidate`;
  const payload = JSON.stringify({ sheet: sheetName, tag });

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "X-Secret": secret },
    payload,
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    const code = response.getResponseCode();
    const body = response.getContentText();
    console.log(`revalidate ${tag}: HTTP ${code} - ${body}`);
  } catch (err) {
    console.error(`Fallo al llamar a ${endpoint}:`, err);
  }
}

function installOnChangeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some(t => t.getHandlerFunction() === "onChange");
  if (exists) {
    console.log("Trigger onChange ya existe");
    return;
  }
  ScriptApp.newTrigger("onChange")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onChange()
    .create();
  console.log("Trigger onChange instalado");
}
```

Guardar (Ctrl+S).

## 3. Configurar las propiedades del script

Estas son las URLs y secretos que el script necesita. **No van en el código** porque son datos sensibles.

1. En el editor de Apps Script, click en el ícono de **⚙️ Configuración del proyecto** (a la izquierda)
2. Scroll hasta **Propiedades de script**
3. Click **Agregar propiedad de script** y agregar **una por una**:

| Propiedad | Valor ejemplo (dev) | Valor ejemplo (prod) |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://canchaabierta.cl` |
| `SHEETS_REVALIDATE_SECRET` | generar con `openssl rand -hex 32` | generar uno nuevo por entorno |

Para `SHEETS_REVALIDATE_SECRET` debe coincidir **exactamente** con el valor que está en `.env.local` (dev) y en las env vars de Vercel (prod).

> ⚠ Estos valores **no** se commitean. Las propiedades del script viven en el proyecto Apps Script y son privadas.

## 4. Instalar el trigger

Hay dos formas:

### Opción A: ejecutar `installOnChangeTrigger` (recomendado)

1. En el editor, en el dropdown de funciones (arriba en la barra), seleccionar **installOnChangeTrigger**
2. Click **Ejecutar**
3. La primera vez pedirá permisos (revisar la app, ver y editar el Sheets). Aceptar.
4. Verificar en **Activadores** (ícono de reloj a la izquierda) que aparece `onChange` con tipo de evento `Al cambiar` y ámbito `De la hoja de cálculo`

### Opción B: crear el trigger manualmente

1. **Activadores** (ícono de reloj a la izquierda) → **Agregar activador** (abajo a la derecha)
2. Configurar:
   - Función: `onChange`
   - Origen: **De la hoja de cálculo**
   - Tipo de evento: **Al cambiar**
3. Guardar

## 5. Verificación

1. Volver al Sheets y editar cualquier celda (ej. cambiar un `active` de TRUE a FALSE en `Canchas`)
2. En el editor de Apps Script, abrir **Ejecuciones** (ícono de lista a la izquierda)
3. Debería aparecer una nueva ejecución de `onChange` con status "Completada"
4. Si expandes la ejecución, debería verse el log `revalidate courts: HTTP 200 - ...`

> El endpoint `POST /api/sheets/revalidate` ya está implementado. Responde 401 si falta `X-Secret` o no coincide con `SHEETS_REVALIDATE_SECRET`. Apps Script no puede llamar a `localhost`; para probar el trigger usa un túnel HTTPS o un deploy.

## 6. Variables de entorno que salen de aquí

- `SHEETS_REVALIDATE_SECRET` (compartida entre el script y Next.js)
- `NEXT_PUBLIC_SITE_URL` (ya estaba como var de Next.js, solo confirmar)

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| No aparece ejecución tras editar | Trigger no instalado | Volver a paso 4 |
| Log: `Faltan NEXT_PUBLIC_SITE_URL...` | Propiedades del script no configuradas | Volver a paso 3 |
| Log: `Sin mapeo de tag para "Hoja 1"` | La hoja activa es una que no está en `SHEET_TO_TAG` | Renombrar la hoja o agregarla al mapa |
| Log: `HTTP 401` | El `X-Secret` no coincide con el de Next.js | Revisar que `SHEETS_REVALIDATE_SECRET` sea idéntico en ambos lados |
| Log: `HTTP 404` | El endpoint aún no existe | Normal en setup inicial; se implementa en Fase 1 |
| Log: `DNS error` o `timeout` | `NEXT_PUBLIC_SITE_URL` mal configurada | Verificar dominio y que la app esté deployada |

## Limitaciones conocidas

- **No se revalida automáticamente al agregar/eliminar filas en lotes importados** (csv upload). Si haces `File → Import`, el trigger puede no dispararse. Solución: editar manualmente una celda después.
- **`onChange` se dispara en muchos eventos** (incluyendo cambios de formato, selección de celdas en algunos casos). Si te molesta el ruido en logs, se puede refinar para filtrar por tipo de evento.
- **El payload no incluye `diff`**: solo el nombre de la hoja. El backend invalida todo el cache de esa hoja (que es lo que queremos — la siguiente lectura va a Google Sheets de nuevo).

## Próximo paso

Ir a [docs/FLOW_CL_SETUP.md](./FLOW_CL_SETUP.md) para configurar la pasarela de pagos.
