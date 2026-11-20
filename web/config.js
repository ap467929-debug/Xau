/* =====================================================================
   CONFIGURACIÓN DE LA PÁGINA
   ---------------------------------------------------------------------
   Este es el ÚNICO archivo de código que necesitas tocar para cambiar
   textos. Las fechas, enlaces y el abrir/cerrar registro se manejan
   desde la hoja de Google (pestaña "Config"), que puedes editar en el
   iPad con la app de Google Sheets.

   Reglas para editar sin romper nada:
   - Cambia solo lo que está entre comillas "...".
   - No borres las comas del final de cada línea.
   - Para resaltar palabras del título en dorado, rodéalas con *asteriscos*.
   ===================================================================== */

window.CONFIG = {
  // URL de tu Apps Script (termina en /exec). Ver README, paso 3.
  appsScriptUrl: "",

  textos: {
    tituloPestana: "Masterclass en vivo · Regístrate gratis",
    etiqueta: "Masterclass gratuita · En vivo",
    titulo: "El título de tu *masterclass* aquí",
    subtitulo: "Una frase que diga qué va a aprender la persona y por qué no puede perdérselo.",
    contadorTexto: "El registro cierra en",
    boton: "Quiero mi cupo → Entrar al grupo",
    avisoLegal: "Te enviaremos un recordatorio 30 minutos antes de empezar. Sin spam.",
    puntos: [
      "Punto 1: lo que aprenderán",
      "Punto 2: el resultado que obtendrán",
      "Punto 3: el bonus por asistir en vivo"
    ],
    cerradoTitulo: "El registro está cerrado",
    cerradoTexto: "La masterclass ya comenzó. Síguenos para enterarte de la próxima."
  },

  // Valores de respaldo: se usan solo si la hoja de Google no responde.
  evento: {
    modo: "fijo",                 // "fijo" (una vez) o "diario" (se repite cada día)
    inicio: "2026-11-20 20:00",   // modo fijo: cuándo arranca el contador
    duracionHoras: 24,            // modo fijo: cuánto dura
    horaDiaria: "20:00",          // modo diario: hora en que termina cada día
    zona: "-05:00",               // Colombia -05:00 · México -06:00 · España +01:00
    whatsapp: "https://chat.whatsapp.com/TU-CODIGO-DE-INVITACION",
    registroAbierto: "SI"
  }
};
