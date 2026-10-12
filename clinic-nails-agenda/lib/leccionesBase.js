// Clases recomendadas para las empleadas. El administrador las añade con un botón en Cursos y puede editarlas como cualquier otra.
// Esta está escrita para que la entienda cualquiera: frases cortas, ejemplos de la vida diaria y frases para copiar.

const CONTENIDO_VENTAS_CRUZADAS = `ANTES DE EMPEZAR
Esta clase es muy fácil. No hace falta ser vendedora ni «tener don». Solo hay que aprender a hacer UNA pregunta amable en el momento justo. Son 5 minutos de lectura.


1. ¿QUÉ ES EL «TICKET MEDIO»?
Es lo que deja de media cada clienta cada vez que viene.

Ejemplo: hoy han venido 4 clientas y entre todas han dejado 200 €. El ticket medio es 50 € (200 ÷ 4 = 50).

Si el ticket medio es BAJO, quiere decir que las clientas vienen, pero se llevan solo lo mínimo. Casi siempre pasa por algo sencillo: nadie les ha contado que había algo más que les podía venir bien.


2. ¿QUÉ ES UNA «VENTA CRUZADA»?
Es ofrecer algo que va bien con lo que la clienta YA se está haciendo.

Piensa en una cafetería. Pides un café y te preguntan: «¿Te pongo algo dulce con él?». No te están presionando: te están ayudando a elegir. Muchas veces dices que sí, y sales contenta.

En la clínica es igual. Ejemplos (usa los servicios y productos que tengamos de verdad):
• Viene a hacerse la manicura → le ofreces un diseño, o el cuidado de las cutículas.
• Viene a una pedicura → le ofreces un extra que le deje los pies más cuidados.
• Viene a un tratamiento de cara → le cuentas el producto que le ayuda a cuidar la piel en casa.
• Se va a hacer un tratamiento que se hace en varias sesiones → le cuentas que con un bono cada sesión le sale más barata.


3. NO ES «ENGAÑAR» A NADIE
Vender un extra es AYUDAR a la clienta. Ella siempre puede decir que no. Si dice que no, no pasa nada y seguimos igual de amables.

Nunca hay que:
• Inventar cosas ni exagerar.
• Prometer resultados («te va a quitar las arrugas», «te lo garantizo»). En estética no se pueden prometer resultados.
• Insistir cuando la clienta ya ha dicho que no.


4. EL MÉTODO DE 3 PASOS (ESCUCHAR · PROPONER UNA COSA · DEJAR ELEGIR)

PASO 1 · ESCUCHA
Pregúntale qué es lo que más le preocupa o qué le gustaría mejorar. Ejemplo: «¿Qué es lo que más te molesta de tus manos?».

PASO 2 · PROPÓN UNA SOLA COSA
Una sola, la que mejor encaje con lo que te ha contado. Ejemplo: «Como me dices que tienes las manos muy secas, te recomiendo este cuidado de cutículas».

PASO 3 · DEJA QUE ELIJA
Ejemplo: «¿Quieres que te lo añada hoy, o prefieres pensártelo?». Si dice que no: «Sin problema, te lo apunto por si lo quieres otro día».


5. FRASES QUE FUNCIONAN (cópialas)
• «¿Quieres que te añada [esto] hoy mismo? Así aprovechas que ya estás aquí.»
• «Mucha gente que se hace esto nos pide también [esto]. ¿Te cuento qué es?»
• «Si te llevas el bono de varias sesiones, cada sesión te sale más barata.»
• Para terminar: «¿Te lo cobro junto con lo de hoy?»

FRASES QUE NO HAY QUE DECIR
• «¿Quieres algo más?» → casi todo el mundo contesta «no» sin pensarlo.
• «Es que hoy tenemos que vender…» → a la clienta no le importa lo que necesitamos nosotras.
• «Te va a quitar las arrugas / te lo garantizo» → no se pueden prometer resultados.


6. ¿CUÁNDO LO OFREZCO?
Hay tres momentos buenos:
1) Al recibirla, cuando te cuenta lo que quiere.
2) A mitad del tratamiento, cuando está tranquila y relajada.
3) Al cobrar: es tu última oportunidad. Hazlo sin prisa.


7. LOS 4 ERRORES MÁS TÍPICOS
1) No ofrecer nada por miedo a molestar. (Si no se lo cuentas, no puede elegir.)
2) Ofrecer cinco cosas a la vez. (La clienta se agobia y dice que no a todo. Mejor UNA.)
3) Leer una lista de precios. (Cuenta para qué sirve, no solo cuánto cuesta.)
4) Discutir cuando dice que no. (Sonríe, apúntalo y a otra cosa.)


8. CUANDO LA CLIENTA DICE QUE SÍ
Añádelo a la cita ANTES de cobrar: con «Añadir otro servicio» o «Añadir producto». Así cuenta como TU venta extra, se suma a tu objetivo y sale en tus Cursos.


RESUMEN EN 4 LÍNEAS
• Ticket medio = lo que deja de media cada clienta.
• Venta cruzada = ofrecer algo que va bien con lo que ya se hace.
• Escucha, propón UNA cosa y deja que elija.
• Nunca prometas resultados ni insistas.`;

export const LECCIONES_RECOMENDADAS = [
  {
    titulo: "Vender más sin presionar: ventas cruzadas y ticket medio (explicado fácil)",
    tipo: "refuerzo", // se abre sola cuando la semana pasada no hizo ventas cruzadas, su ticket medio fue bajo o no llegó a su objetivo
    contenido: CONTENIDO_VENTAS_CRUZADAS,
    activa: true,
    obligatorioSemanal: false,
    minimoAprobado: 70,
    preguntas: [
      { texto: "¿Qué es el «ticket medio»?", opciones: ["Lo que cuesta el tratamiento más caro", "Lo que deja de media cada clienta cada vez que viene", "El número de clientas que vienen en un día"], correcta: 1 },
      { texto: "¿Qué es una «venta cruzada»?", opciones: ["Ofrecer algo que va bien con lo que la clienta ya se está haciendo", "Obligar a la clienta a comprar más", "Hacer un descuento para que vuelva"], correcta: 0 },
      { texto: "Una clienta viene a hacerse la manicura. ¿Qué es lo MEJOR que puedes hacer?", opciones: ["No decirle nada para no molestarla", "Enseñarle toda la lista de precios", "Preguntarle qué busca y proponerle UNA cosa que le encaje, dejando que elija"], correcta: 2 },
      { texto: "Le propones algo a la clienta y te dice: «No, gracias». ¿Qué haces?", opciones: ["Insisto una vez más, por si acaso", "Sonrío, le digo «sin problema» y se lo apunto por si lo quiere otro día", "Le digo que se va a arrepentir"], correcta: 1 },
      { texto: "¿Cuál de estas es una buena frase para ofrecer un extra?", opciones: ["«¿Quieres algo más?»", "«Hoy tenemos que vender, ayúdame»", "«¿Quieres que te añada esto hoy? Así aprovechas que ya estás aquí»"], correcta: 2 },
      { texto: "¿Cuántas cosas le propones a la clienta a la vez?", opciones: ["Una sola, la que mejor le encaja", "Todas las que se me ocurran", "Ninguna, que ella pregunte"], correcta: 0 },
      { texto: "¿Qué es lo que NUNCA puedes decirle a una clienta?", opciones: ["Cuánto dura el tratamiento", "Que te va a quitar las arrugas o que el resultado está garantizado", "Que hay un producto para cuidarse en casa"], correcta: 1 },
      { texto: "La clienta acepta un extra. ¿Qué haces?", opciones: ["Me lo apunto en un papel", "No hace falta apuntarlo", "Lo añado a la cita antes de cobrar, para que cuente como mi venta extra"], correcta: 2 },
    ],
  },
];
