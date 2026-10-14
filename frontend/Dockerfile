FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
# npm ci — lockfile bo'yicha aniq, takrorlanadigan o'rnatish
RUN npm ci

COPY . .
ARG VITE_PUBLIC_URL=https://mdm.tayyor.app
ARG VITE_PANEL_MODE=shop
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL
ENV VITE_PANEL_MODE=$VITE_PANEL_MODE
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM nginx:1.27-alpine

# certbot — avtomatik Let's Encrypt SSL; openssl — vaqtinchalik self-signed;
# gettext — envsubst (nginx shabloniga SHOP_* qiymatlarini qo'yish).
RUN apk add --no-cache certbot openssl gettext

# Entrypoint ishga tushganda nginx.conf.template ni render qiladi (SHOP_DOMAIN,
# SHOP_ID, SHOP_KEY) va SHOP_DOMAIN uchun SSL sertifikatini oladi/yangilaydi.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.ssl.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
