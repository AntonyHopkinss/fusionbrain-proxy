# FusionBrain Proxy (Generate only)

## Установка на Vercel
1. Скачайте архив и загрузите в новый репозиторий GitHub.
2. Подключите репозиторий к [Vercel](https://vercel.com).
3. В настройках проекта Vercel добавьте переменные окружения:
   - `FB_KEY=721C2F848F2A16F214CFB25BAFB9D669`
   - `FB_SECRET=E70F79AA793588F19D18B2DE63FB05E9`
4. Деплой.

## Использование (Make.com)
- **POST** `https://<your-vercel>.vercel.app/api/generate`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "prompt": "A beautiful cyberpunk cityscape",
  "width": 1024,
  "height": 1024
}
```
- **Response:**
```json
{
  "status": "DONE",
  "uuid": "<uuid>",
  "image_url": "https://tmpfiles.org/xxxx/image.png"
}
```
