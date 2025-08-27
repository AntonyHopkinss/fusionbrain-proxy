import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function handler(req, res) {
  const { uuid } = req.query;

  if (!uuid) {
    return res.status(400).json({ error: 'Missing uuid parameter' });
  }

  try {
    // Запрос статуса в FusionBrain API
    const fbResponse = await fetch(`https://api-key.fusionbrain.ai/key/api/v1/text2image/status/${uuid}`, {
      method: 'GET',
      headers: {
        'X-Key': `Key ${process.env.FB_KEY}`,
        'X-Secret': `Secret ${process.env.FB_SECRET}`
      }
    });

    const data = await fbResponse.json();

    if (data.status === 'DONE' && data.images?.length > 0) {
      const base64Image = data.images[0];
      const buffer = Buffer.from(base64Image, 'base64');

      // Готовим форму для tmpfiles.org
      const form = new FormData();
      form.append('file', buffer, { filename: 'image.png' });

      const uploadResp = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: form
      });
      const uploadData = await uploadResp.json();

      return res.status(200).json({
        status: 'DONE',
        uuid,
        image_url: uploadData?.data?.url || null
      });
    }

    return res.status(200).json({ status: data.status, uuid });

  } catch (err) {
    console.error('Status check error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
