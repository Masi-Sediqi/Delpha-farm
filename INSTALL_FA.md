# مرحله ششم: Import امن PostgreSQL

قبل از نصب حتماً از PostgreSQL با pg_dump بکاپ بگیرید. فایل‌ها را با نسخه فعلی خود مقایسه کنید. سپس فایل‌های موجود در ZIP را در D:\Delpha-farm جایگزین و Backend را Restart کنید.

- ACCDE/ACCDB و JSON پیش از اعمال تغییرات Preview می‌شوند.
- شناسه تکراریِ دارای محتوای متفاوت باعث توقف کامل Import می‌شود.
- رکوردهای موجود هرگز با فایل ورودی جایگزین نمی‌شوند.
- Import واقعی در PostgreSQL در یک تراکنش همراه با Snapshot انجام می‌شود.
- این بسته بازیابی خودکار Snapshot یا مهاجرت رکوردهای بدون شناسه را پیاده نمی‌کند.
- استخراج Access همچنان نیازمند Microsoft Access Database Engine سازگار است.
- مسیر Import روی PostgreSQL واقعی تست نشده است. ابتدا روی دیتابیس آزمایشی تست کنید.
- پس از نصب: node --check transport-backend/server.js و npm run build
