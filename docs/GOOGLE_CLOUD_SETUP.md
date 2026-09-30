# Google Cloud — Setup paso a paso

> **Resultado esperado**: un proyecto GCP con la Sheets API habilitada, un service account con JSON key, las credenciales OAuth para Auth.js y el email del service account con acceso de Editor al Sheets.

## 1. Crear el proyecto

1. Ir a https://console.cloud.google.com/
2. Arriba a la izquierda, junto al logo de Google Cloud, click en el selector de proyecto → **Proyecto nuevo**
3. Nombre: `cancha-abierta` (o el que prefieras)
4. Organización: dejar por defecto
5. Click **Crear**
6. Esperar unos segundos y asegurarse de que el proyecto nuevo está seleccionado

## 2. Vincular cuenta de facturación

Solo si vas a usar APIs que lo requieran. Para Sheets API en modo service-to-service **no es estrictamente necesario** a baja escala, pero conviene dejarlo configurado para evitar sorpresas.

1. Menú hamburguesa → **Facturación** → vincular cuenta
2. Google da $300 USD de crédito gratis por 90 días en cuentas nuevas; pasado eso, Sheets API es gratis hasta cierto volumen

## 3. Habilitar las APIs necesarias

1. Menú hamburguesa → **APIs y servicios** → **Biblioteca**
2. Buscar **Google Sheets API** → click → **Habilitar**
3. Volver a la biblioteca y buscar **Google+ API** o **People API** (la usa Auth.js para obtener perfil) → **Habilitar**

> **Nota**: en proyectos nuevos Google puede redirigirte a la nueva consola; el flujo es equivalente.

## 4. Configurar la pantalla de consentimiento OAuth

Esto es para que los usuarios puedan hacer login con Google en canchaAbierta.

1. Menú hamburguesa → **APIs y servicios** → **Pantalla de consentimiento de OAuth**
2. User type: **Externo** (a menos que tengas Workspace y quieras que sea interno)
3. Click **Crear**
4. Completar:
   - **Nombre de la app**: `canchaAbierta`
   - **Correo de asistencia al usuario**: tu email
   - **Logotipo**: opcional
   - **Dominio de la app**:
     - Página principal: `https://canchaabierta.cl` (o tu dominio real)
     - Política de privacidad: `https://canchaabierta.cl/privacidad` (placeholder)
     - Términos: `https://canchaabierta.cl/terminos` (placeholder)
   - **Dominios autorizados**: `canchaabierta.cl` (o el que uses)
   - **Correo del desarrollador**: tu email
5. Click **Guardar y continuar**
6. En **Alcances**: click **Agregar o quitar alcances**, seleccionar:
   - `…/auth/userinfo.email`
   - `…/auth/userinfo.profile`
   - `openid`
7. **Guardar y continuar**
8. En **Usuarios de prueba** (mientras esté en modo Testing): agregar los emails que podrán iniciar sesión (tu email + los futuros admins)
9. **Guardar y continuar**

> ⚠ Mientras la app esté en modo Testing, solo los usuarios de prueba pueden hacer login. Cuando esté lista para producción, hay que pasar a **En producción** (puede requerir verificación de Google).

## 5. Crear credenciales OAuth para Auth.js (login de jugadores)

1. **APIs y servicios** → **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth**
2. Tipo de aplicación: **Aplicación web**
3. Nombre: `canchaAbierta - Web client`
4. **Orígenes de JavaScript autorizados**:
   - `http://localhost:3000` (dev)
   - `https://canchaabierta.cl` (producción — ajustar a tu dominio real)
5. **URIs de redireccionamiento autorizados**:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://canchaabierta.cl/api/auth/callback/google` (producción)
6. Click **Crear**
7. En el modal aparecerán:
   - **ID de cliente** → guardar como `AUTH_GOOGLE_ID`
   - **Secreto de cliente** → guardar como `AUTH_GOOGLE_SECRET`
8. ⚠ **No commitear estos valores**. Solo van a `.env.local` y a las env vars de Vercel.

## 6. Crear Service Account para la Sheets API

Esto es para que el backend de Next.js pueda leer/escribir el Sheets **sin que un usuario humano intervenga**.

1. **APIs y servicios** → **Credenciales** → **Crear credenciales** → **Cuenta de servicio**
2. Nombre de la cuenta: `cancha-abierta-sheets`
3. ID de cuenta de servicio: autogenerado, lo puedes dejar
4. Descripción: `Acceso de servidor al Google Sheets de canchaAbierta`
5. Click **Crear y continuar**
6. **Conceder acceso al proyecto** (opcional, no hace falta para Sheets): saltar con **Listo**

Aparecerá el listado. Ahora:

7. Click en el email de la cuenta de servicio recién creada (termina en `@<proyecto>.iam.gserviceaccount.com`)
8. Pestaña **Claves** → **Agregar clave** → **Crear clave nueva** → **JSON**
9. Se descargará un archivo `.json`. **Renombrarlo a `service-account.json`** y guardarlo fuera del repo (por ejemplo `~/.config/gcp/cancha-abierta/service-account.json`)
10. ⚠ **Nunca commitear este JSON**

El JSON tiene este aspecto (NO publicar):

```json
{
  "type": "service_account",
  "project_id": "cancha-abierta",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "cancha-abierta-sheets@cancha-abierta.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Variables de entorno que salen de aquí

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=cancha-abierta-sheets@cancha-abierta.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> ⚠ En `.env.local` la private key va **con los `\n` literales escapados**. Al pegar el contenido, reemplazar saltos de línea reales por `\n` (excepto dentro de comillas).

## 7. Compartir el Sheets con el Service Account

El Sheets por defecto solo es accesible a tu cuenta personal. Para que el service account pueda leerlo y escribirlo:

1. Abrir https://docs.google.com/spreadsheets/d/`1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM`/edit
2. Botón **Compartir** (arriba a la derecha)
3. Pegar el email del service account (termina en `@<proyecto>.iam.gserviceaccount.com`)
4. Rol: **Editor**
5. **Desmarcar** "Notificar a las personas" (es un bot, no un humano)
6. Click **Compartir**

## 8. Verificación rápida

Ejecutar este snippet desde la carpeta del proyecto (requiere `googleapis` instalado):

```bash
npm install --save-dev googleapis
node -e "
import('googleapis').then(async ({google}) => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || '1VsaQwGX8EE_dnBidWfjJjRPxwA4azMRJi-ziOmbjdxM',
  });
  console.log('OK -', res.data.properties.title, '-', res.data.sheets.length, 'hoja(s)');
});
"
```

Si imprime `OK - Cancha Abierta - 1 hoja(s)` (o más si ya creaste las hojas), todo está bien conectado.

## 9. Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| `403 ... has not been used in project ... before or it is disabled` | Sheets API no habilitada | Volver a paso 3 |
| `The caller does not have permission` | Sheets no compartido con el SA | Volver a paso 7 |
| `invalid_grant` | Private key mal escapada en la env var | Reemplazar saltos por `\n` literales en `.env.local` |
| `Requested entity was not found` | Sheets ID mal copiado | Verificar `GOOGLE_SHEETS_ID` |
| OAuth "App is not verified" en login | App en modo Testing y usuario no está en la lista | Agregar el email del usuario en **Usuarios de prueba** |

## Próximo paso

Ir a [docs/SHEETS_SCHEMA.md](./SHEETS_SCHEMA.md) para crear las 7 hojas del modelo de datos.
