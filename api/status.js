import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { uuid } = req.query;

  if (!uuid) {
    return res.status(400).json({ error: 'Missing uuid parameter' });
  }

  try {
    // Запрос к FusionBrain API (получение статуса)
    const response = await fetch(`https://api-key.fusionbrain.ai/key/api/v1/text2image/status/${uuid}`, {
      method: 'GET',
      headers: {
        'X-Key': `Key ${process.env.FB_KEY}`,
        'X-Secret': `Secret ${process.env.FB_SECRET}`
      }
    });

    const data = await response.json();

    // Если картинка готова, вернём ссылку (base64 -> CDN)
    if (data.status === 'DONE' && data.images?.length > 0) {
      const base64Image = data.images[0];
      const imageBuffer = Buffer.from(base64Image, 'base64');

      // Загружаем на tmpfiles.org (временный CDN)
      const uploadResp = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          formData.append('file', new Blob([imageBuffer]), 'image.png');
          return formData;
        })()
      });
      const uploadData = await uploadResp.json();

      return res.status(200).json({
        status: 'DONE',
        uuid,
        image_url: uploadData?.data?.url || null
      });
    }

    // Если не готово — просто вернём статус
    return res.status(200).json({ status: data.status, uuid });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to check status' });
  }
}
