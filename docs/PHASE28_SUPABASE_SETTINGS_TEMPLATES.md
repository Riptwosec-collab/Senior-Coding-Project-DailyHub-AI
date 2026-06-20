# Phase 28: Supabase Settings + Task Templates Persistence

Phase 28 ทำให้หน้า `/settings` และ `/templates` ใช้ Supabase persistence ได้จริง พร้อมยังรองรับ mock fallback สำหรับ local development

## สิ่งที่เพิ่ม

- ตาราง `user_settings`
- ตาราง `task_templates`
- Seed system task templates
- Repository layer สำหรับ settings
- Repository layer สำหรับ task templates
- API `/api/settings` อ่าน/เขียนผ่าน repository
- API `/api/task-templates` อ่านจาก Supabase หรือ fallback static templates
- API `/api/task-templates/:id/create-task` สร้าง task จาก template ที่เก็บใน Supabase

## ไฟล์ใหม่ / ไฟล์ที่แก้

```txt
supabase/schema_phase28_settings_templates.sql
src/lib/repositories/settings.repository.ts
src/lib/repositories/task-templates.repository.ts
src/lib/settings-store.ts
src/app/api/settings/route.ts
src/app/api/task-templates/route.ts
src/app/api/task-templates/[id]/create-task/route.ts
docs/PHASE28_SUPABASE_SETTINGS_TEMPLATES.md
```

## วิธีเปิดใช้ Supabase persistence

1. ไปที่ Supabase Dashboard
2. เปิด SQL Editor
3. รันไฟล์นี้:

```txt
supabase/schema_phase28_settings_templates.sql
```

4. ตั้งค่า Environment Variables บน Vercel:

```env
USE_SUPABASE="true"
ALLOW_MOCK_USER="false"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx"
SUPABASE_SECRET_KEY="sb_secret_xxx"
```

5. Redeploy บน Vercel

## วิธีทดสอบ

เปิดหน้า:

```txt
/settings
/templates
```

ทดสอบ API:

```bash
curl https://your-project.vercel.app/api/settings
curl https://your-project.vercel.app/api/task-templates
```

ทดสอบสร้าง task จาก template:

```txt
/templates
→ กด Use Template
→ ไป /scheduled-tasks
→ ต้องเห็น task ใหม่
```

## Behavior

### USE_SUPABASE=false

ระบบจะใช้ memory/static fallback เดิม:

```txt
settings-store.ts
task-templates.ts
```

### USE_SUPABASE=true

ระบบจะใช้ Supabase tables:

```txt
user_settings
task_templates
```

ถ้า `task_templates` ยังไม่มี row ระบบจะ fallback กลับไปใช้ static templates เพื่อไม่ให้หน้า `/templates` ว่าง

## Security

- `SUPABASE_SECRET_KEY` ใช้เฉพาะ backend repository เท่านั้น
- ห้ามใส่ secret เป็น `NEXT_PUBLIC_`
- `user_settings` แยกตาม `user_id`
- `task_templates` รองรับทั้ง system templates และ user templates
- RLS policy จำกัดให้ user อ่าน/แก้เฉพาะข้อมูลของตัวเอง ส่วน system templates อ่านได้ทุก user ที่ authenticated

## Next Phase

แนะนำต่อ:

```txt
Phase 29: OpenAI Real Mode Control from Settings
Phase 30: Telegram Real Mode Control from Settings
Phase 31: External Scheduler Integration
```
