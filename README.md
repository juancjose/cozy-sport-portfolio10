# Cozy Sport · Sitio web

**🔗 Ver la página online: [juancjose.github.io/cozy-sport-portfolio10](https://juancjose.github.io/cozy-sport-portfolio10/)**

Sitio estático de **Cozy Sport**, una fábrica argentina de indumentaria deportiva personalizada para equipos y deportistas (Beccar, desde 1983). El contenido viene de [cozysport.com](https://cozysport.com/) y está corregido y ampliado.

## Secciones
Hero con la foto de la fachada y una línea de ruta animada (Largada a Meta), Nosotros, Proceso (con una ruta que se dibuja al hacer scroll), Servicios, Disciplinas, Línea Ciclismo (maillots y video), Taller de costura (las 6 etapas de producción), Historia, Tienda online, Preguntas frecuentes y Contacto (con mapa y formulario por mail).

## Estructura
```
index.html          ← GENERADO (no editar a mano)
src/index.html      ← plantilla fuente
assets/css/styles.css
assets/js/main.js
assets/img/         ← fotos WebP 640/1280/1920 + credits.json
tools/build.py      ← expande tokens de src/ en index.html
tools/images.py     ← descarga las fotos de Pexels y genera las variantes
tools/sprite.svg    ← íconos SVG
screenshots/        ← capturas desktop y mobile
variantes/          ← 3 propuestas para la animación del hero (A silueta, B ruta, C video)
tools/variantes.py  ← genera variantes/*.html a partir de index.html + variantes/src/
```

## Cómo editar
1. Editá `src/index.html`, `assets/css/styles.css` o `assets/js/main.js`.
2. Ejecutá `python3 tools/build.py` para regenerar `index.html`.
3. Para probar en local: `python3 -m http.server 8000` y abrí http://localhost:8000

Tokens de la plantilla: `<!--img:nombre|alt|sizes|clase|eager-->` genera un `<picture>` con srcset; también están `<!--sprite-->`, `<!--credits-->`, `<!--wheel:clase-->` y `<!--chainring-->`.

Para sumar o cambiar fotos, agregalas a `assets/img/credits.json` y ejecutá `python3 tools/images.py` (hace falta Pillow).

## Deploy en Vercel
Es un sitio estático, sin dependencias. En Vercel, importá el repo con Framework "Other", dejá vacío el build command y usá `.` como output directory. También funciona con `vercel --prod`.

## Créditos
La foto de la fachada del hero (`assets/img/fachada-*`) es propia de Cozy Sport. El resto de las fotos son de [Pexels](https://www.pexels.com) y se usan bajo su licencia libre. El detalle de cada foto y su autor está en `assets/img/credits.json` y en el pie del sitio. Las fotos de taller son ilustrativas. El logo (isotipo Z + COZY) está en `assets/img/cozy-wordmark*.svg` y `favicon.svg`, tomado de los repos de marca de Cozy Sport (`cozy-sport/public/brand`). Los textos, el equipo y los deportistas son de Cozy Sport.
