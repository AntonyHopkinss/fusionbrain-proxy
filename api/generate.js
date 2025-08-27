export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

export async function POST(request) {
  try {
    const { prompt, width = 1024, height = 1024, style = "ANIME" } = await request.json();
    if (!prompt) return Response.json({ error: "Field 'prompt' is required" }, { status: 400 });

    const AUTH_HEADERS = {
      "X-Key": `Key ${process.env.FB_KEY}`,
      "X-Secret": `Secret ${process.env.FB_SECRET}`
    };

    // Получаем pipeline_id
    const p = await fetch("https://api-key.fusionbrain.ai/key/api/v1/pipelines", { headers: AUTH_HEADERS });
    if (!p.ok) return Response.json({ error: "Failed to fetch pipelines", details: await p.text() }, { status: 502 });
    const list = await p.json();
    const cand = Array.isArray(list) && (list.find(x => String(x?.name || "").toLowerCase().includes("kandinsky")) || list[0]);
    const pipelineId = cand?.id || cand?.uuid;
    if (!pipelineId) return Response.json({ error: "pipeline_id not found" }, { status: 500 });

    const params = {
      type: "GENERATE",
      numImages: 1,
      width,
      height,
      style,
      generateParams: { query: prompt }
    };

    // Собираем multipart/form-data
    const form = new FormData();
    form.append("pipeline_id", String(pipelineId));
    const blob = new Blob([JSON.stringify(params)], { type: "application/json" });
    form.append("params", blob, "params.json");

    const resp = await fetch("https://api-key.fusionbrain.ai/key/api/v1/pipeline/run", {
      method: "POST",
      headers: AUTH_HEADERS,
      body: form
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) return Response.json({ error: "FusionBrain error", details: data || (await resp.text()) }, { status: resp.status });

    const uuid = data?.uuid;
    if (!uuid) return Response.json({ error: "No UUID returned" }, { status: 500 });

    // Ожидаем результата (polling)
    let result = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const st = await fetch(`https://api-key.fusionbrain.ai/key/api/v1/pipeline/status/${uuid}`, { headers: AUTH_HEADERS });
      const stData = await st.json().catch(() => null);
      if (stData?.images?.length) {
        result = stData.images[0];
        break;
      }
    }

    if (!result) return Response.json({ status: "PENDING", uuid }, { status: 202 });

    // Декодируем base64 в PNG и загружаем на tmpfiles.org
    const bin = Uint8Array.from(atob(result), c => c.charCodeAt(0));
    const blobImg = new Blob([bin], { type: "image/png" });
    const formUpload = new FormData();
    formUpload.append("file", blobImg, "image.png");

    const up = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: formUpload });
    const upData = await up.json().catch(() => null);
    const imageUrl = upData?.data?.url || null;

    return Response.json({ status: "DONE", uuid, image_url: imageUrl }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e.message || String(e) }, { status: 500 });
  }
}
