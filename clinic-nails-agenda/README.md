# Clinic Nails & Beauty — Agenda interna (Next.js + Supabase)

Panel interno: Agenda, Clientes, Empleadas, Servicios, Cabinas y Fichajes.
Cada persona entra con su propio código (PIN de 5 dígitos). Tú (admin)
ves y editas todo; cada empleada solo ve lo que le habilites.

⚠️ **`supabase/schema.sql` se ha reordenado y limpiado del todo en esta
versión** (antes había una tabla duplicada y columnas de un diseño
antiguo que ya no se usaban). **Vuelve a pegarlo entero en el SQL
Editor de Supabase aunque ya lo hubieras hecho antes** — es seguro
volver a ejecutarlo, no borra nada de lo que ya tengas, solo añade lo
que falte. Si algo no se guarda (por ejemplo, una empleada), el aviso
de la app ahora incluye el motivo exacto que da Supabase entre
paréntesis — si dice algo como "column ... does not exist", es la
señal de que hace falta volver a pegar este script.

## 1. Crear el proyecto en Supabase

1. https://supabase.com → crea un proyecto nuevo (gratis).
2. **SQL Editor** → pega el contenido de `supabase/schema.sql` → **Run**.
   Esto crea las tablas y mete datos de ejemplo, incluidos tres códigos
   de prueba:
   - **Eduardo (admin)** → `00000`
   - **Génesis** → `11111`
   - **Silvia** → `22222`

   ⚠️ Cámbialos en cuanto entres (pantalla Empleadas → editar → Código).
3. **Project Settings → API** → copia "Project URL" y "anon public" key.

## 2. Configurar las variables de entorno

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

## 3. Actualización automática

Ya no hace falta activar nada en Supabase: la agenda se refresca sola cada pocos segundos (se ajusta en
Configuración → Conexiones).

## 4. Probar en local

```bash
npm install
npm run dev
```

http://localhost:3000 → pantalla "¿Quién eres?" → elige tu avatar →
introduce el código.

## Cómo funciona el control de acceso

- **Rol admin** (Eduardo): ve y edita todo, incluida la pantalla
  Empleadas donde se decide qué ve cada una.
- **Rol empleada**: por defecto solo ve **Agenda** y **Fichajes**. Tú
  activas o desactivas el resto (Clientes, Empleadas, Servicios,
  Cabinas) por persona, desde Empleadas → editar → "Pantallas que
  puede ver".
- **Cualquier cambio en la agenda** (crear, mover/editar, eliminar una
  cita) pide confirmar tu propio código antes de guardar.
- **Fichar** siempre pide el código de esa empleada en concreto,
  aunque el dispositivo esté con otra sesión abierta — así varias
  personas pueden fichar desde la misma tablet de recepción sin tener
  que cambiar de usuario cada vez.
- La sesión (quién eres) se guarda en el navegador mientras la pestaña
  siga abierta; "Cambiar usuario" en la barra lateral cierra la sesión.

## Clientes

- Al crear o editar una cita puedes: **buscar** un cliente existente,
  dar de alta uno **nuevo** (nombre + teléfono obligatorio + email
  opcional), o dejarla **sin ficha de cliente** (solo un nombre suelto,
  útil para una visita puntual que no quieres registrar).
- La pantalla **Clientes** lista y busca por nombre, teléfono o email.

## Agenda: fecha, servicios extra, precio y pago

- El título de la Agenda es un calendario desplegable: haz clic para
  moverte a cualquier mes o año, no solo día a día con las flechas.
- Al crear o editar una cita puedes cambiar la **fecha** y la **hora**
  libremente (no solo al crearla desde un hueco concreto).
- Puedes **añadir servicios adicionales** a la misma cita (además del
  principal); el precio y la duración se recalculan solos, pero puedes
  **fijar el precio a mano** o **alargar la duración** si hace falta.
- La sección **Pago** admite varios métodos a la vez (pago parcial:
  por ejemplo 10 € en tarjeta y el resto en efectivo). Al elegir
  Efectivo, escribe cuánto te da la clienta y la app calcula el
  **cambio a devolver**.
- Los métodos de pago (Efectivo, Tarjeta y Bizum vienen creados por
  defecto) se gestionan desde **Configuración** — solo el admin puede
  añadir, editar o desactivar métodos.

## Productos, cobro y ventas del día

- **Productos**: pantalla para dar de alta productos de tienda (nombre,
  precio, stock). Solo la ve quien tenga el permiso "Productos"
  activado (tú por defecto; una encargada si se lo activas).
- Al cobrar una cita puedes **añadir productos** a la venta — se suman
  al total y el stock se descuenta automáticamente al cobrar.
- Botón **Cobrar** dentro de la cita: marca la venta como cobrada,
  descuenta stock y bloquea la edición de precio/servicios/pago hasta
  que se anule el cobro.
- **Anular cobro**: si algo estaba mal, se anula (devuelve el stock de
  los productos vendidos) y la cita vuelve a ser editable.
- Una cita **cobrada** se ve en gris en la agenda, con un icono de
  dólar arriba a la derecha del bloque.
- **Ventas**: pantalla con las ventas del día (o cualquier día que
  elijas), con el total cobrado en efectivo, tarjeta y cada método
  aparte. Permiso "Ventas", igual que Productos.

## Clientes favoritos y notificaciones

- Puedes marcar un cliente como **favorito** (icono de corazón) desde
  Clientes o al buscarlo dentro de una cita; las citas de un cliente
  favorito muestran el corazón en el bloque de la agenda.
- La campana de notificaciones (arriba) avisa cuando se crea una cita
  nueva en cualquier dispositivo — útil para ti como admin para ver la
  actividad del día sin tener que refrescar la agenda.

## Horario de cada empleada en la Agenda

- En Empleadas → editar, la sección "Horario semanal" se ve ahora
  como en la app de Fresha: cada día tiene una pastilla a la derecha
  — gris "No está trabajando" si libra, o el rango de horas en dorado
  si trabaja. Tocas la pastilla para abrir el editor de horas de ese
  día, o para marcarlo libre.
- La Agenda solo muestra como columna a las empleadas que trabajan
  ese día concreto (según sus días libres). Si nadie trabaja, lo dice
  en vez de mostrar columnas vacías.
- Dentro de un día que sí trabaja, las horas fuera de su turno
  (por ejemplo de 9:00 a 10:00 si empieza a las 10:00) se ven en gris
  rayado y no dejan crear una cita ahí, igual que en Fresha.
- Si no rellenas horas para un día concreto, esa empleada se muestra
  disponible todo el rango de la agenda ese día (no se grisea nada).
- **Corregido un fallo**: marcar o quitar un día libre podía dar
  error si la ficha de la empleada tenía algún dato incompleto; ahora
  el formulario se rellena con valores por defecto seguros venga como
  venga la empleada desde la base de datos.

## Horario rotativo por semanas

- En "Tipo de horario" puedes elegir **Fijo** (igual todas las
  semanas, el modo de siempre) o **Rotativo**: defines 2 o más
  "semanas tipo" (por ejemplo, Semana 1 = turno de mañana, Semana 2 =
  turno de tarde) y dices qué lunes arranca la Semana 1. A partir de
  ahí, el ciclo se repite solo indefinidamente hasta que lo cambies.
- Cada semana tipo se configura día a día: casilla "trabaja este día"
  + hora de entrada y salida si está marcada.
- Puedes añadir tantas semanas al ciclo como necesites (2, 3, 4…).

## Ausencias, vacaciones y recuento anual

- Dentro de la ficha de cada empleada, sección "Ausencias y
  vacaciones": añade un rango de fechas (desde/hasta) y un motivo
  (Vacaciones, Baja médica, Asunto propio, u Otro con texto libre).
- Mientras dura esa ausencia, la Agenda no muestra columna para esa
  empleada esos días — igual que un día libre.
- **Si esos días ya tenía citas puestas, no desaparece**: se mantiene
  visible con su horario normal hasta que quites o muevas esas citas.
  Al añadir la ausencia, si hay choque, te avisa cuántas citas afecta.
- Debajo de la lista aparece un **resumen del año en curso**: cuántos
  días lleva por cada motivo (por ejemplo "Vacaciones: 14 días ·
  Baja médica: 3 días"). Si una ausencia cruza de un año a otro, los
  días se reparten entre ambos años correctamente.

## Acceso: solo el código, sin elegir usuario

- La pantalla de entrada ya no pide elegir tu avatar primero: escribes
  tu código de 5 dígitos directamente y el propio código dice quién
  eres (se compara contra el código de cada empleada).
- Como el código identifica a la persona por sí solo, **no puede haber
  dos personas con el mismo código** — si intentas guardar uno
  repetido, te avisa y no te deja guardar hasta cambiarlo.
- Diseño con degradado en los colores de la marca y teclado circular,
  igual que la pantalla de PIN de Fresha.

## Color por servicio en la agenda

- En Servicios → editar hay un selector de color (paleta de tonos de
  marca + un selector libre para cualquier otro color).
- El bloque de cada cita en la agenda usa ese color en plano — el
  color lo decide el **servicio**, no la empleada (la empleada se
  sigue identificando por el aro de color de su avatar arriba). El
  texto se pone blanco o carbón automáticamente según haga falta para
  que se lea bien con cualquier color que elijas.

## Nueva cita, estilo Fresha

- Al crear o editar una cita, "Cliente", "Servicios" y la fecha/hora
  son tarjetas pulsables: tocas "Añadir cliente" y se abre una
  pantalla de buscar/crear cliente o "Sin cita previa"; tocas "Añadir
  servicio" y se abre un buscador de servicios agrupado por categoría
  (igual que en la app de Fresha). El botón **Guardar** aparece
  bloqueado hasta que hay al menos un servicio elegido.
- Puedes añadir varios servicios a la misma cita repitiendo "Añadir
  otro servicio"; cada uno se puede quitar con la X.
- Duración y precio manual, y productos en tienda, siguen disponibles
  debajo de la lista de servicios elegidos. **El pago ya no está ahí**
  — se hace en su propia pantalla al pulsar "Cobrar" (ver más abajo).
- El selector de fecha dentro de la cita es el mismo calendario
  desplegable de la Agenda (mes y año), no un campo de fecha suelto.

## Cobrar: pantalla propia, estilo Fresha

- Al pulsar **Cobrar** en una cita se abre una pantalla de carrito:
  datos de la clienta (con "Primera visita" si es la primera vez que
  viene, y la categoría del servicio como etiqueta), la lista de
  servicios y productos con su precio, y el total a pagar.
- Los métodos de pago **no se ven hasta que pulsas "Continuar con el
  pago"** — entonces aparece una rejilla con tarjetas por cada método
  (Efectivo, Tarjeta, Bizum, los que hayas creado) más "Dividir pago",
  igual que en Fresha.
- **Efectivo** abre un teclado propio: importe grande arriba, botones
  rápidos con cantidades redondas (por ejemplo 80€, 85€, 90€, 100€,
  200€ si la cuenta es 80€), teclado numérico, y calcula solo el
  **cambio a devolver** — no hace falta que hagas la cuenta, solo
  marcas o escribes lo que te ha dado la clienta.
- **Tarjeta, Bizum** u otros métodos: un toque aplica el importe
  pendiente directamente (no hace falta escribir nada si se paga
  entero con uno solo).
- **Dividir pago**: añade varios métodos a la misma cuenta (por
  ejemplo 10€ en tarjeta y el resto en efectivo) — cada uno se añade
  por separado y ves el pendiente bajar según añades.
- "Confirmar cobro" hace lo mismo que antes: marca la cita como
  cobrada, descuenta el stock de los productos vendidos, y bloquea la
  edición hasta que se anule el cobro.

## Turnos: vista semanal de todo el equipo

- Nueva pantalla **Turnos** (dentro de "Empleadas" en el menú lateral,
  que ahora se despliega en "Miembros del equipo" y "Turnos").
- Tabla semanal con una fila por empleada y una columna por día: la
  hora de entrada-salida en dorado si trabaja, "No está trabajando"
  en gris si libra, o el motivo (Vacaciones, Baja médica...) si tiene
  una ausencia esos días. Flechas para moverte de semana en semana y
  botón "Esta semana" para volver a hoy.
- **Toca cualquier día** de la tabla para cambiarlo *solo ese día*
  (por ejemplo, que trabaje un domingo puntual, o que libre un martes
  suelto) sin tocar su horario fijo o rotativo de siempre. Un día con
  este tipo de cambio puntual se marca con borde punteado. Desde ese
  mismo cuadro hay un enlace directo a "Editar horario semanal
  completo (fijo o rotativo)" si lo que quieres es cambiar el patrón
  de fondo, no solo un día.
- Tocando el **nombre** de una empleada se abre su ficha completa
  (horario, turnos rotativos, ausencias, permisos…).
- Simplificación frente a Fresha: una ausencia se marca en cada día
  suelto en vez de una barra que abarque varios días de golpe, y por
  ahora un día solo admite un tramo de horario (no mañana y tarde
  separadas dentro del mismo día).

## Eliminar una empleada

- En Empleadas, junto a "Editar" y "Desactivar" hay ahora un botón
  para **eliminarla del todo** (icono de papelera, en rojo). Pide
  confirmación antes de borrar porque no se puede deshacer.
- No puedes eliminarte (ni desactivarte) a ti misma mientras tienes
  la sesión abierta con tu propio usuario.
- Sus citas y fichajes pasados no se borran — simplemente dejan de
  poder mostrar su nombre (la referencia queda vacía). Si prefieres
  conservar el historial con su nombre visible, sigue siendo mejor
  **Desactivar** en vez de eliminar.

## Servicios de cada empleada (una sola lista)

Qué servicios puede hacer cada empleada se define en **un único sitio**,
que se puede editar desde dos pantallas:

- **Empleadas → Editar → "Servicios que puede realizar"** (con
  "Marcar todos" / "Quitar todos" y un contador), o
- **Servicios → Editar → "Empleadas autorizadas"**.

Las dos muestran y cambian lo mismo, y es exactamente la lista que sale
al crear una cita para esa empleada.

> **Corregido**: antes la ficha de la empleada guardaba su propia lista
> aparte y el calendario usaba la otra, así que lo que marcabas en la
> ficha no aparecía al crear la cita. Ahora la ficha muestra la
> situación real. Si ves menos servicios marcados de los que esperabas,
> es que el calendario ya los estaba filtrando así: márcalos y guarda.

## Inicio: previsión y ventas reales de hoy

- La pantalla de Inicio muestra ahora la lista completa de las citas
  de hoy (hora, clienta, servicio, empleada, total, si está cobrada
  o pendiente).
- **Previsión de ingresos hoy**: suma de todas las citas de hoy,
  cobradas o no — lo que "debería" entrar si se cobra todo.
- **Ventas reales hoy**: suma solo de las citas ya marcadas como
  cobradas — lo que realmente ha entrado hasta ahora.

## Informe de facturación mensual

- Al final de la pantalla **Ventas**, dos tarjetas: facturación del
  **mes en curso** y del **mes anterior**, cada una con el total y el
  desglose por método de pago, calculado solo sobre citas cobradas.

## Novedades: configuración, informes, notas y colores

### Antes de usarla — 3 pasos
1. **Pega de nuevo `supabase/schema.sql`** en el SQL Editor de Supabase y ejecútalo
   (añade columnas y las tablas `ajustes` y `ajustes_privados`; no borra nada).
2. *(Opcional, para guardar la clave de GHL desde la app)* añade en tu hosting la
   variable **`SUPABASE_SERVICE_ROLE_KEY`** (Supabase → Project Settings → API →
   «service_role»). Solo la usa el servidor; nunca llega al navegador.
3. *(Opcional)* Supabase → Database → Replication: activa también la tabla `ajustes`
   para que un cambio de colores se vea al momento en los demás dispositivos.

Si subes esta versión antes del paso 1 la app arranca igualmente, pero guardar citas
dará un aviso de columna que falta hasta que lo hagas.

### Configuración (solo administradores)
- **Conexiones (API)**: clave de GHL, Location ID, calendario general, calendario de cada
  empleada, importación de citas, aviso instantáneo (webhook) y una tabla con el estado de
  las seis variables del hosting.
  - La clave se guarda en una tabla que la clave pública de Supabase **no puede leer** y la
    app solo enseña sus 4 últimos caracteres. Prioridad: lo guardado aquí → variables del hosting.
  - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` **no se pueden cambiar desde
    la app**: la necesita para arrancar y poder leer estos ajustes. Se quedan en el hosting y
    rara vez cambian.
- **Colores**: combinaciones (azul cielo, turquesa, lavanda, rosa, menta, azul noche, dorado
  clásico) o color propio, fondo y estilo del menú. Vista previa al instante; al guardar cambia
  en todos los dispositivos. El contraste se corrige solo.
- **Marketing**: varios píxeles de Meta, Google Ads (AW-), Analytics 4 (G-) y Tag Manager
  (GTM-). Cada identificador se valida con su formato exacto antes de cargarse. El píxel de Meta
  se carga con la lectura automática de formularios desactivada para que no se envíen datos de
  clientes. Quitar una etiqueta surte efecto la próxima vez que se abre la app.
- **Métodos de pago**: como antes.

### Citas creadas en GHL → agenda
Cada minuto (configurable) la app pregunta a GHL por citas nuevas y las crea aquí.
- Cada calendario de GHL va a la empleada que lo tenga asignado.
- El cliente se empareja por teléfono (aunque venga con +34) o email; si no existe se crea.
  El contacto de relleno de «sin cita previa» sigue siendo «sin cita previa».
- El servicio se deduce del título del evento; si no se reconoce, se pone uno de la empleada y
  la cita lleva la nota «Revisa el servicio».
- No se importan las canceladas, ni las que caen fuera de 10:00–21:00 ni las de calendarios sin
  empleada (el botón «Importar ahora» explica el motivo).
- **Solo crea**: nunca modifica ni borra citas existentes. Si ya hay una cita sin vincular en el
  mismo hueco, la vincula en vez de duplicarla.
- *Aviso instantáneo (opcional)*: en GHL crea un Workflow «Customer Booked Appointment» →
  acción Webhook (POST) a la dirección que muestra la app.
- Comprueba con una reserva real que la **hora** sale bien: se interpretan varios formatos de
  fecha de GHL, pero no se han podido probar contra una cuenta real.

### Notas, asistencia y ficha del cliente
- **Nota interna** en cada cita. Marcando «Fijar en el cliente» pasa a ser su **nota fija**: sale
  destacada cada vez que se abra una cita suya. Si no, queda solo en esa cita y en su ficha.
- **Ficha del cliente**: pulsa su nombre (en la cita, en Clientes o en los informes) para ver
  contacto, visitas, gasto, próxima cita, historial con notas y editar la nota fija.
- **Asistencia** de cada cita: asiste / no asistió / cancelada. «No asistió» se ve en rojo y cuenta
  como inasistencia; «cancelada» se atenúa y no ocupa agenda. No se pueden cobrar. También se
  refleja en GHL (noshow / cancelled / showed).
- Cerrar una cita con cambios sin guardar **pregunta antes**. La X de los selectores vuelve atrás.
- Los selectores de cliente y servicio tienen buscador en vivo, lista con desplazamiento y
  flechas ↑ ↓ + Intro.

### Colores de los servicios
Al escribir la categoría de un servicio se asigna un color por defecto (tonos claros, sin
amarillos; cada servicio de la misma categoría, uno distinto). Se puede cambiar. El botón
**Asignar colores por categoría** (en Servicios) recolorea los que ya tienes.

### Informes (menú «Informes»)
Con selector de periodo (hoy, próximos 7 días, semana, mes, mes pasado, 30/90 días, año o
personalizado) y comparación con el periodo anterior.
- **Resumen general**: ingresos, citas, ticket medio, ocupación, nuevos clientes, inasistencias.
- **Ventas**: por día, método de pago, categoría, servicio y empleada; media por día de la semana;
  12 meses con **media mensual** (con y sin el mes en curso) y **ticket medio mensual**; pendiente
  de cobro; productos.
- **Clientes**: activos, nuevos, recurrentes, retención, frecuencia entre visitas, mejores clientes,
  **inactivos para reactivar** (CSV) y clientes con inasistencias.
- **Ocupación**: **sin contar o contando inasistencias**, por empleada, **por día**, **por hora**, mapa
  de calor día × hora, horas libres, horas perdidas y franjas más flojas/fuertes. Las citas
  solapadas de una empleada cuentan una vez (nunca más del 100 %).
- **Servicios y equipo**: € por hora de servicio y € por hora trabajada de cada empleada.
Permiso nuevo «Informes» en la ficha de cada empleada. (La sección Clientes ya no es un permiso: es solo del administrador.)

### Diseño
Blanco y azul claro, menú lateral claro, bloques de cita suaves con barra de color (estilo
Booksy/Fresha), modo oscuro y paleta editable desde Configuración. Las empleadas conservan el
color de su aro (se cambia en su ficha).

## Calendario, horarios no disponibles y clientes

### Pulsar un hueco del calendario
Al pulsar un hueco libre sale un menú: **Añadir cita** o **Añadir horario no disponible**.
- **Horario no disponible** (pausa, médico, formación…): eliges empleada, fecha, hora de inicio (se **escribe**) y
  duración (en minutos, o 30 min / 1 h / 2 h / **Todo el día**), y un motivo opcional. Se ve rayado en la agenda;
  pulsándolo se edita o se quita. Si ya había citas en ese horario avisa (las citas se mantienen), y una cita nueva
  que caiga encima también avisa, sin impedirla.
- Los horarios no disponibles **restan capacidad** en Informes → Ocupación (no cuentan como horas libres).
- **Se envían a GHL como «block slot»** del calendario de esa empleada (si no tiene calendario propio, al general):
  nadie puede reservar ahí desde GHL. Al crear, cambiar de hora o de empleada, o quitar el horario, GHL se actualiza
  solo y la app te dice en qué calendario ha quedado. Requiere el permiso de escritura de calendarios/eventos que ya
  usan las citas. Si aún no habías pegado el `schema.sql` más reciente, pégalo de nuevo (añade las dos columnas del vínculo).
  - Los bloqueos de la app **no se importan como citas** al traer eventos de GHL.
  - Al revés no: un bloqueo que crees directamente en GHL no aparece en la agenda de la app.
  - Si GHL rechaza el bloqueo, la app **no deja el aviso en silencio**: sale el motivo en pantalla (el horario ya está
    bloqueado en la app igualmente).
- **Hora y fecha se pueden escribir** en la cita (10:35, o la fecha en su campo), además de elegirlas.
- En cada cita del calendario se ve el **teléfono** del cliente (para todas las empleadas) y una marca **1ª vez**
  cuando es la primera cita de ese cliente.
- La actualización automática (cada 20 s por defecto, Configuración → Conexiones) refresca la agenda y las citas
  que entran desde GHL.

### Anular una venta cobrada
Solo el **administrador** o una **encargada** (empleada con el permiso «Puede anular cobros», que se marca en su
ficha). Al resto no se le muestra el botón y, aunque manipulara la app, el servidor lo rechaza.

### Clientes (solo administrador)
Menú **Clientes**: todos los clientes aparecen aquí al darse de alta o al reservar.
- **Etiquetas automáticas:** *Primera visita* (una sola cita), *Cliente recurrente* (dos o más), *Inactivo* (más de
  60 días sin venir y sin cita próxima), *Sin visitas*, y una por **categoría de servicio con las veces** que viene
  (*Facial · 3*, *Uñas · 2*). No cuentan las citas canceladas ni las de «no asistió».
- Filtros por etiqueta, búsqueda por **nombre (sin acentos) o parte del teléfono/email**, orden por nombre, última
  visita, visitas o gasto. El filtro «Cliente de Facial» sale solo a partir de tus categorías.
- **Ver** (ficha con historial de todas las citas, notas y gasto), **editar** (incluida la nota fija) y **eliminar**
  (pide confirmación; sus citas anteriores se conservan, solo dejan de estar enlazadas).
- **Importar / Exportar** (un solo botón; mira la sección «Importar y exportar clientes» de más abajo, que explica todas las opciones). Resumen:
  1. Exporta tu lista de clientes de Fresha (u otra herramienta) a CSV y súbela, o pega su contenido.
  2. Se reconocen solas las columnas (nombre, apellidos, teléfono, email, notas) y puedes corregirlas.
  3. Vista previa: cuántos son nuevos y cuáles **ya existen** (mismo teléfono —aunque lleve +34 o espacios— o mismo
     email) o están repetidos en el archivo; esos no se importan. Una fila sin nombre se rechaza indicando la línea.
  4. Los clientes importados **no se envían a GHL** hasta que tengan una cita.
- La empleada ve la ficha de un cliente desde su cita, pero sin gasto total y sin poder editarla.

### Al buscar o dar de alta un cliente en una cita
- El buscador encuentra por **parte del teléfono** («1112») o del nombre, escrito como sea.
- Al escribir un cliente nuevo salen **sugerencias de los que ya existen**; tocar una lo usa en vez de duplicarlo, y
  no deja guardar un teléfono que ya existe.

## Agenda de 24 horas, fichar desde el calendario y cobros en GHL

### Calendario completo
- La agenda muestra **todo el día (00:00–24:00)**. Las horas en que una empleada **no trabaja** (según su horario) salen
  en **gris rayado** y no se pueden pulsar; las de su turno, normales.
- **Línea roja con la hora actual** sobre todas las columnas, y la hora exacta marcada en el margen izquierdo. Al abrir la
  agenda (o cambiar de día) baja sola hasta la hora actual, o hasta el primer turno del día si miras otra fecha.
- Las citas de GHL se importan a cualquier hora (antes se descartaban las de fuera de 10:00–21:00).

### Fichar entrada, descanso y salida (cabecera de cada empleada)
- **Fichar entrada** → pasa a **Descanso** → al pulsarlo pasa a **Fichar entrada** (volver). **Fichar salida** está siempre al
  lado (desactivada mientras no haya entrada). Debajo del nombre: «Sin fichar», «En turno desde 10:02» o «En descanso desde 14:00».
- Cada tramo trabajado se guarda por separado: **las horas de descanso nunca cuentan como trabajadas**. Si fichas la salida
  estando en descanso, la jornada acaba donde empezó el descanso.
- Ella, que ya entró con su código, ficha sin que se lo pidan otra vez; el administrador, para fichar por otra, confirma con
  el código de esa empleada. Una empleada **no** puede fichar por otra (lo impide también el servidor).
- La pantalla Fichajes sigue igual (siempre pide el código) y también muestra los descansos.
- **Avisos al poner el código** (no bloquean nada, puede seguir usando la agenda):
  - Si está **en su turno y no ha fichado la entrada** de hoy → «todavía no has fichado la entrada de hoy».
  - Si **ya pasó su hora de salida** y sigue con el fichaje abierto → «no has fichado la salida de hoy».
  - Cada aviso tiene «Fichar ahora» y «Más tarde». No salen al administrador, ni antes de su hora de entrada, ni si ya trabajó
    y salió antes ese día, ni al recargar una sesión ya abierta (solo al **entrar con el código**).
- Requiere pegar de nuevo `supabase/schema.sql` (añade dos columnas para el descanso). Hasta entonces, fichar entrada y salida
  funciona igual; solo «Descanso» necesita las columnas nuevas.

### Cobros en GHL
- Al **cobrar** una cita se actualiza en GHL: el título pasa a **«[COBRADO 45 €] Servicio — Cliente»** y el estado a «showed».
- Al **anular el cobro**, el título vuelve a ser normal y el estado vuelve a «confirmed» (si no, GHL se quedaría como «showed»).
- «No asistió» y «cancelada» tienen prioridad sobre «cobrada».

## Bonos y ventas sin cita

### Antes de usarlo
1. Pega de nuevo `supabase/schema.sql` en Supabase (crea las tablas de bonos y ventas).
2. Ejecuta de nuevo `supabase/seguridad.sql` para que esas tablas nuevas también queden cerradas al público.
3. Para que alguien que no sea administrador **cree y edite bonos**, márcale el permiso «Bonos (crear y gestionar)» en su ficha.
   Vender bonos y descontar sesiones lo puede hacer cualquier empleada con acceso a la agenda.

### Sección Bonos
- **Catálogo:** nombre, tratamiento al que aplica (o «cualquier servicio»), nº de sesiones, precio y caducidad opcional (en días
  desde la compra). Muestra lo que sale cada sesión y el **ahorro frente a la tarifa suelta**. Se pueden editar y desactivar.
- **Vendidos:** cada bono de cada cliente, con sesiones usadas y restantes, fecha de compra, caducidad y estado
  (activo · agotado · caducado · anulado). Buscador por nombre o parte del teléfono. Solo el administrador o una encargada puede
  **anular** un bono, y solo si aún no se ha usado ninguna sesión (la devolución del dinero se hace aparte).
- La ficha del cliente enseña sus bonos y cuántas sesiones le quedan.

### Venta sin cita (Añadir → Venta)
Una venta **sin cita**: productos y/o bonos. Se abre desde el botón **Añadir** de la agenda → **Venta**.
- Cliente opcional para productos; **obligatorio si vendes un bono** (el bono queda en su ficha).
- Pago con uno o **varios métodos** (por ejemplo, 100 € en efectivo y el resto con tarjeta); debe cuadrar exactamente.
- Al cobrar: se descuenta el stock de los productos y se crean los bonos con sus sesiones y su fecha de caducidad.
- En Ventas, las ventas sin cita salen en su propia tabla y entran en el total del día; el administrador o la encargada pueden
  **anularlas** (se devuelve el stock; un bono con sesiones ya usadas no se puede anular).

### Vender el bono y descontar la sesión de hoy en el mismo paso
En «Nueva venta», si eliges un cliente que **tiene hoy una cita sin cobrar** y la primera sesión del bono vendido **cubre esa cita entera**
(mismo tratamiento, o bono de «cualquier servicio», sin productos extra), aparece «¿Descontar la primera sesión hoy?». Por defecto
está marcado «No, solo vender el bono». Si eliges la cita, al cobrar la venta esa cita queda **cobrada con el bono**, se descuenta la
sesión (el bono queda con N−1) y se avisa a GHL. Si la sesión no cubre toda la cita, no se ofrece: se cobra la cita aparte con «Usar 1 sesión».

### Descontar una sesión al cobrar una cita
Al cobrar, si el cliente tiene un bono **activo y aplicable a ese tratamiento** (o un bono de «cualquier servicio»), aparece
«Usar 1 sesión de «…» · quedan N de M · cubre X €». Se añade como pago «Bono», cubre el precio del servicio y se descuenta al
**confirmar el cobro**. Si te equivocas, se quita con la X antes de confirmar. Al **anular el cobro**, la sesión vuelve al bono.
- Un bono no se ofrece si está caducado, agotado o anulado, ni dos veces en la misma cita.
- En GHL, esa cita se marca «[COBRADO BONO]» (o «[COBRADO 30 € + BONO]» si se paga parte en efectivo).

### Cómo cuentan los informes (base caja)
El dinero cuenta **el día que vendes el bono**; la sesión que luego se cobra con él **no vuelve a contar** (aparece como pago
«bono» solo en la cita). Así Ventas, Resumen, la evolución mensual y el total del día reflejan el flujo de caja real y
no hay doble contabilización. Consecuencias que conviene conocer:
- El «€ por hora» de un tratamiento sale **más bajo** en las sesiones pagadas con bono (su ingreso cae en la venta del bono, que
  aparece como categoría «Bonos»).
- El **ticket medio** es el de las citas; las ventas sin cita no lo distorsionan.
- El «gasto» de un cliente en Clientes cuenta lo cobrado en sus citas (no incluye el bono que compró).
- Cobros pendientes y «ingresos perdidos por no asistir» siguen calculándose con la tarifa normal.

## Código de 5 dígitos, entrada y fichajes (última ronda)

### El código (PIN) es de 5 dígitos para todos
- Los códigos de 4 dígitos **dejan de valer**. No hay que ejecutar nada nuevo en el esquema, pero sí poner un código nuevo a cada persona.
- **Administradora** (si te quedas fuera): en Supabase → SQL Editor:
  ```sql
  update empleadas set codigo_hash = null, codigo = null;
  update empleadas set codigo = '62777' where rol = 'admin';
  ```
  (cambia 62777 por el que quieras: 5 dígitos). Entra con él y, en **Empleadas → Editar**, pon un código de 5 dígitos a cada empleada.
- Al abrir la app **siempre se pide el código** (ya no entra directa al inicio aunque hubieras entrado antes).
- Si la sesión se cierra por **inactividad** (40 s), al poner el código se vuelve **a la misma pantalla** (por ejemplo, el calendario). Si sales tú
  a propósito («Cambiar usuario»), se entra en el inicio.

### Fichar: solo la propia empleada, en la barra superior
- Los botones de fichar **ya no están en el calendario**. Solo los ve la empleada que ha entrado con su código, en la barra superior
  (y también en la pantalla Fichajes): **Fichar entrada → Descanso → Fichar entrada** y **Fichar salida**. No pide el código otra vez. El administrador no ve botones de fichar.
- En el calendario, bajo el nombre de cada empleada, se sigue viendo su estado (Sin fichar / En turno desde… / En descanso desde…).

### Barras fijas del calendario
La barra superior, la de fecha («Añadir») y la de empleadas se quedan **pegadas arriba al hacer scroll**, una bajo otra. Funciona con hasta 4 empleadas
a la vez; con más, el calendario permite desplazarse de lado y la barra de empleadas deja de quedar fija.

### Fichajes del administrador (menú Fichajes)
- **Resumen del día** por empleada: turno, entrada, salida, horas trabajadas, descanso e **incidencias**: *llegó X min tarde*, *salió X min antes*,
  *salió X min después de su hora (horas extra)*, *no fichó*, *sigue sin fichar la salida*. Hasta 5 minutos sobre su turno no cuentan.
- Navegación por días (también para revisar días anteriores).
- **Modificar** la hora de entrada o salida de cualquier fichaje, **eliminarlo** (con confirmación) o **añadir uno a mano**. Una empleada solo ve los suyos y no puede cambiarlos.

### Deuda de un bono a plazos, visible en la cita
- Si un cliente **debe aún** parte de un bono, sale **«Debe 200 € aún»** en negrita, grande y en rojo **bajo su nombre**: en la cita, en la pantalla de
  cobrar la cita y, como marca roja «Debe 200 €», en la cita del calendario. Junto a él, el botón **«Cobrar plazo»**: se cobra **una parte o todo**
  (con efectivo, tarjeta, Bizum…; no se puede cobrar más de lo que debe) y la deuda se actualiza al momento. Cualquier empleada con agenda puede cobrarlo.
- Un cliente con varias ventas pendientes ve una línea por cada una (la más antigua primero).

### Progreso de las sesiones del bono, en la cita
Bajo el nombre del cliente (y bajo su deuda, si la tiene), por cada **bono activo** del cliente: «PROGRAMA 5 SESIONES · lleva **2 de 5** sesiones hechas · quedan 3»,
con **un punto por sesión** (hechas rellenas, libres vacías) y la de esta cita resaltada: **«Esta cita sería la sesión 3 de 5»**. Si la sesión ya se descontó en esa
cita, pone «Esta cita: sesión 3 de 5 (ya descontada)». Se ve también al cobrar. Un bono que no vale para el servicio de la cita enseña su progreso pero no dice
«esta cita sería»; los bonos agotados, caducados o anulados no se muestran.

### Un bono para varios servicios
En **Bonos → Nuevo bono** (o Editar) los tratamientos se **marcan con casillas**: uno, varios o ninguno («Cualquier servicio»). Con varios, cada sesión
cubre **uno** de esos servicios (el principal de la cita, o el extra si el principal no está en el bono). Los bonos de un solo servicio funcionan como antes.
Para guardar un bono con **2 o más servicios** hay que haber pegado el `schema.sql` más reciente (crea la columna `servicio_ids`); con uno o ninguno no hace falta.

### Bonos: cliente nuevo y pago a plazos
- En «Nueva venta» (y al vender un bono) hay **«Crear cliente nuevo»** si todavía no tiene ficha: nombre y teléfono; sugiere clientes parecidos y no permite repetir un teléfono.
- **Pago a plazos** (solo ventas de bonos): marca la casilla, cobra el primer pago (por ejemplo 100 € de 300 €) y el **bono queda activo desde ese momento**.
  El resto se cobra después en **Bonos → Vendidos → «Cobrar plazo»** (cualquier empleada con agenda puede cobrarlo; no puede cambiar nada de lo anterior ni cobrar de más).
  En Vendidos y en la ficha del cliente se ve cuánto **debe** y lo ya pagado.
- Los informes (base caja) cuentan cada plazo **el día en que se cobra**, no el día de la venta del bono.

## Reservas del bot de GHL: servicios que no existen (por ejemplo «manicura»)

El bot de IA de GHL **solo puede reservar en calendarios que existan en GHL**. La app solo ve lo que llega a esos calendarios. Para que una reserva aparezca bien en la agenda:

1. **En la app:** crea el servicio en *Servicios* (por ejemplo «Manicura»: categoría Uñas, duración, precio, empleadas que lo hacen).
2. **En GHL:** crea el calendario (o un calendario por empleada) con ese servicio y asígnalo a la empleada correcta. El **título de la cita** que genera el bot debe llevar el
   nombre del servicio (por ejemplo «Manicura – {{contact.name}}»). Cada calendario de GHL se asigna a una empleada en *Configuración → Conexiones*.
3. **En el bot:** indícale en sus instrucciones qué servicios hay y que, si piden algo que no está en la lista, **no reserve** sino que lo ofrezca o pase la conversación a una persona.

**Cómo reconoce la app el servicio** (por el título de la cita de GHL): primero por el nombre completo; si no, **por palabras** («Manicura» encuentra «Manicura semipermanente»;
«Uñas» encuentra los servicios de esa categoría; no distingue acentos ni mayúsculas); si hay varias posibilidades elige la de la empleada. Si no hay ninguna pista, la cita
**entra igualmente** con un servicio por defecto, pero ahora se avisa: en el calendario lleva la marca naranja **«⚠ Revisar servicio»** y, al abrirla, un aviso dice qué pidió el
cliente. Al guardarla con otro servicio, la marca desaparece sola.

## Perfil de empleadas: qué solo ve el administrador

- Quien tiene habilitada la pantalla **Empleadas** (la encargada) puede editar nombre, teléfono, color, foto, horario y servicios de las demás, pero **no ve ni cambia**: el **código de acceso (PIN)**,
  el **ID del calendario de GHL**, el **rol** ni las **pantallas permitidas**. Si da de alta a alguien, queda sin código y se lo pone el administrador.
- El **perfil del administrador (Eduardo) solo lo toca el administrador**: a la encargada ni le aparece su tarjeta, y aunque manipulara la app, el servidor rechaza cualquier cambio sobre ese perfil
  (nombre, foto, horario, estado, borrado). Solo el administrador puede eliminar empleadas.

## Mover una cita entre empleadas y GHL

Mover una cita de Génesis a Silvia (o al revés) la **borra** del calendario de GHL de una y la **crea** en el de la otra. Fallaba porque la app mandaba siempre la cabecera JSON, incluso en el borrado
(que no lleva cuerpo), y GHL lo rechaza («Body cannot be empty…»). Ahora solo se manda con cuerpo. Además, si alguna vez GHL no pudiera borrar la reserva antigua, la cita se crea igualmente en el calendario
nuevo y sale un **aviso en rojo** diciendo que hay que borrar la antigua a mano en GHL (en vez de quedarse a medias con un error).

## Fichajes con segundos, registro de actividad y turnos por ciclos

> **Para usar esta versión:** pega de nuevo `supabase/schema.sql` y ejecuta de nuevo `supabase/seguridad.sql` en Supabase. Hasta entonces la app funciona,
> pero sin segundos exactos en los fichajes y sin registro de actividad.

### Fichajes: segundos exactos y por qué no se guardaban
- **Causa del fallo:** el reloj de fichar redondeaba la hora a bloques de 30 minutos. Entrar y salir dentro del mismo bloque daba «0 minutos» y el fichaje se descartaba.
  Ahora se guarda la hora **exacta con segundos** (10:07:30) y cualquier fichaje de al menos 1 segundo se guarda. Se ve con segundos en todas partes (resumen, lista, edición).
- **Editar el fichaje en curso:** en Fichajes, el que aún está abierto sale en la lista («en turno») con un lápiz: puedes **corregir la hora de entrada** o **cerrarlo**
  con la hora de salida real (útil si se olvidó fichar). Si está en descanso, solo se ofrece cerrar la jornada.
- Si aún no has pegado el esquema nuevo, los fichajes siguen guardándose con precisión de minutos (no se pierden).
- **Sin pedir el código otra vez:** quien ya entró con su código ficha entrada, descanso, vuelta y salida sin volver a escribirlo, tanto desde la barra superior como desde la pantalla Fichajes.
  Solo si **otra persona** (por ejemplo el administrador) ficha por ella se pide el código de ella. Las incidencias se escriben sin decimales («Salió 7 h 34 min 44 s antes»).
- **Si algo sale raro en un día** (por ejemplo, una entrada de madrugada de una prueba que se quedó abierta): el administrador puede corregirlo o borrarlo desde Fichajes (lápiz / papelera) y ver cuándo se pulsó cada botón en Actividad.

### Actividad: quién hizo qué, cuándo (solo administrador)
- Menú **Actividad**: todo lo que hacen las empleadas desde que entran con su código (citas creadas, movidas, cobradas, anuladas, borradas; clientes; ventas; bonos; fichajes;
  entradas con el código e intentos fallidos…), con **quién, qué, día y hora con segundos** y, al pulsar «Ver detalle», el **antes y el después** (por ejemplo, 10:00 → 11:00).
  Filtros por persona, tipo, texto y fechas; «Cargar anteriores» para ir hacia atrás.
- Las reservas que entran por **GHL (la IA / reserva online)** quedan anotadas como creadas por **«GHL · IA»**, con el título que mandó.
- **Tres puntitos (⋯)** en la cita (junto al título) → **«Ver actividad de esta reserva»**: la historia de esa cita (quién la creó, quién la movió, quién la cobró…). En **Clientes** y en la
  ficha del cliente → **«Ver actividad»** (todo lo de ese cliente).
- **Lo anota el servidor**, no la pantalla: una empleada no puede saltárselo ni borrarlo. Nadie (ni tú desde la app) puede modificar, borrar ni vaciar anotaciones, y la base de datos lo impide (`UPDATE`, `DELETE` y `TRUNCATE` están bloqueados por disparadores; comprobado en un PostgreSQL real).
  No se guardan códigos de acceso ni claves; el cambio de un código se anota sin el valor.
- **Límites:** solo se anota lo que pasa por la app y las reservas nuevas que entran de GHL. Un cambio hecho **dentro de GHL** sobre una reserva ya importada (mover/cancelar allí)
  no se importa a la agenda, y por tanto no queda anotado.

### Turnos: ciclos de semanas y vista de mes
- En la ficha de la empleada → **Rotativo**: ya no hay que rellenar cada semana. Eliges un **atajo** («Todas iguales», «Alterna 1 y 1», **«2 semanas y 1 distinta»**, «3 y 1»), rellenas
  solo los **tipos de semana** (A, B…) y el ciclo se repite siempre. Tocas una semana del ciclo para cambiar su tipo; «+ semana» / «− semana» alargan o acortan el ciclo. Al pasar a rotativo
  empieza con su horario actual. Debajo, una **vista previa de las próximas 8 semanas** (A A B A A B…).
- En **Turnos** hay un conmutador **Semana / Mes**: el **mes completo** de una empleada de un vistazo (con su ciclo, ausencias y días especiales); tocas un día para cambiarlo solo ese día.

## Menú: Empleados y Catálogo

- **Empleados:** Miembros del equipo, Turnos, **Cabinas** y **Fichajes**. **Catálogo:** **Servicios** y **Productos**. Cada opción respeta su permiso; el grupo aparece si puedes ver alguna de sus opciones.

## Empleadas ↔ GHL: calendario y baja

> **Para usarlo:** en GHL tiene que existir el **usuario** de la empleada (Ajustes → Equipo) con su mismo nombre, y tu clave de GHL necesita poder leer usuarios y crear calendarios.

- **Al añadir o editar una empleada** se le crea su calendario en GHL (con su nombre, **sin horario de reserva**: nadie puede reservar online en él, la agenda lo usa para sus citas) y se le asigna solo, si en GHL hay un usuario con su nombre. Si ya tiene calendario, solo se le actualiza el nombre.
  Si no hay usuario suyo, o hay dos posibles, **no adivina**: la empleada se guarda igualmente y el aviso dice qué hacer (crear el usuario o asignarle el calendario a mano en Configuración → Conexión con GoHighLevel).
- **Al eliminarla no se borra nada en GHL:** su calendario y su usuario pasan a llamarse **«empleado-eliminado»** y su calendario se desactiva y se deja **sin horario** (nadie puede reservarle más). Va antes de borrarla de la app (hace falta su ficha para localizarlos). Después, sus servicios se actualizan en GHL sin ella.
  Si GHL no deja renombrar su usuario (permiso), el calendario sí queda bloqueado y el aviso te dice que lo renombres a mano.
- **Lo que NO hace:** crear usuarios en GHL desde la app (suele exigir una clave de agencia y su email). Se crean en GHL y la app hace el resto.

## Cursos de ventas

> **Para usarlo:** pega de nuevo `supabase/schema.sql` (tablas `lecciones` y `resultados_cursos` y el objetivo por empleada) y ejecuta de nuevo `supabase/seguridad.sql`.

- Menú **Cursos**, para todas. **Cada empleada** ve: lo **facturado esta semana y este mes**, sus **ventas extra** (lo que añadió «a mayores»: servicios extra, productos y bonos que vendió, desglosado) y su **objetivo semanal de ventas extra** con barra de progreso.
- **Clases según su objetivo:** *Base* siempre abiertas; *Refuerzo* se abren si la semana pasada **no** llegó al objetivo; *Avanzadas* se abren al **alcanzarlo** (la semana pasada o esta). Las bloqueadas dicen por qué. Sin objetivo definido solo están las base.
- **Test obligatorio cada semana:** el administrador marca qué test es obligatorio; cada empleada debe aprobarlo **cada semana (lunes–domingo)**. Aviso en la pantalla y **contador rojo en el menú** mientras falte. Se puede repetir hasta aprobar; al contestar se le enseña qué falló y cuál era la correcta.
- **El test lo corrige el servidor:** las empleadas **nunca reciben las respuestas correctas** y los resultados solo los guarda el servidor (no se pueden escribir desde la app). Cada una ve solo sus resultados. Todo test hecho queda en Actividad.
- **Administrador:** pestaña **Equipo** (facturado y extra de cada empleada esta semana y este mes, cumplimiento del objetivo, test pendiente o aprobado) con el **objetivo semanal editable** por empleada (solo él lo cambia), y pestaña **Gestionar clases** (crear, editar, activar/desactivar, eliminar; test con 2 a 4 opciones por pregunta, mínimo para aprobar y «obligatorio cada semana»).
- **Ticket medio y clase de refuerzo.** Se enseña el **ticket medio** de cada empleada (lo que deja de media cada cita cobrada) y el administrador puede fijar un **objetivo de ticket medio** por empleada (junto al de ventas extra, en la pestaña Equipo). Las clases de **refuerzo** ahora se abren a la empleada cuando la semana pasada ocurrió **cualquiera** de estas tres cosas: *no llegó a su objetivo de ventas extra*, *su ticket medio fue menor que su objetivo* o *hizo 3 citas o más sin ninguna venta cruzada* (esta última no necesita objetivos). La empleada ve un aviso «Te recomendamos una clase para vender mejor» que dice el motivo y abre la clase; la clase cerrada explica cuándo se abriría. Si la semana pasada no trabajó (sin citas), no se le dice nada.
- **Clase recomendada:** en *Gestionar clases* aparece **«Vender más sin presionar: ventas cruzadas y ticket medio (explicado fácil)»** con un test de 8 preguntas (se aprueba con el 70 %). Está escrita para que la entienda cualquiera: qué es el ticket medio y la venta cruzada con ejemplos de cafetería, un método de 3 pasos, frases para copiar, frases que no hay que decir, los errores típicos, y cómo apuntar el extra en la cita. No promete resultados. Se añade con **«Añadir esta clase»** (no se añade sola; «Ver el contenido» la enseña antes) y luego se edita como cualquier otra. Es de tipo refuerzo, así que se abre sola cuando toca.
- **Para usarlo:** vuelve a pegar `supabase/schema.sql` (añade el objetivo de ticket medio por empleada).
- **Cómo se calcula:** facturación en base de caja (como los informes); ventas extra = servicios extra y productos de sus citas cobradas + productos de sus ventas sin cita + bonos que vendió.

## Productos: importar y exportar

- **Catálogo → Productos:** «Importar productos», «Exportar CSV (Excel)» y «Exportar JSON». Lo más cómodo: **exporta**, edita en Excel y vuelve a **importar**.
- **Formato:** CSV (el que guarda Excel, con `;` y comas decimales: `12,5` o `9,90 €`) o JSON, con las columnas **nombre, precio, stock y activo** (stock y activo son opcionales; también entiende «producto», «pvp», «existencias»…).
- **Si ya existe** (mismo nombre, sin importar mayúsculas), se **reemplaza** su precio, stock y estado conservando su historial de ventas; si el archivo no trae stock, se queda el que había. Los idénticos no se tocan.
- **Empezar de cero** (solo el administrador) elimina los que no estén en el archivo; **los que tienen ventas o citas no se borran, se desactivan**. Antes de borrar pide confirmación. Eliminar productos es solo del administrador también en el servidor.
- Las importaciones grandes quedan en **Actividad** como una sola anotación.

## Reprogramar una cita

- En la cita abierta hay un botón **«Reprogramar»** (no en las ya cobradas ni en las canceladas). Al pulsarlo se cierra la cita y vuelves a la agenda, en el día de esa cita, con un aviso arriba: *«Reprogramando la cita de María… haz clic en el hueco donde la quieres: en verde está libre, en rojo no»*.
- **Cambia de día con las flechas** (o el calendario) como siempre. Al **pasar el ratón** por un hueco aparece la cita con su duración: **verde «libre ✓»** o **rojo con el motivo** (se solapa con otra cita · fuera del horario de la empleada · coincide con un horario no disponible · esa empleada no hace ese servicio).
- **Un clic en un hueco libre la mueve** (con la empleada de esa columna; los huecos se afinan a cuartos de hora). Si el hueco **no está libre** pregunta «¿La reprogramas igualmente?» (*Elegir otro hueco* / *Reprogramar igualmente*): se puede, pero avisando.
- **Cancelar:** el botón del aviso, la tecla Esc o cambiar de pantalla. Mientras reprogramas, pulsar otra cita no la abre. Si la cita tenía cambios sin guardar, antes pregunta.
- Al moverla se actualiza en GHL como siempre, y **su confirmación vuelve a «pendiente»**.

## Confirmar la asistencia de las citas (✋ · no cogió)

> **Para usarlo:** vuelve a pegar `supabase/schema.sql` (añade `citas.confirmacion` y quién/cuándo). Sin eso, todo funciona menos anotar confirmaciones.

- **En cada cita:** fila «Confirmación: ✋ Confirmada · 📵 No cogió» (se vuelve a pulsar para dejarla pendiente) y, en los **tres puntos ⋯**: *✋ Confirmada: viene*, *No cogió la llamada* y *Quitar la confirmación*. Se anota quién y cuándo.
- **En el calendario**, la cita confirmada enseña una **mano ✋** y la que no cogió, un **teléfono tachado**. Las pendientes no enseñan nada.
- **«Confirmar mañana»** (botón de la agenda, con el número de citas de mañana sin confirmar): lista las citas del día por hora, sin canceladas ni cobradas, con **Llamar** (marca con un toque), **WhatsApp** (abre el chat con el mensaje ya escrito: *«Hola María, te escribimos de Clinic Nails & Beauty para confirmar tu cita mañana, jueves, 8 de octubre, a las 10:00 (Eternal Radiance). ¿Nos confirmas que vienes?…»*), **✋ Confirmada**, **No cogió** y **Abrir**. Arriba, el resumen (confirmadas · no cogieron · pendientes) y flechas para otros días. Una clienta sin teléfono no tiene enlaces.
- **Si cambias la cita de día, hora o empleada, la confirmación vuelve a «pendiente»** (hay que confirmarla de nuevo). Todo queda en **Actividad**.
- **Que confirme el WhatsApp de la IA de GHL:** Configuración → Conexiones → «Bot de IA de GHL» → apartado **5**: *Crear o mostrar el enlace seguro* (solo el administrador). En GHL, en el flujo que se dispara cuando la clienta confirma, añade la acción **Webhook (POST)** con el enlace de «confirmada» (otro con «no_contesta» si quieres). GHL manda el contacto y la app marca **su próxima cita** (de hoy en adelante, sin canceladas ni cobradas); si GHL manda también la cita o una fecha, se usa esa. Aparece en Actividad como «WhatsApp (IA de GHL)».
  El enlace lleva una **clave**: quien lo tenga puede marcar confirmaciones, no lo compartas. «Cambiar la clave» deja de valer los enlaces antiguos. Un «no» o un estado desconocido **no se interpreta**: no confirma ni cancela nada por adivinar.
- **Qué no puedo comprobar desde aquí:** cómo tienes montado el flujo o el bot en GHL ni qué datos manda tu cuenta. Haz una prueba con una clienta de prueba y mira en Actividad.

## Horarios no disponibles: ahora se ven en GHL

- Antes se enviaban como «block slot» interno: GHL decía OK pero **no lo dibujaba** en el calendario. Ahora se crea un **evento «No disponible — motivo»** en el calendario de la empleada (con un contacto «No disponible» sin teléfono real y en «no molestar»: no recibe ningún mensaje). Se ve en GHL y nadie puede reservar ahí. Al editarlo o moverlo se borra el anterior y se crea el nuevo; al borrarlo, desaparece.
- Si GHL no dejara crear el evento, se usa el bloqueo interno de antes y la app **avisa** de que GHL no lo dibujará. La importación sigue ignorando estos eventos (no vuelven como citas).
- Si en GHL tienes flujos que actúan al «reservar una cita», este contacto «No disponible» también los activará: exclúyelo si hace falta.

## Qué permite el agente de IA de GHL (para que reserve con el servicio correcto)

Comprobado en la ayuda y el tablón de peticiones de GHL (no en tu cuenta):
- **Agente de voz (Voice AI):** SÍ tiene «acciones personalizadas» (envía un webhook POST a una dirección externa durante la llamada).
- **Agente de chat (Conversation AI: WhatsApp, SMS, Instagram…):** las acciones personalizadas **se siguen pidiendo** en su tablón de ideas, así que **no se pueden contar con ellas** para el chat. Sí tiene las acciones nativas: reservar en uno o varios calendarios, actualizar un campo del contacto, lanzar un workflow, etiquetas y pasar a una persona.
- Por eso, para el agente de chat, la opción de que «reserve llamando a nuestra app» no es viable; las vías posibles son el campo «Servicio» (ya hecho), un calendario de GHL por servicio, o enviar el enlace `/reservar`.

## Importar y exportar clientes (por ejemplo, desde Fresha)

En **Clientes → «Importar / Exportar»** (una sola ventana con dos pestañas).

**Importar** (CSV; vale el de Fresha o cualquier Excel):
- Se **reconocen solas las columnas** de Fresha (*First name, Last name, Email, Mobile phone, Client notes*), en inglés o en español, con `,` `;` o tabulador, con o sin acentos, y notas con comas y saltos de línea. Un archivo con muchas más columnas (ID, género, dirección…) también vale: se ignoran las que no sirven. Puedes **corregir a mano** qué columna es cada dato antes de importar.
- **Teléfono alternativo:** si una clienta no tiene móvil pero sí teléfono fijo, se usa el fijo (antes se perdía).
- **No duplica:** reconoce a las que ya existen por **teléfono o email** (aunque estén escritos distinto: «+34 600 111 222», «0034…», con espacios) y a las repetidas dentro del propio archivo.
- **Completar:** a las que ya existían se les puede **rellenar lo que les falta** (email, teléfono o nota) sin pisar nunca lo que ya tienen. Viene marcado; se puede desmarcar.
- **Notas:** las notas del archivo se guardan como **«nota fija»** de la clienta (se ven al abrir sus citas). Viene marcado y lo dice; se puede desmarcar.
- **Antes de importar** ves cuántas son nuevas, cuántas no se importan y por qué, y una vista previa. Hay un botón para **descargar las filas que no se importan** (con la línea, el motivo y sus datos) y revisarlas en Excel.
- Avisa de las nuevas que **no tienen ni teléfono ni email**: no se pueden reconocer y, si importas el mismo archivo dos veces, se duplicarían.
- Se importa de 200 en 200, así que **miles de clientas** no dan problema. Si se corta a mitad, **vuelve a subir el mismo archivo**: las que ya están se saltan solas.
- *No he podido ver un archivo real de Fresha* (su ayuda solo describe lo que acepta al importar): por eso el emparejado de columnas es flexible y editable. Si algún archivo tuyo no se reconoce bien, pásamelo (sin datos reales: vale con las cabeceras) y lo ajusto.

**Exportar:**
- **Completo (para Excel):** nombre, teléfono, email, etiquetas, visitas, última visita, gasto total y nota fija.
- **Para importar en Fresha u otro programa:** *First name, Last name, Email, Mobile phone, Client notes*. Lo que exportas así se puede volver a importar sin perder nada.
- Todas las clientas o solo las que ves con tu búsqueda/filtro; separador **`;`** (Excel en español) o **`,`** (estándar).
- Archivo UTF-8 con BOM (acentos y ñ bien en Excel) y **protegido contra fórmulas**: si un nombre o nota empieza por `=` o `@`, se le antepone un apóstrofo para que Excel no lo ejecute.

## Crear clases con IA

> **Para usarlo:** hace falta una clave de la IA (de pago por uso). 1) Crea una cuenta en **console.anthropic.com**, añade algo de saldo y crea una clave de API. 2) En el hosting añade la variable **`ANTHROPIC_API_KEY`**. 3) Reinicia la app. (Opcional: **`ANTHROPIC_MODEL`** para cambiar de modelo; por defecto `claude-sonnet-5-5`. **No he podido comprobar ese nombre contra tu cuenta:** si la IA responde que no reconoce el modelo, pon en esa variable uno que aparezca en tu cuenta de Anthropic.) Sin la clave, el botón explica estos pasos.

En **Cursos → Gestionar clases → «Crear clase con IA»** (solo el administrador), dos caminos:
1. **Describe lo que quieres:** «cómo vender un bono de radiofrecuencia a una clienta que duda por el precio». Eliges el tipo (base, refuerzo o avanzada) y 6, 8 o 10 preguntas.
2. **Según mis resultados:** la app mira tus números de las últimas semanas con **reglas fijas, sin IA**, y te enseña lo que ve, con la cifra: ventas cruzadas bajas (menos del 30 % de las citas cobradas con algo más), ticket medio por debajo del objetivo, cancelaciones y «no vinieron» altos (12 % o más), próximos 7 días con poca agenda (menos del 55 %), muchas clientas en riesgo o perdidas, caída de facturación (−15 % o más), bonos sin gastar. Eliges uno y la IA escribe la clase sobre eso. Si todo va bien, propone una de fidelización.

La IA **solo escribe** la clase y su test: tú la ves antes de guardarla, puedes cambiar el título y el texto, **quitar preguntas** (mínimo 3), pedir **otra versión** diciendo qué cambiar, y elegir el tipo. Se guarda como una clase normal (no obligatoria, aprobado con el 70 %). Está pensada para quien no sabe de ventas: lenguaje sencillo, frases cortas, ejemplos y frases para copiar, **sin prometer resultados ni afirmaciones médicas**.
- **Lo que se envía a la IA:** lo que escribes, el tipo, los nombres y precios de tus servicios y, si usas el segundo camino, las cifras de arriba. **Nunca** nombres ni teléfonos de clientas ni de empleadas.
- **Control de calidad:** se comprueba que la respuesta tiene el número de preguntas pedido, 3 opciones cada una, una respuesta correcta válida, sin Markdown y con una longitud razonable; si no, se le devuelve a la IA con el motivo (un reintento). La posición de la respuesta correcta se **reparte al azar** (las IA tienden a ponerla siempre en el mismo sitio).
- **Límites:** como mucho 12 clases por hora. La clave nunca sale del servidor. **La IA puede equivocarse: léela siempre antes de crearla.**

## Reservas online para las clientas (página `/reservar`)

> **Para usarlo:** 1) vuelve a pegar `supabase/schema.sql` (columna `servicios.reservable_online` y las tablas `clientes_acceso` y `clientes_codigos`) y ejecuta de nuevo `supabase/seguridad.sql`; 2) **Configuración → Reservas online**: activa, pon el enlace de tu política de privacidad y guarda; 3) comparte el enlace (botón **Copiar**). Vienen **desactivadas** hasta que las actives.

**Lo que ve y hace la clienta** (página pública, sin código, sin nada de la agenda interna):
1. **Servicios:** catálogo con buscador y categorías; puede elegir hasta 4 (se hacen seguidos, con la misma persona). Ve duración y precio totales.
2. **Día y hora:** 14 días de un vistazo (y un calendario para más), «me da igual» o una empleada concreta (solo las que hacen todos los servicios elegidos) y **solo los huecos libres de verdad**.
3. **Sus datos:** **nombre y teléfono obligatorios, email opcional**, casilla de consentimiento (con tu política de privacidad) y «Recordarme en este dispositivo».
4. **Reserva hecha:** resumen y botón para añadirla al calendario del móvil (.ics).

**«Acceder siempre sin olvidarse»:** tras reservar con «Recordarme», su móvil la reconoce (saluda por su nombre, rellena sus datos y le deja **ver y cancelar sus citas**). Si cambia de móvil o borra los datos, entra con su **email**: recibe un **código de 6 cifras** (caduca en 10 minutos, 5 intentos, un solo uso) y queda recordada de nuevo. La app **nunca revela si un email está registrado**. Si no ha dado email, se la reconoce por el teléfono al reservar (no se duplica la clienta), pero no puede entrar a ver sus citas desde otro móvil.

**Cómo se calculan los huecos** (en el servidor, con el mismo cálculo de horarios que la agenda): horario de cada empleada (fijo o rotativo), días libres, ausencias y días sueltos, tus **horarios no disponibles** y las citas que ya hay (también las que entran por GHL; las canceladas no ocupan). Hoy respeta la **antelación mínima**; hay un máximo de días vista. Al pulsar «Confirmar» **se vuelve a comprobar** y, si dos personas reservan a la vez el mismo hueco, **se retira la última** (nunca queda una doble reserva). Con «me da igual» se asigna a la empleada con menos citas ese día.

**Qué pasa en la agenda:** la cita entra como **«🌐 Reserva online»** (nota en la cita), con la clienta (nueva o existente), queda en **Actividad** con el distintivo «Reserva online», y **se envía a GHL** para que salten tus automatizaciones. Si GHL falla, la reserva se mantiene y queda anotado en Actividad. Si cancela la clienta, la cita queda **cancelada** (no se borra), se avisa a GHL y se anota. Se puede cancelar hasta X horas antes (24 por defecto); después tiene que llamar.

### Recomendados, cambiar citas y enlaces (novedades de las reservas online)

> **Para usarlo:** vuelve a pegar `supabase/schema.sql` (columna `servicios.recomendado_online`). Para los enlaces de las citas hace falta que `SUPABASE_SERVICE_ROLE_KEY` esté en el hosting (ya lo está si la app funciona): con esa clave se **firman** los enlaces.

- **⭐ Recomendados arriba:** lo primero que ven las clientas es el apartado «⭐ Recomendados». En **Configuración → Reservas online → «Servicios recomendados»** eliges cómo se llenan: **«Los más reservados»** (automático: los servicios más hechos en los últimos 90 días, contando el principal y los extras de cada cita; sin las canceladas; entre 1 y 10), **«Los que yo marque»** (la casilla **⭐ Recomendado en la reserva online** de cada servicio, en Catálogo → Servicios, en el orden del catálogo) o **«Sin apartado»**. Sin historial todavía (negocio nuevo), en automático valen los marcados a mano. Un servicio que no se puede reservar online no puede ser recomendado. Las **categorías** salen en el **mismo orden que en el catálogo** (con las flechas ↑↓), con «Otros» para lo que no tiene categoría y «Todas» al final. Al buscar, se busca en todo el catálogo.
- **Email obligatorio:** nombre, teléfono y **email** son obligatorios al reservar (el aviso explica para qué: avisarla y que pueda cambiar o cancelar, también desde otro móvil). Si la clienta ya existía sin email, se le rellena.
- **Política de privacidad marcada por defecto.** ⚠️ **Aviso legal, dicho con claridad:** el RGPD (considerando 32) dice que **una casilla premarcada no vale como consentimiento**. Para **gestionar la reserva no hace falta consentimiento** (es necesario para prestar el servicio), así que la casilla marcada no te complica la reserva en sí; pero **no uses estos datos para publicidad o promociones basándote en esa casilla**. Si quieres mandar promociones, añade una casilla **aparte y sin marcar**. La alternativa más segura (te la preparo en un minuto si la quieres) es quitar la casilla y dejar solo el texto «Al reservar aceptas nuestra política de privacidad».
- **Cambiar una cita:** en «Tus próximas citas», junto a «Cancelar», hay **«Cambiar»**: la clienta elige otro día y hora (el hueco que ya ocupa cuenta como libre), con la **misma profesional si puede** (o solo con ella, o «me da igual»). Se respeta el mismo margen que para cancelar (24 h por defecto), se vuelve a comprobar el hueco al confirmar (si dos personas coinciden, la cita se queda **exactamente como estaba**), la **confirmación se reinicia**, la cita lleva la nota «🔁 Cambiada por la clienta…», queda en **Actividad** y se **mueve en GHL**.
- **Un enlace por cada cita:** `https://tu-web/reservar/cita/<código>`. Con él, la clienta **ve su cita, la cambia o la cancela sin entrar con nada**. El código lleva la **firma del servidor**: no se puede adivinar ni sacar el de otra cita, y cambiar la clave secreta del servidor los invalida todos (no se guarda nada en la base de datos). La página solo enseña día, hora, servicios, profesional y el nombre de pila (nada de teléfonos ni emails) y no sale en Google. **Funciona aunque las reservas online estén desactivadas** (nunca se bloquea cancelar). Lo ve la clienta al terminar de reservar, y tú lo copias desde la cita (**tres puntitos → «🔗 Copiar enlace para cambiar o cancelar»**).
- **Para mandarlo desde una automatización de GHL:** crea en GHL → Ajustes → Campos personalizados un **campo de contacto de tipo texto llamado «Enlace cita»** (también vale «Link de la cita» o «Enlace para gestionar la cita»). La app deja en ese campo **el enlace de la PRÓXIMA cita de cada clienta** cada vez que se envía una cita a GHL (reserva online, agenda, cambio, cancelación o cita que entra por el bot de IA) y **lo vacía si ya no le quedan citas próximas**. En tus plantillas de SMS o email usa **`{{contact.enlace_cita}}`**. Si no existe ese campo, simplemente no se escribe nada. **No he podido comprobarlo contra tu GHL:** pruébalo con una cita tuya.
- **Dirección pública:** si usas un subdominio (por ejemplo `reservas.tudominio.com`), pon en «Dirección pública de la web» esa dirección para que los enlaces la usen; si la dejas en blanco, se usa la de la página desde la que se pidió el enlace.
- **Entrar con el email sin pedir código cada vez:** al introducir el código, la casilla **«Mantenerme conectada en este dispositivo»** (marcada por defecto) hace que no se pida otro código. Ahora el pase se guarda **también en una cookie del servidor** (`httpOnly`, 400 días, que no puede leer ni la página ni ningún script): así, si el móvil borra lo que guardan las páginas por su cuenta (**Safari lo hace a los pocos días sin visitar la web**, según su política de privacidad), la clienta **sigue reconocida**. «No soy yo» borra el pase del servidor y la cookie. Quien no marque la casilla entra solo para esa visita.
- Se arregló además que salía abierto a la vez «Hola, edu» y el formulario de «entrar con mi email» (se abría antes de saber que ya estaba reconocida), y que los días salían como «Lunes, 12 **De** Octubre».

**Activar sin equivocarte** (Configuración → Reservas online):
- Marcar o desmarcar **«Reservas online activadas» guarda al momento** (antes había que bajar al botón «Guardar» y, si se olvidaba, la página pública seguía diciendo «Ahora mismo no se puede reservar online»).
- Arriba siempre se lee el **estado guardado** («ACTIVADAS ✓» o «DESACTIVADAS») y, si cambias cualquier otro campo, sale arriba un aviso rojo **«Tienes cambios sin guardar»** con su botón «Guardar ahora».
- **«Comprobar qué ve una clienta»** pide la página pública de verdad y te dice: si está activada, cuántos servicios y profesionales ve, si tiene enlace de privacidad y, si aquí está activado pero la página pública dice que no, que hay un problema de memoria (caché) del hosting o de la base de datos.
- La página pública y su catálogo se piden siempre «frescos» y sin memoria (cabeceras `no-store` y un número al final), para que un cambio se vea al instante aunque el hosting guarde copias.

**Reglas que configuras:** antelación mínima, días vista, un hueco cada 10/15/20/30/60 min, horas para cancelar, citas próximas por clienta (3 por defecto), mensaje de bienvenida y enlace de privacidad. Cada servicio tiene el interruptor **«Se puede reservar online»** (en su ficha) para dejar fuera los que necesitan valoración.

**Protección:** límite de intentos por IP y por teléfono (reservas), por email (códigos), campo trampa contra bots, datos validados en el servidor, el catálogo público solo enseña nombre, descripción, duración y precio (nada de teléfonos, horarios internos ni clientas), errores genéricos sin detalles técnicos, y los pases se guardan solo como huella (nunca el pase en claro).

**Lo que debes saber (límites reales):**
- **El código por email lo envía GHL** (API de conversaciones). Funciona **solo si tu GHL tiene el email configurado y tu clave tiene el permiso `conversations/message.write`**. No lo he podido probar contra tu cuenta: pruébalo con tu propio email antes de compartir la página. Si no funciona, las clientas pueden reservar igualmente.
- Los **límites de intentos** viven en la memoria del servidor: se reinician si el hosting reinicia la app.
- **Sin pago por adelantado** ni aprobación manual previa (la reserva queda confirmada al instante). Si hay plantones, se puede añadir una señal o aprobación.
- **Protección de datos:** la clienta acepta el tratamiento al reservar, pero **tú eres el responsable**: pon tu política de privacidad y no pidas datos de salud en esta página. El móvil «recordado» guarda el pase solo en ese dispositivo.
- Las **ausencias/vacaciones** sí se respetan aquí (la agenda las conoce); en GHL solo llegan si las bloqueas allí (ver «Horario semanal → GHL»), así que **el bot de IA de GHL y la página pueden no coincidir en esos días**.

**Subdominio:** si apuntas `reservas.tudominio.com` a esta misma app en Hostinger, su página de inicio abre **directamente las reservas** (la agenda interna solo vive en la raíz del dominio principal y queda oculta en ese subdominio). Así no necesitas una segunda aplicación.

## Nombre del negocio y favicon

- **Configuración → Negocio** (solo el administrador lo guarda; todas lo ven en el menú): el **nombre del negocio** (hasta 60 letras, sin «<» ni «>»). Con una **vista previa en directo** de cómo quedará el menú, el título de la pestaña y el icono; no cambia nada hasta pulsar **Guardar**. Hay un botón para volver a «Clinic Nails & Beauty». No hace falta pegar nada nuevo en Supabase (se guarda en los ajustes que ya existen).
- **Dónde se usa:** el **menú lateral** (el nombre se parte en dos líneas: con «&» se corta ahí, «Clinic Nails» / «& Beauty · agenda»; sin «&», las dos primeras palabras arriba), la **letra del logo** del menú, la **pantalla de entrada con el código** (en mayúsculas, con el «&» resaltado), el **título de la pestaña** del navegador («Nombre — Agenda interna»), el **favicon**, los **WhatsApp a las clientas** («te escribimos de …»: confirmar citas y reactivar), el **texto para el bot de IA de GHL** y el **nombre del horario** que se envía a GHL («Nombre — Silvia»).
- **Favicon:** hay uno por defecto (`app/icon.svg`: cuadrado con «CN») y, al guardar el nombre, la app crea **uno propio con las iniciales del nombre y el color de la marca** (el de «Colores»): «Studio Luna & Co» → **SL**, «Barbería Antón» → **BA**. Se salta «&», «y», «de», «la»… al sacar las iniciales. Cambia solo si cambias el nombre o el color. Es un icono vectorial (SVG), que ven bien Chrome, Firefox y Edge; **Safari no siempre muestra favicon SVG**. Si prefieres tu **propio logo** como icono, dímelo y se añade (subir una imagen).
- **Sin parpadeo:** el nombre, el título y el icono se guardan también en el navegador de cada persona, así que la pantalla del código y la pestaña salen ya con tu nombre (antes de entrar no se puede leer de la base de datos, que está cerrada). La primera vez en un navegador nuevo saldrá el nombre por defecto hasta que alguien entre con su código.
- **Lo que NO cambia:** el nombre en GHL, en tus anuncios, en tus plantillas de WhatsApp de GHL ni en los textos fijos que escribas a mano: solo el de esta agenda y los mensajes que genera.

## Horario semanal de las empleadas → GHL (para que el bot agende bien)

> **Para usarlo:** vuelve a pegar `supabase/schema.sql` (columna `empleadas.ghl_schedule_id`). Tu clave de GHL necesita permiso de **escritura de calendarios**.

**El problema:** el bot de IA agenda según la disponibilidad que tenga cada empleada en GHL. Si el horario de la agenda y el de GHL no coinciden, el bot reserva fuera de horario. Hasta ahora la app **no** lo enviaba (y los calendarios que crea para las empleadas se crean sin horario).

**Cómo funciona** (API «Availability» de GHL: horarios de disponibilidad por persona, documentación oficial):
- **Configuración → Conexiones → «Horarios de las empleadas → GHL»** muestra el horario semanal de cada empleada. **«Vista previa»** enseña qué se enviaría (crear o actualizar, el resumen —por ejemplo *Lun–Vie 10:00–21:00 · Sáb 10:00–14:00 · Dom libre*— y la zona horaria) y **si GHL ya tiene un horario suyo** (en ese caso lo adopta y lo **reemplaza**, avisándote antes). Solo al pulsar **«Enviar a GHL»** se escribe algo; hasta entonces no se toca nada.
- **Después, automático:** cada vez que cambies su **horario semanal** (horas, días libres o tipo de horario) y guardes su ficha, se actualiza solo en GHL, **pero únicamente para las empleadas a las que ya se lo enviaste con el botón** (así nunca se toca el horario de GHL de quien no has confirmado). Cambiar otra cosa (nombre, teléfono…) no lo reenvía.
- Mismo criterio que la agenda: un día es libre si está en sus «días libres»; si no, trabaja de su hora de inicio a su hora de fin (y sin horas guardadas, el horario habitual de la agenda: 10:00–21:00).
- Si alguien borra el horario en GHL, la app lo detecta, olvida el vínculo y te dice que lo vuelvas a enviar. Si GHL rechaza algo, se ve el motivo exacto (permisos, o «ese calendario ya tiene un horario aplicado»).

**Lo que NO se envía (dicho claramente):**
- **Turnos rotativos** (cambian cada semana): GHL solo admite un horario semanal fijo. El panel te lo dice y no ofrece enviar.
- **Ausencias, vacaciones y días sueltos modificados**: GHL necesita fechas concretas y no he podido verificar su formato en la documentación. La vista previa y el envío **te avisan de cuántos hay**; para esos días, bloquéalos en GHL o con «Horario no disponible» en la agenda (ese sí se ve en GHL).
- **Qué no he podido comprobar desde aquí:** que tu cuenta de GHL acepte el envío (permisos, y los nombres exactos de los filtros de búsqueda de horarios). Pruébalo primero con una empleada y mira en GHL → Calendarios → Disponibilidad que el horario es el esperado.

## Citas borradas en GHL: ahora se cancelan también en la agenda

Antes, si borrabas una cita en GoHighLevel, **se quedaba en la agenda para siempre** (una cita borrada ya no sale en la lista de GHL, así que nadie la revisaba). Ahora, en cada sincronización (cada ~20 segundos con la agenda abierta), la app busca las citas con vínculo a GHL que **ya no aparecen** en su lista y **pregunta a GHL por cada una**: solo si GHL responde que **no existe** (o que está borrada), la cita **se cancela en la agenda** (no se borra: queda en el historial con la nota «🗑️ Eliminada en GoHighLevel», se anota en Actividad y sale un aviso «Desde GHL: 1 cita eliminada en GHL (María, cancelada aquí)»).
- **Para no cancelar nada por error:** solo si **todos los calendarios se leyeron bien** en esa vuelta; solo citas **de hoy en adelante**, **sin cobrar**, no canceladas, con vínculo y de un calendario que sí se ha leído; nunca los «horarios no disponibles»; y si GHL contesta con un error o hay cualquier duda, **no se toca nada**. Máximo 25 comprobaciones por vuelta (el resto, en la siguiente).
- Las ya **cobradas** no se tocan nunca. Si borras en GHL una cita ya cobrada, sigue en la agenda.
- La cita cancelada queda **desvinculada** de GHL: si la reactivas en la agenda, se vuelve a crear en GHL.

## Fusión de los cambios de Claude Code (reserva del bot con su servicio real)

Se han incorporado a este proyecto los cambios que hizo Claude Code en el importador: cuando la cita viene del bot y su servicio se toma del campo «Servicio» del contacto,
- la cita **dura lo que dura ese servicio** (el calendario de la empleada reserva huecos de duración fija; se recorta si pasara de las 24:00);
- en GHL se **corrige el evento** (se alarga al tiempo real y se le pone el título «Servicio – Clienta») para que bloquee el hueco real;
- y se **vacía el campo «Servicio»** del contacto, porque el bot de IA solo rellena campos vacíos: así la siguiente reserva de la misma clienta puede escribir el servicio nuevo.
Si GHL rechaza alguna de las dos correcciones, la cita **entra igualmente** y se avisa de qué falló. Cuidado: corregir el evento en GHL puede lanzar tus automatizaciones de «cita modificada». Además se corrigió que una cita que acaba a medianoche se enviaba a GHL con la hora «24:00» (ahora, 00:00 del día siguiente).

## Reservas del bot de IA: por revisar y diagnóstico (opciones A + E)

El bot de IA de GHL reserva en el calendario de la empleada pero **no sabe qué servicio es**. La app arregla eso en dos capas:

**A · Que el bot apunte el servicio (campo «Servicio» del contacto).** Ya estaba hecho para todas las empleadas a la vez (se lee el campo del contacto, da igual con quién reserve), y ahora:
- **Admite varios servicios:** si el bot escribe «Dermapen, Radiofrecuencia» (o «Dermapen y Radiofrecuencia», «+», «;»…), el primero es el servicio principal, los demás van de **extra**, la cita dura **la suma** y en GHL se corrige el título («Dermapen + Radiofrecuencia – Ana») y la duración. Un servicio que se llame «Manicura y pedicura» **no se parte**. Si algún trozo no se reconoce, no se da por bueno y la cita queda **por revisar**. (Para que el bot pueda apuntar varios, el campo de GHL debe ser de **texto**; una lista desplegable solo admite uno. El texto para el bot ya lo explica.)
- **Diagnóstico por empleada:** en Configuración → Conexiones → «Bot de IA de GHL» hay **«¿Está llegando el servicio con cada empleada?»**: reservas del bot de los últimos 30 días, cuántas llegaron **con servicio**, cuántas **sin servicio** y cuántas **por revisar**, por empleada y en total. Si con alguna casi nunca llega (menos del 80 % con al menos 2 reservas), te dice con quién falla y qué revisar en GHL (que el bot que reserva en su calendario tenga la acción de apuntar el servicio y las instrucciones del paso 2). Así ves si la configuración funciona **con todas**, no solo con una.
- Se corrigió un fallo: la marca «Revisa el servicio» no se quitaba cuando el bot había escrito algo que no coincidía; ahora se quita siempre al revisar.

**E · Bandeja «Por revisar».** En la **Agenda** sale el botón **«⚠ Por revisar (N)»** (y una insignia en el menú «Agenda») con las reservas del bot que llegaron sin servicio (de hoy en adelante y de los últimos 3 días; sin canceladas ni cobradas). Para cada una ves el título que tenía en GHL, qué escribió el bot en «Servicio» (si algo), el servicio y la duración que tiene ahora (por defecto) y eliges el **servicio correcto** (primero los que hace esa empleada):
- **Corregir:** la cita pasa a durar **lo que dura ese servicio** (sin pasar de medianoche), se busca cabina y se **corrige también en GHL** (título y duración, para que bloquee el hueco real). Antes de confirmar te dice cuánto durará y **te avisa, sin bloquear**, si pisa otra cita, queda fuera de horario, esa profesional no hace ese servicio o no hay cabina libre (en ese caso el botón dice «Corregir igualmente»).
- **Está bien así:** deja el servicio y la duración como estaban y solo quita el aviso.
- **Abrir la cita:** para cambiar más cosas.
- En ambos casos la nota queda con «✔ Servicio revisado a mano» (sirve para el diagnóstico) y se anota en **Actividad**. Lo pueden hacer también las empleadas.
- **No verificado contra tu GHL:** la corrección del evento en GHL usa el mismo envío de citas que ya usabas al editar una cita; pruébalo con una reserva real del bot.

## Menú de «tres puntitos» (cita, ficha de clienta, catálogo)

- **En el móvil** (pantallas de menos de 700 px) se abre como un **diálogo centrado** en la pantalla, con fondo oscuro, opciones grandes para tocar con el dedo y un botón **«Cerrar»**. Antes se pegaba al botón y, si el botón estaba a la izquierda, **se salía de la pantalla**.
- **En pantallas anchas** es un desplegable junto al botón que **nunca se sale de la ventana** (si el botón está pegado a un borde, el menú se queda a 8 px de él).
- Se cierra al **tocar fuera**, con «Cerrar», al elegir una opción o con **Escape** (que cierra solo el menú, no la cita o la ficha que hay debajo).

## Marketing · informe del día (solo administrador)

> **Para usarlo:** vuelve a pegar `supabase/schema.sql` (tabla `marketing_contactos`) y ejecuta de nuevo `supabase/seguridad.sql`. Las empleadas no ven este menú ni sus datos.

Menú **Marketing → Informe del día**. Se calcula **al abrirlo con los datos de ese momento** (siempre actualizado):
- **Qué hacer hoy:** una lista corta de tareas con su urgencia: *confirmar las citas de mañana* (cuántas sin confirmar; «Confirmar ahora» abre la lista), *rellenar los huecos de mañana* (horas libres), *escribir a N clientas que hace tiempo que no vienen* y *clientas con un bono sin gastar y sin cita*. Si no hay nada urgente, lo dice.
- **Cómo va el negocio:** facturado hoy (y ayer), **esta semana frente a la anterior** y **este mes frente al mes pasado** (siempre comparando los mismos días, con ▲/▼ y %), **ticket medio** de 30 días, **cancelaciones y «no vinieron»** de 30 días, **ocupación de los próximos 7 días** y **clientas activas / en riesgo (3–6 meses) / perdidas (+6 meses)**.
- **Huecos de mañana** (flechas para otros días): por empleada, los tramos libres de su horario (≥ 30 min; las canceladas no ocupan, los horarios no disponibles sí), el % ocupado y las horas libres. **«¿Por qué hay estos huecos?»** da pistas sacadas de los datos: se ha reservado menos de lo habitual en ese día de la semana (media de las últimas 4 semanas), citas canceladas que han dejado hueco, citas sin confirmar, huecos concentrados por la tarde o la mañana, una empleada con el día casi vacío. **Son pistas, no causas seguras.** Y «Cómo rellenarlos».
- **Clientas que hace tiempo que no vienen:** las que vinieron alguna vez (cita cobrada), llevan más de 30/45/60/90/180 días (se elige) y **no tienen ninguna cita próxima**. Primero las que tienen un **bono con sesiones sin gastar** y las que **más han gastado**. De cada una: cuándo vino, su último servicio, visitas y lo gastado. **WhatsApp** abre el chat con el mensaje ya escrito (con su último servicio y, si quieres, **un hueco concreto de mañana donde cabe su servicio con una empleada que lo hace; a cada clienta se le ofrece una hora distinta**), **Llamar**, **Ya contactada** y **Ficha**. «Ver el mensaje» enseña el texto antes de enviarlo. Al pulsar WhatsApp, Llamar o «Ya contactada» **queda anotado** y esa clienta no vuelve a salir en 14 días (hay una casilla para verlas).
- **La app no envía WhatsApp sola.** Cada mensaje lo mandas tú con un toque. Enviarlos automáticamente exigiría la API de WhatsApp Business (a través de GHL) y el consentimiento de las clientas; los mensajes no prometen descuentos ni resultados.

## Último servicio de la clienta al abrir su cita

Al elegir una clienta (o abrir su cita) aparece **«Último servicio»**: el de su última visita **cobrada** (sin contar canceladas, «no asistió» ni la propia cita), con cuánto hace y cuántas visitas lleva, y un botón **«Repetir este servicio»** (o «Añadir también este servicio» si ya hay uno) que lo añade con un clic. Si la empleada elegida no hace ese servicio, lo avisa; si ya está en la cita, pone «✓ Ya incluido».

## Avisos para las empleadas (popup al entrar con su código)

> **Para usarlo:** vuelve a pegar `supabase/schema.sql` (tablas `avisos` y `avisos_vistos`) y ejecuta de nuevo `supabase/seguridad.sql`.

- **Empleados → Avisos** (solo el administrador). Cada aviso tiene: **título y mensaje**, **para quién** (todas o solo algunas), **cada cuánto** (*todos los días* o *una sola vez*), **días de la semana** (si es diario; vacío = todos), **«solo si todavía no ha fichado hoy»**, fechas de inicio y fin opcionales y activo/desactivado. Hay **vista previa** de cómo lo verá la empleada y un botón **«Recuerda fichar»** que lo deja ya rellenado (diario, para todas y solo si no ha fichado).
- **Cómo sale:** al entrar con su código aparece un popup con sus avisos. Un aviso **diario** sale **una vez al día** (la primera vez que entra; si vuelve a entrar el mismo día, no); uno de **una sola vez** no vuelve a salir cuando lo ha cerrado. Si el aviso es «solo si no ha fichado» y ya ha fichado, se calla (y el de una sola vez no se gasta). Esc o «Entendido» lo dan por visto. El administrador no recibe popups.
- **Convive** con el aviso automático de fichar que ya había (si falta fichar en su turno): Esc cierra primero el de arriba.
- Cada empleada solo lee **sus** avisos y solo puede anotar que ha visto los suyos. Crear, cambiar o borrar avisos queda en **Actividad**; el «visto» no (sería ruido).

## Línea de «ahora» verde y roja

En la agenda, la línea de la hora actual es **verde** en la columna de una empleada si está dentro de su horario y **roja** si está en la zona gris (fuera de horario). La marca de la hora, a la izquierda, es verde si alguna empleada está en su horario y roja si nadie lo está. A las 21:00 en punto (hora de cierre) ya es roja y a las 10:00 (apertura) es verde.

## Borrar una cita: GHL primero la cancela y luego la borra

Al **eliminar una cita** de la agenda, en GHL **primero se marca «cancelada»** (para que salte tu automatización de cita cancelada), se **espera unos 3 segundos** y entonces se **borra**. La espera la hace el servidor (la pantalla no se queda esperando) y se puede cambiar con la variable `GHL_ESPERA_CANCELAR_MS` (por defecto 3000, máximo 10000).
- Si la cita **ya estaba cancelada**, o es un **horario «No disponible»**, se borra directamente: no hay clienta a la que avisar.
- Si GHL no deja marcarla como cancelada, **se borra igualmente** y la app avisa de que tu automatización no se habrá lanzado.
- Ojo: **el botón «Eliminar» de la cita no pide confirmación** (siempre fue así). Y si usas a la vez una automatización de GHL por cita cancelada y avisos por SMS desde la agenda, puedes enviar el mismo aviso dos veces: activa cada uno en un solo sitio.

## Selector de servicios de la cita, con el diseño del catálogo

Al añadir un servicio a una cita se abre una ventana ancha con **categorías a la izquierda** (con su contador, en el orden del catálogo) y los servicios como **tarjetas** (nombre, descripción, duración y precio) con un **buscador** por nombre, categoría o descripción (sin tildes ni mayúsculas); al buscar, los contadores de las categorías se actualizan. En **«Todas»** se agrupan por categoría con su título. Los ya añadidos llevan una marca ✓. En **pantallas estrechas** las categorías pasan a una fila que se desliza y las tarjetas van de una en una. Teclado: escribir filtra, ↑↓ mueven, Intro elige, Esc vuelve. Solo salen los servicios de la empleada elegida.

## Añadir cita, venta u horario como página integrada

- Añadir una **cita**, una **venta** o un **horario no disponible** (y cobrar una cita) ya **no abre un popup**: se abre como una **página integrada** en la zona de contenido, con el menú y la barra superior a la vista y **una sola barra de desplazamiento** (la de la propia página; la de detrás se bloquea mientras está abierta), mucho más ancha
  (hasta 1180 px) y sin fondo oscuro. Arriba hay un botón **«← Volver»** (también funciona Escape).
- **La cita se reparte en dos columnas:** a la izquierda cliente, fecha, hora y empleada; a la derecha servicios y notas (en pantallas estrechas se apilan solas).
- Elegir cliente o servicio sigue siendo un popup pequeño. Los formularios cortos (nuevo servicio, categorías…) también siguen siendo popups.
- **Si pulsas otra opción del menú con algo abierto sin guardar**, pregunta «¿Salir sin guardar?» (Seguir editando / Salir sin guardar): no se pierde nada por un clic.

## Catálogo de servicios: categorías, orden y exportar

> **Para usarlo:** pega de nuevo `supabase/schema.sql` (añade `categorias_servicios` y `servicios.orden`) y ejecuta de nuevo `supabase/seguridad.sql`. Sin eso todo funciona, pero sin orden ni categorías propias.

- **Categorías a la izquierda, servicios a la derecha** («Todas las categorías» agrupa por categoría). Cada servicio enseña su duración («1 h y 20 min»), precio, descripción y empleadas.
- **Ordenar:** arrastra un servicio sobre otro de **su misma categoría** (o usa las flechas ▲▼, que valen también en móvil y tablet). Las categorías se ordenan igual (arrastrando o con «Subir/Bajar» de su menú).
  El orden elegido se usa **en toda la app** (por ejemplo, el selector de servicios al crear una cita).
- **Categorías:** «Nueva categoría», y en el menú de cada una «Editar categoría» (nombre y descripción; al renombrar cambia en todos sus servicios) o eliminarla (sus servicios pasan a «Sin categoría», no se borra ninguno).
- **Nuevo servicio** con una categoría elegida la trae puesta y entra **al final** de ella.
- **Exportar servicios:** descarga `servicios-clinic-nails-AAAA-MM-DD.json` con el mismo formato que se importa (categorías con sus servicios): se puede volver a importar tal cual.
- Al **importar** un archivo se guardan también el orden y la descripción de sus categorías y la posición de cada servicio.

## Cambios hechos en GHL se reflejan en la agenda

> **Para usarlo:** pega de nuevo `supabase/schema.sql` (añade `citas.ghl_snapshot`). Sin eso las citas nuevas siguen entrando, pero el cambio de una cita ya existente se detecta peor.

Antes la app solo **creaba** las citas nuevas que llegaban de GHL; si movías o cancelabas en GHL una cita que ya estaba en la agenda, no pasaba nada. Ahora, cada vez que se sincroniza (cada minuto con la app abierta):

- **Movida en GHL** (otra hora, otro día o otra duración): la cita se mueve en la agenda. **Cancelada en GHL**: queda como «cancelada». **Pasada al calendario de otra empleada en GHL**: cambia de empleada.
- **Sin pisar lo que cambies en la app:** la app recuerda la última versión que tenían igual la app y GHL (`ghl_snapshot`). Para cada dato, gana quien lo haya cambiado desde entonces; si lo cambiasteis los dos a la vez, **gana la app**
  (es lo que se enviará a GHL). Así un cambio que acabas de hacer aquí y que aún no ha llegado a GHL nunca se sobrescribe con la versión vieja.
- **Una cita ya cobrada no se mueve sola**, y un cambio que la dejara fuera del horario de la agenda no se aplica (se avisa).
- Aparece un aviso («Desde GHL: 1 cita cambiada…») y **todo queda en Actividad** como cambio de «GHL · IA».

## Horarios no disponibles en GHL (correcciones)

- **«The calendar is not an event calendar»** al añadir un horario no disponible: los calendarios de las empleadas son de tipo reparto (round robin) y GHL solo deja bloquear por calendario en los de tipo evento. Ahora el bloqueo se
  pone **a la persona** (su usuario de GHL), lo que además la bloquea en **todos** sus calendarios (también los de servicio). Si GHL no lo admitiera, se prueba por calendario como antes.
- El **ID de calendario ya no se pide en la ficha de la empleada**: se asigna en Configuración → Conexión con GoHighLevel.
- **Cabinas:** el botón «Desactivar» ya no se sale del recuadro de la tarjeta.

## Importar servicios desde un archivo

> **Para usarlo bien:** pega de nuevo `supabase/schema.sql` (añade `servicios.descripcion`). Sin eso la importación funciona igual, pero sin guardar las descripciones.
> Tu archivo de ejemplo está en `ejemplos/servicios-clinic-nails.json` (94 servicios, 14 categorías).

**Servicios → Importar servicios** (botón arriba a la derecha). En tres pasos: **1)** eliges el archivo `.json` · **2)** ves qué va a pasar (nada cambia todavía) · **3)** confirmas.

- **Formato:** una lista de categorías, cada una con sus `servicios` (`nombre`, `duracionMin`, `precio`, `descripcion`, opcional `desdePrecio`). También vale una lista plana de servicios con `categoria`.
  Un servicio con `variantes` (sin precio ni duración propios, como «Axila» o «Depilación Piernas») se importa **como un servicio por cada variante**: «Axila · Para ella», «Axila · Para el».
  Los que tengan datos imposibles (sin nombre, precio o duración) se omiten explicando por qué.
- **Si ya existe, se reemplaza:** mismo nombre y categoría (sin importar mayúsculas ni acentos), o el mismo nombre en otra categoría si no hay duda. Se actualizan nombre, precio, duración, categoría y descripción,
  y **se conservan** su `id` (y por tanto sus citas, bonos e informes), sus empleadas, su cabina y su color. Los que ya estén idénticos no se tocan: **volver a importar el mismo archivo no cambia nada**.
- **Empezar de cero** (por defecto, solo el administrador): elimina los servicios actuales que no estén en el archivo. **Los que tienen citas o bonos NO se borran** (en la base de datos, borrarlos dejaría esas citas sin servicio):
  se **desactivan**. Si alguno tenía calendario en GHL, ese calendario se desactiva antes. Antes de borrar pide confirmación y dice cuántos son. Eliminar un servicio también está limitado al administrador en el servidor.
  **Solo añadir y reemplazar** deja todo lo demás como está.
- **Los servicios nuevos** salen activos, con las empleadas que marques (por defecto todas), cabina «cualquiera» y un color por categoría (cada servicio de una misma categoría con un tono distinto).
- Todo queda anotado en **Actividad** (una sola anotación por importación en bloque).

## Bot de IA de GHL: que la cita llegue con su servicio

> **Se quitó** la idea de un calendario de GHL por servicio (no resolvía el problema). La app ya **no crea ni actualiza calendarios de servicios**; los que se crearon en GHL puedes borrarlos tú a mano.

**El problema:** cuando el bot reserva, GHL solo apunta *la persona y la hora*: la cita llegaba sin saber que era una manicura y la app le ponía un servicio por defecto.

**La solución:** el bot **apunta el servicio en un campo del contacto llamado «Servicio»** antes de reservar, y la app lo lee al importar la cita. Se configura una vez, y la app te da los textos hechos:

- **Configuración → Conexiones → «Bot de IA de GHL: que reserve con su servicio»** muestra (con botón de copiar):
  1. Las **opciones del campo «Servicio»** (lista desplegable de GHL): tus servicios activos. Si un nombre está repetido en dos categorías (por ejemplo «Relleno 2 semanas»), sale con su categoría: «Relleno 2 semanas (Extension de pestañas)».
  2. El **texto para las instrucciones del bot**: tus servicios por categoría, con duración y precio, y la orden de preguntar el servicio, guardarlo con su nombre exacto y solo entonces reservar.
  3. El permiso que necesita tu clave de GHL: **`locations/customFields.readonly`** (para que la app pueda leer el campo).
- **Cómo decide la app el servicio de una cita de GHL:** 1.º si el **título** nombra un servicio, ese; 2.º si no, el campo **«Servicio» del contacto**; 3.º si tampoco, uno por defecto con el aviso **«⚠ Revisar servicio»** (y la nota dice qué ponía el campo). Si hay varios servicios con el mismo nombre, gana el de la categoría que nombre el texto y, si no, el que hace esa empleada.
- Cada contacto se lee de GHL **una sola vez por sincronización**. Si la clave no tiene el permiso, la cita entra igualmente y se avisa (una vez) de qué permiso falta.
- **Cuando cambies servicios** (añadir, quitar, renombrar) vuelve a copiar esos textos para que el bot y la app usen los mismos nombres.
- **Qué no puedo comprobar desde aquí:** que tu bot rellene el campo. Depende de cómo esté montado en GHL: haz una reserva de prueba y mira si la cita entra con su servicio.

## Servicios: eliminar con la X, buscar por escrito y arreglo del orden

- **La X de cada servicio ahora lo ELIMINA** (solo el administrador; antes solo lo desactivaba). Pide confirmación; si el servicio ya se usó en citas o bonos, avisa de cuántos y de que quedarán sin servicio, y ofrece **«Desactivarlo en su lugar»**. Un servicio desactivado tiene además ✓ para volver a activarlo. Quien gestiona servicios sin ser administrador sigue viendo activar/desactivar.
- **Error al ordenar** («null value in column "nombre" … violates not-null constraint»): corregido. Guardar el orden, el color o la categoría de varios servicios mandaba filas incompletas y la base de datos las rechazaba. Ahora se mandan las fichas completas (comprobado en un PostgreSQL real con tu mismo caso).
- **Buscador por escrito y listas con scroll** donde antes había listas largas: servicios que puede hacer una empleada (busca por nombre o categoría; «Marcar los N visibles»), productos al cobrar una cita, venta rápida (productos y bonos), editor de bonos y lista de Productos. Ignora tildes y mayúsculas. En los selectores: escribir filtra, ↑↓ mueven, Intro elige, Esc cierra.

## Añadir: cita, venta u horario no disponible

- El botón **Añadir** de la agenda (y el **+** del móvil) pregunta **«¿Qué quieres añadir?»**: **Cita**, **Venta** (productos o bonos, con o sin cita) u **Horario no disponible**.
  La **«Nueva venta»** ya no está en la barra superior: ahora se hace desde Añadir → Venta.
- **Se puede crear una cita en cualquier hueco, aunque esté marcado como no disponible:**
  - En las **zonas rayadas** (fuera del turno de la empleada) basta pulsar el hueco: el menú dice «fuera de su horario» y deja añadir una cita (o un horario no disponible) igualmente.
  - Al pulsar un **bloque de «no disponible»** el menú deja elegir: **añadir una cita igualmente** (a la hora donde has pulsado) o **editar o quitar** ese horario no disponible.
  - Al guardar solo avisa («cae en un horario no disponible… puedes guardarla igualmente»); no lo impide.

## Agenda: mover citas arrastrando y solapar citas

**Mover una cita**: arrástrala por el calendario.
- Se puede cambiar la **hora** (ajusta de 15 en 15 minutos) y/o pasarla a
  **otra empleada** soltándola en su columna. Mientras arrastras ves un
  "fantasma" con la hora de destino, y si pisa a otra cita lo indica.
- **Móvil/tableta**: mantén pulsada la cita un instante y arrastra (si
  mueves el dedo enseguida, es para desplazar la pantalla como siempre).
- **Teclado**: con la cita enfocada, `Alt` + ↑/↓ la mueve 15 minutos y
  `Alt` + ←/→ la pasa a la empleada de al lado.
- Cerca del borde de la pantalla se desplaza sola.
- Al soltar se guarda al instante y se envía a GHL (si cambia de empleada,
  se mueve a su calendario).
- No bloquea nada, pero **avisa** si esa empleada no tiene asignado el
  servicio, si queda fuera de su horario o si se solapa con otra cita.
- Las citas **cobradas no se mueven** (anula el cobro primero). Solo mueve
  dentro del mismo día; para cambiar de día, abre la cita y cambia la fecha.
- Para deshacer un movimiento, arrástrala de vuelta.

**Citas solapadas**: ya no se bloquea. Puedes poner dos (o más) citas a la
misma empleada en el mismo hueco, o alargar una por encima de la siguiente.
En la agenda se dibujan **una al lado de la otra** para que se vean todas.
Al crear o editar, la ficha te avisa ("Se solapa con María (11:00–12:00).
Puedes guardarla igualmente") pero deja guardar. Si todas las cabinas
compatibles están ocupadas, la cita comparte cabina en vez de rechazarse.
La hora de la ficha ahora va de 15 en 15 minutos.

**Cliente vacío**: si dejas el cliente sin elegir, la cita se guarda como
"Sin cita previa" (antes daba un error aunque la propia tarjeta decía que
se podía dejar vacío).

> Si Supabase dice *"Could not find the '…' column … in the schema cache"*,
> es que falta pegar `supabase/schema.sql`. Ahora el archivo termina con una
> orden que refresca esa caché solo, así que basta con pegarlo entero y
> ejecutarlo.

## Diseño: más claro, accesible y moderno

Primera vuelta de rediseño, manteniendo los colores de marca (crema,
dorado y carbón):

- **Modo oscuro**: botón de luna/sol en la barra de arriba. Se recuerda
  tu elección en ese dispositivo y se aplica antes de pintar la página
  (sin parpadeo). Por defecto arranca en modo claro.
- **Tipografía** más moderna y legible (Outfit). El logotipo conserva la
  letra elegante de siempre.
- **Superficies y botones**: tarjetas con esquinas más redondeadas y
  sombra suave, botones en forma de píldora con degradado dorado,
  ventanas emergentes con fondo desenfocado y animaciones suaves.
- **Menú lateral** fijo (no se va al hacer scroll), con el apartado
  activo resaltado con brillo dorado. Barra superior fija con la fecha,
  el modo claro/oscuro, las notificaciones y el cambio de usuario.
- **Móvil**: barra de navegación inferior con los accesos principales y
  un botón grande **+** para crear una cita desde cualquier pantalla; el
  resto de apartados están en "Más".
- **Agenda**: bloques de cita más suaves y línea de "ahora" con brillo.
  Los bloques de cita se pueden abrir también con el teclado.

### Accesibilidad

- Contrastes comprobados con cálculo (WCAG AA, 4,5:1 para texto): texto
  principal 13–15:1, texto secundario ≥5:1, dorado de texto ≥5:1, rojo y
  verde de aviso ≥7:1, en claro **y** en oscuro. Para conseguirlo, el
  dorado de los botones es algo más profundo que el dorado de marca.
- **Foco visible** siempre al navegar con teclado (anillo dorado).
- Botones y campos de **mínimo 44 px** de alto (tamaño cómodo para dedo);
  campos a 16 px para que el móvil no haga zoom solo.
- Las ventanas emergentes se cierran con **Escape** y están marcadas como
  diálogos para lectores de pantalla; los botones con solo icono tienen
  etiqueta ("Día siguiente", "Cerrar", "Nueva cita"...).
- Respeta la preferencia del sistema de **reducir movimiento**.

> Nota: esta versión se ha comprobado arrancándola en un navegador
> simulado (todas las pantallas, modo claro y oscuro, escritorio y
> móvil, sin errores), pero no he podido verla con mis propios ojos en
> un navegador real. Si algo no te gusta visualmente, dime qué y lo
> ajusto.

## Adaptado a móvil

- En pantallas estrechas, el menú lateral se convierte en un panel
  desplegable (botón de menú en la barra superior) en vez de ocupar
  sitio siempre.
- La Agenda desliza en horizontal cuando hay varias empleadas a la
  vez, en lugar de aplastar las columnas hasta hacerlas ilegibles.
- Los formularios con dos columnas (fecha/hora, duración/precio) se
  apilan en una sola columna en pantallas muy estrechas.
- Las tablas (Servicios, Cabinas, Clientes, Productos…) deslizan en
  horizontal si no caben, en vez de desbordar la pantalla.

## Sesión, PIN y seguridad de uso diario

- El código (PIN) solo se pide **una vez**, al entrar. A partir de ahí
  la sesión queda abierta.
- Si no hay ningún movimiento (ratón, teclado, tacto) durante
  **40 segundos**, la sesión se cierra sola y vuelve a pedir el código
  — pensado para que un dispositivo compartido en recepción no quede
  abierto con la sesión de otra persona.
- El código se puede escribir con el teclado numérico del teclado
  físico (0-9 y Retroceso), no solo haciendo clic en el teclado en
  pantalla.
- Fichar sigue pidiendo el código de esa empleada en concreto, sin
  importar con qué sesión esté abierto el dispositivo.

## Fotos de empleadas

- En Empleadas → editar, puedes subir una foto (se guarda en Supabase
  Storage, bucket `avatars`, creado automáticamente por
  `supabase/schema.sql`). Sin foto, se muestra un círculo con la
  inicial del nombre, como hasta ahora.

## 5. Desplegar para tenerlo siempre activo

### Opción A — Vercel (recomendada)

1. Sube esta carpeta a un repositorio de GitHub.
2. vercel.com → "Add New Project" → importa el repo.
3. En "Environment Variables" añade `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y, si quieres la integración con
   GoHighLevel activa, `GHL_API_KEY`, `GHL_LOCATION_ID` y
   `GHL_CALENDAR_ID` (ver más abajo).
4. Deploy. Conecta tu dominio desde Settings → Domains.

### Opción B — Hostinger

- **Con plan Node.js**: sube la carpeta, define las mismas variables de
  entorno, `npm install && npm run build && npm start`.
- **Hosting compartido solo estático**: ya no es compatible si quieres
  la integración con GoHighLevel — esta usa rutas de API que necesitan
  un servidor Node ejecutándose, algo que un export estático
  (`output: 'export'`) no soporta. Si no te hace falta GHL, sigue
  siendo una opción válida para el resto de la app.

## Integración con GoHighLevel

Esta app puede avisar a GoHighLevel cada vez que guardas un cliente o
una cita, sin que tengas que hacer nada manual.

### Qué hace

- **Al guardar un cliente** (nuevo o editado): se crea o actualiza como
  **Contact** en GHL (nombre, teléfono, email, y la etiqueta
  "favorito" si lo marcaste). Si ya existe un contacto con ese
  teléfono en GHL, lo actualiza en vez de duplicarlo.
- **Al guardar una cita** (nueva o editada): crea o actualiza un
  evento en el Calendar de GHL que elijas, con el nombre del servicio
  y la clienta como título.
  - Si tiene un cliente real enlazado, usa sus datos.
  - Si es "Sin cita previa" (sin ficha de cliente), usa un contacto
    de relleno genérico (teléfono `000000000`, nombre el que hayas
    escrito en la cita) solo para que el hueco quede igualmente
    reservado en el calendario de GHL. Todas las visitas "sin cita"
    comparten ese mismo contacto placeholder en GHL — no son clientes
    reales suyos, así que no hace falta llevarles historial aparte.
- **Al eliminar una cita**: borra también el evento correspondiente en
  GHL, si lo había.
- Nunca bloquea el guardado — la cita ya quedó guardada en Supabase
  antes de avisar a GHL. Pero **si GHL rechaza algo, te lo dice con un
  aviso en pantalla** (por ejemplo "GHL no sincronizó: ...") en vez de
  fallar en silencio, para poder ver el motivo exacto sin mirar logs
  del servidor.

### Cómo activarla

> **Más fácil:** desde la propia app, en **Configuración → Conexiones (API)**, sin tocar el
> hosting. Lo de abajo (variables de entorno) sigue valiendo como alternativa; lo guardado en la
> app tiene prioridad.

1. En GoHighLevel (sub-cuenta de Clinic Nails & Beauty):
   - **Location ID**: Settings → Business Profile.
   - **Private Integration Token**: Settings → Business Profile →
     Private Integrations → "Create new Integration". Marca los
     permisos `contacts.readonly`, `contacts.write`,
     `calendars.readonly`, `calendars/events.readonly`,
     `calendars/events.write`. El token empieza por `pit-`.
   - **Calendar ID**: Settings → Calendars → el calendario donde
     quieres que aparezcan las citas (créalo si no tienes uno).
2. Rellena en `.env.local` (o en las variables de entorno de Vercel):
   ```
   GHL_API_KEY=pit-...
   GHL_LOCATION_ID=...
   GHL_CALENDAR_ID=...
   ```
3. Reinicia `npm run dev` (o vuelve a desplegar) y ya está activa.
   Si dejas estas tres variables vacías, la integración simplemente no
   hace nada — el resto de la app no se entera.

### Un calendario de GHL por empleada (y cómo comprobarlo)

Si todas las citas van a un único calendario de GHL, dos empleadas con
citas a la misma hora chocan. Por eso cada empleada tiene el suyo:

1. En GHL crea **un calendario por empleada** (Settings → Calendars).
2. En la app: **Configuración → Conexión con GoHighLevel**. Ahí aparece
   un desplegable por empleada con los calendarios de GHL **por nombre**
   (no hace falta copiar IDs): elige el de cada una y se guarda solo.
3. Debajo de cada desplegable la app te dice el estado:
   - ✓ "Las citas de Silvia van a «Silvia»" → bien.
   - "Sin calendario propio → sus citas van al GENERAL" → esa empleada
     no tiene el suyo y sus citas caen en el calendario general.
   - "Este ID no existe en GHL" → el ID guardado no corresponde a
     ningún calendario (typo o calendario borrado).
   - "Comparte calendario con …" → dos empleadas apuntan al mismo
     calendario y pueden chocar.
   - "El calendario está en borrador" → en GHL está inactivo.
4. Cada vez que guardas una cita, un aviso te dice a qué calendario ha
   ido: "GHL: cita enviada al calendario de Silvia", o en rojo "…al
   calendario GENERAL (Génesis no tiene calendario propio asignado)".

**Citas que ya estaban mal colocadas**: tras corregir los calendarios,
pulsa **"Reenviar a GHL las citas desde hoy"** en ese mismo panel. Cada
cita se vuelve a enviar; las que estuvieran en otro calendario se
mueven (se borra la de GHL y se crea en el correcto).

Cuando una cita ya está en el calendario correcto, editarla solo la
actualiza. Si cambias la empleada de una cita, se mueve al calendario
de la nueva empleada.

**Calendarios de equipo en GHL**: si un calendario es de tipo equipo
(varios miembros), GHL exige indicar a qué miembro se asigna cada cita
("A team member needs to be selected. assignedUserId is missing"). La
app lo hace sola: lee el calendario y asigna la cita a su **miembro
principal** (o al primero si ninguno está marcado como principal). Esto
vale al **crear** la cita y también al **editarla o moverla** (añadir un
servicio, cambiar la duración, arrastrarla...). Al editar se respeta a
quién estuviera asignada ya la cita en GHL, sin reasignarla. No
hay que configurar nada. Para que lo pueda leer, la integración de GHL
necesita el permiso `calendars.readonly` (el que ya marcaste al crearla).

GHL no rechaza las citas por sus propios huecos o plazos: la
disponibilidad la gestiona esta app, así que se envían siempre.

> **Corregido**: antes, editar una cita borraba el vínculo con su cita
> en GHL y la siguiente sincronización creaba otra nueva, dejando la
> anterior huérfana (duplicados). Ahora solo el servidor escribe esos
> vínculos. Los duplicados que ya se crearon así en GHL no se pueden
> localizar desde la app (se perdió su id): bórralos a mano en GHL.
>
> Vuelve a pegar `supabase/schema.sql` en Supabase: añade la columna
> `citas.ghl_calendar_id` que usa esta mejora.

### Horas

Las horas se envían a GHL con la zona horaria de Madrid explícita (con
el cambio de verano/invierno aplicado solo), así que la hora que ves
aquí es la misma que aparece en GHL. Comprueba también que la zona
horaria de tu cuenta de GHL esté en Europe/Madrid (Settings → Business
Profile).

### Límites a tener en cuenta

- **Entran citas nuevas desde GHL, pero los cambios no.** Si en GHL mueves, cambias o cancelas una
  cita que ya existe en la agenda, la agenda no se entera (la importación solo crea citas nuevas,
  a propósito, para no pisar datos). Esos cambios se hacen en la agenda y de ahí viajan a GHL.
- No sincroniza productos vendidos ni pagos: solo cliente, franja horaria, empleada y estado
  (no asistió / cancelada / cobrada).
- El cliente se busca en GHL por teléfono. Si dos clientas comparten número (por ejemplo, el mismo
  teléfono familiar), se tratarán como la misma persona en GHL.

## Seguridad — cómo está protegida la agenda

La app guarda datos personales de clientas, así que **ya no se puede acceder a la base de datos desde fuera**.
Todo pasa por el servidor de la app, que comprueba quién eres y qué puedes hacer.

### Puesta en marcha (en este orden)
1. **Variable obligatoria en el hosting: `SUPABASE_SERVICE_ROLE_KEY`**
   (Supabase → Project Settings → API → «service_role»). Es la llave maestra: solo la usa el servidor
   y **nunca** debe empezar por `NEXT_PUBLIC_`. Sin ella, la app muestra un error claro al entrar.
2. Pega `supabase/schema.sql` en el SQL Editor de Supabase y ejecútalo (añade tablas y columnas;
   ya no abre nada al público).
3. Sube la app y comprueba que entras con tu código.
4. **Cierra la base de datos**: pega y ejecuta `supabase/seguridad.sql` (una sola vez). Quita todo
   acceso a la clave pública que viaja en la web.
5. Entra en **Configuración → Seguridad**: debe poner «✓ Cerrada». Esa pantalla hace una prueba real
   cada vez que la abres.
6. Cambia los códigos de ejemplo (00000, 11111, 22222…): el panel te avisa de quién los sigue usando.

> Si ejecutas el paso 4 **antes** de subir esta versión, la versión anterior dejará de funcionar.
> El orden importa. El paso 4 se puede repetir sin problema.

### Qué se ha cambiado
- **La clave pública ya no sirve para nada.** Antes, cualquiera podía sacarla de la web y leer clientes,
  citas y códigos. Con la base cerrada solo responde el servidor.
- **Los códigos se guardan cifrados** (huella HMAC con una clave que solo conoce el servidor) y nadie
  puede volver a verlos, tampoco el administrador: solo se puede poner uno nuevo. La primera vez que
  entra alguien tras actualizar, los códigos antiguos en claro se cifran y se borran.
- **Sesión protegida:** al entrar el servidor entrega una cookie firmada (HttpOnly, SameSite=Strict y
  Secure en https) que ningún script de la página puede leer ni otra web usar. Dura 12 h como máximo y
  la app se cierra sola a los 40 s sin actividad. El administrador puede cerrar todas las sesiones.
- **Los permisos los aplica el servidor**, no la pantalla: aunque alguien manipule la app en su navegador,
  el servidor rechaza lo que no le toca. Resumen:

  | | Administrador | Encargada | Empleada |
  |---|---|---|---|
  | Ver y crear citas, cobrar | ✓ | ✓ | ✓ (con permiso de agenda) |
  | **Anular o borrar una venta cobrada** | ✓ | ✓ | ✗ |
  | Alta de un cliente al reservar | ✓ | ✓ | ✓ |
  | **Importar, editar y eliminar clientes** | ✓ | ✗ | ✗ |
  | Colores, claves, etiquetas, métodos de pago | ✓ | ✗ | ✗ |
  | Informes y Configuración | ✓ | según permiso | según permiso |

  La **encargada** es una empleada con el permiso «Puede anular cobros» (se marca en su ficha).
- **Límite de intentos:** 8 códigos erróneos desde un mismo sitio bloquean el acceso 10 minutos (y hay un
  tope global contra ataques repartidos). Un código de 5 dígitos tiene solo 100.000 combinaciones: evita
  fechas y repeticiones.
- Las claves de GHL se guardan en una tabla a la que ni siquiera el administrador puede acceder desde el
  navegador; las fotos se suben desde el servidor (solo imágenes, máx. 2 MB); las peticiones de otras webs
  se rechazan; las respuestas de la API no se guardan en cachés.

### Límites que conviene conocer
- La app se refresca cada pocos segundos en lugar de «tiempo real» instantáneo (ya no hace falta activar
  Replication en Supabase). Se ajusta en Configuración → Conexiones.
- Si el hosting reinicia el servidor, los contadores de intentos fallidos vuelven a cero.
- Es una protección sólida para un negocio pequeño, pero no sustituye a un inicio de sesión con doble
  factor. Para más seguridad en el futuro: códigos más largos o verificación por móvil.
- **Tu clave de GHL (`pit-…`) se ha compartido en conversaciones y viajó en versiones anteriores del
  paquete. Genera una nueva en GHL (Settings → Private Integrations) y pégala en Configuración →
  Conexiones; anula la antigua.**

## Contacto y mapa para las clientas, citas nuevas, bot y nuevas instalaciones

### Teléfono, WhatsApp, dirección y mapa (Configuración → Negocio)
- Nuevo apartado **«Contacto y dirección (para las clientas)»**: teléfono para llamar, WhatsApp, dirección del centro y el
  enlace de «Compartir» de Google Maps. Todo opcional: lo que se deja vacío no se enseña.
- Sale en **el enlace de cada cita** (`/reservar/cita/…`) y en **la página de reservas** (`/reservar`): bloque «Dónde estamos»
  con el **mapa**, botones **«Cómo llegar (Google Maps)»** y **«Mapas de iPhone»**, y «Ver … en Google Maps» (tu ficha con reseñas).
- Cuando la cita ya no se puede cambiar desde el enlace (menos horas que «Cancelar hasta»), el aviso «llámanos» lleva el número
  y los botones **Llamar** y **WhatsApp** (con el mensaje ya escrito: día, hora y servicio de la cita).
- El mapa se dibuja con la dirección escrita (el enlace corto de Google no se puede incrustar). No hace falta clave de Google.

### Circulito de citas nuevas en «Agenda»
- El menú **Agenda** lleva un **círculo rojo con el número de citas nuevas** que han entrado desde la última vez que la abriste:
  reservas online, bot de IA, GHL o creadas por otra persona (las tuyas no cuentan, las canceladas tampoco).
- Al abrir la Agenda se pone a cero y vuelve a contar las que vayan entrando. También sale en la barra de abajo del móvil.
- Las reservas **por revisar** del bot se ven ahora en un círculo **naranja** aparte (no se borra al abrir la Agenda: se quita al revisarlas).
- Se recuerda en cada navegador y para cada persona.

### El bot de IA y el campo «Servicio»
- **Por qué llegaban sin servicio:** el bot crea la cita y rellena el campo «Servicio» en dos pasos, y la agenda importaba la cita
  en cuanto GHL avisaba, **antes** de que el bot escribiera el servicio. Ahora, durante las 24 h siguientes, en cada sincronización
  (cada minuto con la agenda abierta) **se vuelve a mirar el campo**: si ya trae el servicio, la cita se corrige sola (servicio,
  duración, cabina, y título y duración en GHL) y sale de «Por revisar». Si trae un texto que no coincide, se queda por revisar
  pero se ve qué escribió el bot.
- En «Por revisar», cada reserva tiene **«Mirar ahora en GHL»**: dice qué pone en este momento el campo «Servicio» de ese contacto
  (vacío = el bot no lo está rellenando; revisa la acción del bot que lo guarda) o si en GHL no existe ese campo.

### Citas canceladas por el bot de GHL
- Si una cita se cancela en GHL (por ejemplo, el bot de IA), ya no se queda como «cancelada» en la agenda: **se quita de la agenda**
  y, a los 3 segundos, **también se borra de GHL** (su automatización de «cita cancelada» ya se ha lanzado). Igual con las que se
  borran del todo en GHL. Queda apuntado en Actividad con los datos de la cita.
- Nunca se borra una cita cobrada ni una que usa un bono: esas se quedan como canceladas.
- Se puede desactivar en Configuración → Conexiones → «Citas que se crean en GHL» → «Quitar de la agenda las citas que se cancelan en GHL».
- Las que cancelas tú desde la agenda o la clienta desde su enlace siguen igual que antes.

### Llevar la agenda a otro negocio (instalación nueva)
1. Crea un proyecto **nuevo** en Supabase y pega `supabase/schema.sql` en el SQL Editor → Run.
2. Despliega este mismo código en el hosting nuevo (Vercel, Hostinger con Node…) con sus propias variables de entorno
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; ver `.env.local.example`).
3. Entra con el código de ejemplo **00000**: se abre la **«Primera configuración»** (solo esa vez): nombre del negocio, teléfono,
   dirección y mapa, **tu nombre y tu código nuevo**, y si empezar vacío (borra las empleadas y los servicios de ejemplo).
4. Después: Empleados, Catálogo → Servicios, y Configuración → Conexiones (GHL) y Reservas online.
- La «Primera configuración» **solo sale en una instalación nueva** (sin citas ni clientas). En una agenda que ya se usa, como esta,
  no sale nunca: la primera vez que entra el administrador se marca como configurada sola.
- **Corregido:** `schema.sql` creaba los códigos de ejemplo con 4 cifras (`0000`) y la app pide 5, así que en una instalación
  nueva no se podía entrar. Ahora son `00000`, `11111` y `22222`. (No cambia nada en una base de datos que ya existe.)
- Entre que despliegas y haces la primera configuración, cualquiera que conozca la dirección y el código de ejemplo podría entrar:
  hazla nada más desplegar.

## Estructura del proyecto

```
app/                  ← páginas y estilos globales (Next.js App Router)
components/
  ClinicApp.jsx        ← toda la interfaz (login, agenda, clientes, empleadas…)
lib/
  supabaseClient.js     ← conexión a Supabase
  db.js                 ← lecturas/escrituras + tiempo real por tabla
supabase/
  schema.sql            ← tablas, datos de ejemplo y políticas de acceso
.env.local.example       ← plantilla de variables de entorno
```
