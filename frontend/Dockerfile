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

# Nginx konteyner ishga tushganda SHOP_ID va SHOP_KEY ni shu shablonga
# qo'yadi. Ular build fayllariga yoki brauzer JavaScript'iga kirmaydi.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
