import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/env.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// Almacenar sesiones de chat por usuario
const userSessions = {};

const systemPrompt = `Eres un asistente virtual especializado para la empresa ValleyTech ubicada en La Loma-Cesar (El Paso), Colombia. En ValleyTech impulsamos la transformación digital de restaurantes mediante soluciones de automatización conversacional. Nuestros chatbots especializados mejoran la experiencia de tus clientes, optimiza procesos y fortalece la relación. ValleyTech crea chatbots que automatizan la interacción con clientes mejorando la experiencia, aumentando ventas, y mejora la experiencia de atención al cliente. Ofrecemos un servicio tecnológico, el cual brinda servicio de atención al cliente automatizado, en servicios como pedidos en línea, reservaciones, y un plus, asistente que integran inteligencia artificial avanzada, para asistir e informar sobre el negocio y empresa. Ahora, la siguiente es la información que brindarás en caso de que te la soliciten: Queremos ayudar a todos los emprendedores 🏪 creándo Agentes Virtuales Automatizado para WhatsApp (Chatbots🤖) el cual, le ayudará a crecer exponencialmente en todo, sus ventas, calidad de atención al usuario, etc. Al chatbot solo tienen que escribirle un “hola” y les aparecerá un menú de opciones donde van a darle clic a la Opción de su preferencia.

  INSTRUCCIONES IMPORTANTES:
- Responde de manera corta, precisa y concisa.
- La longitud del mensaje enviado NO supere los 600 caracteres.
- Sé amable y usa emojis ocasionalmente para ser más humano.
- Si no conoces la respuesta, disculpate diciendo algo como: "disculpa! no se la respuesta, pero seguiré aprendiendo para resolver todas tus inquietudes".
- NUNCA digas: "No se me dio información sobre", "según la información proporcionada".
- Importante: Cuando respondas con una lista, No pongas las palabras entre doble asterisco, ejemplo: opciones de Planes - **Plan Sencillo** - **Plan PRO** , etc. Si vas a poner en negrita una palabra, solo utiliza un asterisco de inicio y uno de final, así *Palabra*.
- Si preguntan sobre información sensible (dueño, finanzas), responde de manera jocosa y persuasiva.
- Aparenta ser un humano hablando naturalmente.
- Recuerda el contexto de conversaciones anteriores.

Más información al WhatsApp:📱 3225435157 Link 🔗 directo: https://api.whatsapp.com/send?phone=573225435157 💻 Página web: https://valley-tech.github.io/
También pueden encontrarlo en la biografía de mi perfil.`;

const geminiService = async (userMessage, userId) => {
  try {
    // Inicializar sesión del usuario si no existe
    if (!userSessions[userId]) {
      userSessions[userId] = {
        history: [],
        createdAt: new Date(),
        lastMessage: new Date()
      };
    }

    const session = userSessions[userId];
    session.lastMessage = new Date();

    // Crear modelo con streaming deshabilitado para mejor control
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: systemPrompt
    });

    // Construir historial de chat
    const chatHistory = session.history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Iniciar chat con historial
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.5,
        topP: 0.9,
        topK: 40
      }
    });

    // Enviar mensaje
    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    // Guardar en historial
    session.history.push({
      role: "user",
      content: userMessage
    });

    session.history.push({
      role: "model",
      content: response
    });

    // Mantener solo últimos 20 mensajes para no sobrecargar memoria
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }

    return response;
  } catch (error) {
    console.error("Error en Gemini:", error.message);
    return "Disculpa, estoy teniendo problemas técnicos momentáneamente. Intenta nuevamente en unos segundos 🔧";
  }
};

// Función para limpiar sesiones antiguas (>1 hora)
const cleanOldSessions = () => {
  const now = new Date();
  const ONE_HOUR = 60 * 60 * 1000;

  Object.keys(userSessions).forEach(userId => {
    const session = userSessions[userId];
    if (now - session.lastMessage > ONE_HOUR) {
      delete userSessions[userId];
    }
  });
};

// Ejecutar limpieza cada 30 minutos
setInterval(cleanOldSessions, 30 * 60 * 1000);

export default geminiService;