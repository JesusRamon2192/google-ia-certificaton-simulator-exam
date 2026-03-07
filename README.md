# Google AI Certification – Exam Simulator 🚀

Simulador de examen interactivo para la **Google Cloud Generative AI Certification**. Utiliza Inteligencia Artificial con soporte multi-API (OpenAI, Groq, Cerebras) para generar preguntas dinámicas, únicas y personalizadas basadas en temas clave y oficiales de la certificación.

## 🌟 Características Principales

- **Generación con IA Multi-Modelo**: Alterna automáticamente (Round Robin) entre múltiples proveedores de IA (OpenAI, Groq, Cerebras) para repartir la carga y maximizar la disponibilidad al generar preguntas.
- **Exámenes Únicos**: Preguntas completamente nuevas en cada intento, evitando la memorización de bancos de preguntas fijos.
- **Temario Oficial**: Cobertura de temas específicos de la certificación de IA Generativa de Google Cloud basada en un archivo `topics.json`.
- **Feedback Inmediato**: Explicaciones detalladas disponibles para cada respuesta.
- **Revisión de Errores**: Al finalizar el examen, muestra un resumen detallado de las preguntas falladas, comparando tu respuesta con la correcta, e incluyendo la justificación de la IA.
- **Selector de Temas Visuales**: Interfaz de usuario adaptable con modo Claro, Oscuro y Sistema, con persistencia local.
- **Calificación y Recomendación**: Calcula tu porcentaje de aciertos y te da una recomendación clara de si estás listo para el examen oficial (mínimo 70%).
- **Descarga de Logs**: Registro automático de la API utilizada durante la generación.
- **Contenerizado**: Listo para desplegar fácilmente con Docker y Docker Compose usando Nginx.

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS Nativo (Variables CSS, diseño moderno), JavaScript (ES6+, Vanilla).
- **Backends de IA Soportados**: OpenAI API, Groq API, Cerebras API.
- **Infraestructura**: Docker, Docker Compose, Nginx.

## 📋 Requisitos Previos

- [Docker](https://www.docker.com/get-started) y Docker Compose instalados.
- Claves de API válidas para OpenAI, Groq y/o Cerebras (según se requiera en `config.js`).

## 🚀 Instalación y Ejecución

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd ia-exam-simulator
   ```

2. **Configurar variables de entorno**:
   Crea un archivo llamado `env.js` en la raíz del proyecto para definir tus claves. Ejemplo:
   ```javascript
   window.ENV = {
     OPENAI_API_KEY: 'tu_clave_openai',
     GROQ_API_KEY: 'tu_clave_groq',
     CEREBRAS_API_KEY: 'tu_clave_cerebras'
   };
   ```

3. **Configurar las APIs empleadas**:
   Valida tu archivo `config.js` para asegurarte de que los modelos, URLs y dependencias hacia el `env.js` estén correctamente mapeados.

4. **Levantar el servicio con Docker**:
   ```bash
   docker-compose up -d --build
   ```

5. **Acceder al simulador**:
   Abre tu navegador web e ingresa a `http://localhost:8080`.

## 📖 Uso del Simulador

1. Al acceder, visualizarás el panel de **Generar Examen con IA**.
2. Ingresa la cantidad de preguntas que deseas generar (desde 1 hasta 80 preguntas contiguas en tandas).
3. Haz clic en **Generar Examen**. El sistema preparará tu cuestionario conectándose al modelo de lenguaje en turno.
4. Comienza a responder las preguntas. Si lo deseas, consulta el porqué de la respuesta correcta seleccionando "Ver explicación".
5. Al terminar, se procesará tu calificación y verás rápidamente si estás apto o si requieres mayor estudio (recomendación = >= 70%).
6. Revisa detenidamente el Panel flotante de Respuestas Incorrectas para ver en qué fallaste y mejorar tus áreas de oportunidad.

## 🎨 Selector de Temas

El simulador cuenta con un selector inteligente de temas en la esquina superior izquierda/derecha:
- **Claro** ☀️
- **Oscuro** 🌙
- **Sistema** 💻 (Se integra con las preferencias globales del Sistema Operativo).

## ⚠️ Nota Importante sobre Seguridad

Nunca subas tus archivos con secretos (como el archivo `env.js` o `.env`) a repositorios públicos de control de versiones. Esto expondrá tus cuotas de API privadas. Asegúrate siempre de que estos archivos estén correctamente incluidos y salvaguardados por el archivo `.gitignore` del proyecto.

---
*Mantenido y desarrollado por el equipo para potenciar el éxito en la Certificación de IA.*
