Delpha customerRegistry save fix

فقط فایل‌های src/utils/browserStorage.js و src/hooks/useJsonCollection.js جایگزین شوند.

تغییرات: جلوگیری از دریافت پاسخ خالی 304؛ تکرار محدود و امن ذخیره در برابر 409؛ ادغام رکوردهای مستقل بدون بازنویسی رکوردهای تغییرکرده در سرور؛ جلوگیری از Poll هم‌زمان با Save.

پیش از جایگزینی، از فایل‌های فعلی Backup تهیه کنید. ابتدا در GitHub commit کنید، سپس روی VPS: git pull --ff-only origin main && npm run build:production

این تغییر فقط Frontend است. دیتابیس، ساختار جداول و Backend را تغییر ندهید. ذخیره موفق باید پس از refresh و کوئری رکوردها تأیید شود.
