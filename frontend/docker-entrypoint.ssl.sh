#!/bin/sh
# Shop frontend entrypoint — avtomatik Let's Encrypt SSL (nginx + certbot).
#
# Birinchi ishga tushishda SHOP_DOMAIN uchun haqiqiy sertifikat oladi, nginx'ni
# HTTPS'ga sozlaydi va keyin avtomatik yangilab turadi. Nginx Proxy Manager
# kerak emas. Shart: domen DNS A-record shu serverga ishora qilsin, 80 va 443
# portlar ochiq/bo'sh bo'lsin.
set -eu

: "${SHOP_DOMAIN:?SHOP_DOMAIN kerak — do'konning o'z domeni}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL kerak — Let's Encrypt bildirishnomalari uchun}"

LIVE="/etc/letsencrypt/live/${SHOP_DOMAIN}"
WEBROOT="/var/www/certbot"
TEMPLATE="/etc/nginx/templates/default.conf.template"
CONF="/etc/nginx/conf.d/default.conf"

mkdir -p "$WEBROOT"

# 1) nginx konfiguratsiyasini render qilamiz — FAQAT SHOP_* o'zgaruvchilari
#    almashtiriladi, nginx'ning $host/$uri/$remote_addr kabilari saqlanadi.
envsubst '${SHOP_DOMAIN} ${SHOP_ID} ${SHOP_KEY}' < "$TEMPLATE" > "$CONF"

# 2) Haqiqiy sertifikat yo'q bo'lsa — nginx ishga tushishi uchun vaqtinchalik
#    self-signed yaratamiz (chicken-and-egg: nginx cert'siz 443'ni ocholmaydi).
NEED_CERT=0
if [ ! -f "${LIVE}/fullchain.pem" ]; then
  echo "[ssl] vaqtinchalik self-signed sertifikat (${SHOP_DOMAIN})"
  mkdir -p "$LIVE"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${LIVE}/privkey.pem" -out "${LIVE}/fullchain.pem" \
    -subj "/CN=${SHOP_DOMAIN}" >/dev/null 2>&1
  NEED_CERT=1
fi

# 3) nginx'ni fon rejimida (daemon off) ishga tushiramiz — webroot challenge
#    80-port orqali ishlashi uchun kerak.
nginx -g 'daemon off;' &
NGINX_PID=$!
sleep 2

# 4) Haqiqiy Let's Encrypt sertifikatini olamiz.
if [ "$NEED_CERT" = "1" ]; then
  STAGING=""
  [ "${CERTBOT_STAGING:-0}" = "1" ] && STAGING="--staging"

  # nginx dummy sertifikatni allaqachon xotiraga yuklagan — endi disk'dagi
  # dummy live/archive/renewal'ni olib tashlaymiz, certbot toza katalog yaratsin.
  rm -rf "/etc/letsencrypt/live/${SHOP_DOMAIN}" \
         "/etc/letsencrypt/archive/${SHOP_DOMAIN}" \
         "/etc/letsencrypt/renewal/${SHOP_DOMAIN}.conf"

  echo "[ssl] Let's Encrypt sertifikati so'ralmoqda (${SHOP_DOMAIN})..."
  if certbot certonly --webroot -w "$WEBROOT" -d "$SHOP_DOMAIN" \
       --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email \
       --non-interactive $STAGING; then
    echo "[ssl] sertifikat olindi — nginx qayta yuklanmoqda"
    nginx -s reload
  else
    echo "[ssl] OGOHLANTIRISH: sertifikat olinmadi."
    echo "[ssl]  Tekshiring: (1) '${SHOP_DOMAIN}' DNS A-record shu serverga; (2) 80 va 443 portlar ochiq va bo'sh."
    echo "[ssl]  Sayt vaqtincha self-signed bilan ishlaydi. Tuzatgach: docker compose restart."
    # Disk'da cert qolishi uchun dummy'ni tiklaymiz (kelgusi restart/reload uchun).
    mkdir -p "$LIVE"
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout "${LIVE}/privkey.pem" -out "${LIVE}/fullchain.pem" \
      -subj "/CN=${SHOP_DOMAIN}" >/dev/null 2>&1
  fi
fi

# 5) Avtomatik yangilash — har 12 soat; yangilansa nginx reload qilinadi.
while true; do
  sleep 43200
  certbot renew --quiet --deploy-hook "nginx -s reload" || true
done &

# 6) Konteyner nginx bilan birga yashaydi.
wait "$NGINX_PID"
