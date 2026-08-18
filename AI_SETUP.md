# Dashboard Studio — AI Insights (Groq Free)

Dashboard Studio incluye un módulo de análisis con IA mediante una Supabase Edge Function (`ai-analyze`). El navegador **no contiene la clave de Groq**.

## Arquitectura

1. El archivo se procesa en el navegador.
2. Dashboard Studio calcula localmente estadísticas por columna: cantidad de valores, faltantes, promedio, mediana, cuartiles, mínimo, máximo y categorías frecuentes.
3. Columnas cuyo nombre o contenido parezca incluir PII (nombre, correo, teléfono, identificación, dirección, etc.) se marcan y sus muestras se sustituyen por `[REDACTED]`.
4. Solo el resumen preparado se envía a la Edge Function autenticada.
5. La Edge Function valida la sesión y el estado activo del usuario.
6. La función llama a Groq usando `openai/gpt-oss-20b` con salida JSON Schema estricta y `store: false`.

## Activación

1. Crear una cuenta gratuita en GroqCloud y generar una API key.
2. En Supabase Dashboard abrir **Project Settings → Edge Functions → Secrets** (la ubicación puede variar según la UI actual).
3. Crear el secreto:

```text
GROQ_API_KEY=<tu_clave_de_groq>
```

4. No colocar esta clave en `index.html`, `app.js`, GitHub Pages ni variables públicas.
5. En GroqCloud, habilitar **Zero Data Retention (ZDR)** en Data Controls si se desea impedir la retención para monitoreo de confiabilidad/abuso.

## Resultado en el dashboard

El módulo devuelve:
- resumen ejecutivo;
- hallazgos clave;
- anomalías;
- recomendaciones;
- observaciones de calidad de datos;
- visualizaciones sugeridas;
- limitaciones y cautelas.

## Seguridad

La Edge Function requiere JWT válido (`verify_jwt=true`). La API key de Groq vive únicamente como secreto de Supabase. No se recomienda enviar datos sensibles, FERPA/PHI u otra información regulada sin una revisión institucional de privacidad, contratos y gobernanza.