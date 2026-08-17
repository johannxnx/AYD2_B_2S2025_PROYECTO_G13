# ---- Build Stage ----
FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install && npm install @rollup/rollup-linux-x64-gnu

COPY . .

# Vite build
RUN npm run build

# ---- Production Stage (Nginx) ----
FROM nginx:1.27-alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]