export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqSection = {
  title: string;
  items: FaqItem[];
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Primeras preguntas",
    items: [
      {
        id: "frecuencia-partidos",
        question: "¿Hay partidos todos los días?",
        answer:
          "Depende de lo que publiquen los complejos asociados. En Partidos ves los encuentros abiertos con fecha y hora; puedes filtrar por deporte y navegar el calendario. Cuando se libera cupo nuevo, aparece en la lista sin que tengas que escribir a nadie.",
      },
      {
        id: "sin-equipo",
        question: "¿Puedo inscribirme si voy solo o sin armar equipo?",
        answer:
          "Sí. Puedes reservar tu cupo individual o sumar amigos en inscripciones separadas. En pádel suele jugarse dobles; en babyfútbol el partido indica cuántos jugadores faltan. Tu pago confirma tu lugar en ese horario publicado.",
      },
      {
        id: "que-incluye-precio",
        question: "¿Qué cubre el valor que pago al inscribirme?",
        answer:
          "Pagas tu parte del arriendo del partido: el total de la cancha dividido entre los cupos del encuentro. Eso asegura tu plaza y la gestión online (inscripción, pago y confirmación). Pelotas, petos, arbitraje u otras comodidades las define cada complejo: revísalo en la ficha del partido o pregunta al organizador antes de llegar.",
      },
      {
        id: "que-llevar",
        question: "¿Qué conviene llevar el día del partido?",
        answer:
          "Ropa deportiva cómoda, calzado adecuado al deporte (zapatillas de pádel o fútbol según corresponda) y agua. Si el encuentro pide un color de camiseta o nivel mínimo, lo verás en la publicación del partido. Con la inscripción pagada alcanza; no hace falta mostrar códigos en la puerta.",
      },
    ],
  },
  {
    title: "Cuenta y acceso",
    items: [
      {
        id: "login",
        question: "¿Cómo entro a la web?",
        answer:
          "Usa «Iniciar sesión» con tu cuenta de Google. No creas otra contraseña en canchaAbierta.",
      },
      {
        id: "perfil",
        question: "¿Por qué piden nombre y teléfono?",
        answer:
          "Para inscribirte necesitas completar Cuenta → Perfil. El teléfono sirve si hay cambio de horario, cancha o aviso de última hora.",
      },
      {
        id: "cuenta",
        question: "¿Dónde reviso mis inscripciones?",
        answer:
          "En el menú «Cuenta» están tu perfil, mis inscripciones y notificaciones.",
      },
    ],
  },
  {
    title: "Inscripción y pago",
    items: [
      {
        id: "inscribirse",
        question: "¿Cómo reservo un cupo?",
        answer:
          "Elige un partido abierto, confirma tu perfil y sigue el pago en línea. Si no quedan cupos y el partido permite sobrecupo, puedes solicitarlo; el complejo aprueba o rechaza y lo ves en Mis inscripciones.",
      },
      {
        id: "pago",
        question: "¿Cómo funciona el pago?",
        answer:
          "Rediriges a Flow (Webpay y otros medios según Flow). Al volver, la inscripción queda pagada cuando el sistema recibe la confirmación del cobro.",
      },
      {
        id: "pago-pendiente",
        question: "Pagé y aún aparece pendiente",
        answer:
          "La confirmación puede tardar unos minutos. Actualiza Mis inscripciones. Si persiste, guarda el comprobante de Flow y contacta al complejo del partido.",
      },
      {
        id: "cupo",
        question: "¿Qué pasa si se llena el partido?",
        answer:
          "Sin sobrecupo no podrás cerrar la inscripción. Con sobrecupo puedes pagar y quedar en revisión hasta que el admin confirme tu cupo extra.",
      },
    ],
  },
  {
    title: "Antes y después del partido",
    items: [
      {
        id: "confirmacion",
        question: "¿Cómo sé que quedé confirmado?",
        answer:
          "En Mis inscripciones el estado debe decir pagada. Ahí ves fecha, complejo y monto. Opcionalmente puedes sincronizar el evento con Google Calendar si lo autorizaste al entrar.",
      },
      {
        id: "cancelar",
        question: "¿Puedo anular mi cupo?",
        answer:
          "Sí, con inscripción pagada y al menos 24 horas antes del partido, desde Mis inscripciones. Liberas el cupo; cualquier devolución de dinero la coordina el complejo contigo.",
      },
      {
        id: "partido-cancelado",
        question: "¿Y si suspenden el encuentro?",
        answer:
          "Revisa notificaciones y Mis inscripciones. Los avisos y reembolsos dependen del organizador y de las políticas del complejo.",
      },
      {
        id: "soporte",
        question: "¿A quién contacto si algo sale mal?",
        answer:
          "Dudas del día del partido: teléfono del complejo en la ficha de la cancha. Errores de la web o del pago: indica partido, fecha y captura de pantalla al administrador del sitio.",
      },
    ],
  },
];