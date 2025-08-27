import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, width, height } = req.body;

  try {
    const fbResp = await fetch('https://api-key.fusionbrain.ai/key/api/v1/text2image/run', {
      method: 'POST',
      headers: {
        'X-Key': `Key ${process.env.FB_KEY}`,
        'X-Secret': `Secret ${process.env.FB_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'GENERATE',
        prompt,
        width,
        height
      })
    });

    const fbData = await fbResp.json();
    return res.status(200).json(fbData);

  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message });
  }
}

