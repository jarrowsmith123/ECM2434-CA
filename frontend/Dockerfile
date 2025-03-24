FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app (API URL is provided at build time via ARG)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:8000}

RUN npm run build

FROM nginx:alpine

# Copy built app and configuration
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a script to replace backend URL at container startup if needed
RUN echo '#!/bin/sh\n\
if [ ! -z "$RUNTIME_BACKEND_URL" ]; then\n\
  echo "Using runtime backend URL: $RUNTIME_BACKEND_URL"\n\
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:8000|$RUNTIME_BACKEND_URL|g" {} \;\n\
fi\n\
nginx -g "daemon off;"\n' > /docker-entrypoint.sh \
&& chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
