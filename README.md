# Nasiya Qurilma Bloklash Tizimi — do'kon paneli

Bu repository do'kon xodimlari ishlatadigan frontend panelni beradi. U lokal
backend, PostgreSQL yoki MDM sertifikatlarini o'z ichiga olmaydi.

Qurilmalar, mijozlar, to'lovlar va foydalanuvchilar markaziy MDM serverida
saqlanadi. Panel unga HTTPS orqali ulanadi:

```text
Do'kon brauzeri → do'kon frontend containeri → https://mdm.example.uz/api/v1
```

## O'rnatish

1. `.env.example` faylini `.env` nomi bilan nusxalang.
2. `VITE_API_URL` va `VITE_PUBLIC_URL` qiymatlariga markaziy MDM serverining
   HTTPS manzilini yozing.
3. `docker compose up -d --build` buyrug'ini ishga tushiring.

Frontendga Apple APNs/ABM sertifikatlari, MDM kalitlari yoki doimiy API tokeni
yozilmaydi. Xodimlar markaziy API orqali login qiladi va qisqa muddatli JWT
oladi; server token ichidagi `shop_id` orqali ma'lumotlarni do'kon bo'yicha
ajratadi.

## Markaziy server

MDM backend, PostgreSQL, scheduler, Apple va Android integratsiyalari alohida
[`mdm`](https://github.com/auzcoder/mdm) repository’da ishlaydi.
