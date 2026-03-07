#!/bin/sh

if [ -n "$OPENAI_API_KEY" ] || [ -n "$GROQ_API_KEY" ] || [ -n "$CEREBRAS_API_KEY" ]; then
  # Generate env.js with the provided environment variables
  echo "window.ENV = {" > /usr/share/nginx/html/env.js
  echo "  OPENAI_API_KEY: '${OPENAI_API_KEY:-}'," >> /usr/share/nginx/html/env.js
  echo "  GROQ_API_KEY: '${GROQ_API_KEY:-}'," >> /usr/share/nginx/html/env.js
  echo "  CEREBRAS_API_KEY: '${CEREBRAS_API_KEY:-}'" >> /usr/share/nginx/html/env.js
  echo "};" >> /usr/share/nginx/html/env.js

  echo "✅ env.js generated with provided API Keys."
else
  # Check if env.js already exists (if it was copied during build)
  if [ ! -f /usr/share/nginx/html/env.js ]; then
    echo "window.ENV = {" > /usr/share/nginx/html/env.js
    echo "  OPENAI_API_KEY: ''," >> /usr/share/nginx/html/env.js
    echo "  GROQ_API_KEY: ''," >> /usr/share/nginx/html/env.js
    echo "  CEREBRAS_API_KEY: ''" >> /usr/share/nginx/html/env.js
    echo "};" >> /usr/share/nginx/html/env.js
    echo "⚠️ Warning: API Keys not set. Empty env.js created."
  fi
fi

# Execute CMD
exec "$@"
