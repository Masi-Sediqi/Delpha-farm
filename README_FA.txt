اصلاح قطعی خطای 409 در backend پروژه Delpha-farm

مشکل: شرط SELECT ... WHERE $3=0 مانع اجرای UPSERT برای revision های بزرگتر از صفر می‌شد.

نصب:
1. فایل transport-backend/server.js را در مسیر مشابه Repository جایگزین و commit کنید.
2. روی VPS از فایل موجود backup بگیرید، git pull --ff-only origin main را اجرا کنید.
3. node --check transport-backend/server.js
4. pm2 restart delpha-farm-api --update-env
5. یک رکورد ثبت یا ویرایش کنید و بعد از Refresh از PostgreSQL تأیید نمایید.

این اصلاح هیچ جدول یا رکورد موجود را حذف نمی‌کند.
