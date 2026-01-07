FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

RUN addgroup -g 1001 -S nginx-group && \
    adduser -S nginx-user -u 1001 -G nginx-group

COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-group /var/run/nginx.pid

COPY nginx.conf /etc/nginx/nginx.conf

USER nginx-user

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
