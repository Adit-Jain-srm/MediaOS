# Azure AI Foundry Models

How MediaOS's AI capabilities (Operator reasoning/copy + Creative Studio visuals) map
onto the Azure AI Foundry models the user provisioned. **This is the Azure AI Foundry
OpenAI-compatible `v1` surface (`services.ai.azure.com`), which is _different_ from
classic Azure OpenAI (`*.openai.azure.com`).** The current
[`src/lib/ai/azure.ts`](../src/lib/ai/azure.ts) is built for the classic surface and
must be adapted before the app can call these models (see
[MediaOS integration TODO](#5-mediaos-integration-todo)).

> Status: **env wired, code NOT wired.** The app will keep running in degraded
> ("configure credentials") mode for AI features until `azure.ts` and `env.ts` are
> adapted. These changes are deferred to a dedicated worker after the Operator
> capstone completes.

---

## 1. Resource & endpoints

| Thing | Value |
|---|---|
| Resource base | `https://aditjain2005-0132-resource.services.ai.azure.com` |
| OpenAI-compatible v1 base | `https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1` |
| Project endpoint | `https://aditjain2005-0132-resource.services.ai.azure.com/api/projects/aditjain2005-0132` |
| Responses endpoint | `https://aditjain2005-0132-resource.services.ai.azure.com/api/projects/aditjain2005-0132/openai/v1/responses` |
| Image generations endpoint | `https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1/images/generations` |
| API version | `preview` |
| API key (shared by both models) | `1284...g4Xs` — **masked here on purpose; the real key lives only in git-ignored `.env.local`. Rotate it (the user will rotate).** |

> Note on the image endpoint: two forms were observed during provisioning —
> `.../openai/v1/images/generations` and `.../mai/v1/images/generations`. MediaOS
> standardizes on the `/openai/v1/...` form (stored in `AZURE_OPENAI_IMAGE_ENDPOINT`).

---

## 2. The two models

### Chat — `gpt-5.3-chat`
- **Deployment name:** `gpt-5.3-chat`
- **Base URL:** `https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1`
- **How to call:** OpenAI SDK (`responses.create`, or chat completions) with `base_url` +
  `api_key`. The OpenAI-style `model` argument is the **deployment name**
  (`gpt-5.3-chat`).
- **Responses endpoint:**
  `https://aditjain2005-0132-resource.services.ai.azure.com/api/projects/aditjain2005-0132/openai/v1/responses`

### Image — `MAI-Image-2.5`
- **Deployment name:** `MAI-Image-2.5`
- **Endpoint:**
  `https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1/images/generations`
  (an alternate `.../mai/v1/images/generations` form also works)
- **Response shape:** returns `data[0].b64_json` (base64 PNG bytes, no `data:` prefix).
- **Supports:** `size`, `n`, `output_format`, `output_compression`.

---

## 3. Environment variables

Set in git-ignored `.env.local` (real values) and mirrored as placeholders in the
committed `.env.example`. Both chat-deployment keys are intentionally set to the same
value so whichever name the code reads resolves correctly.

| Key | Value (placeholder in `.env.example`) | Purpose |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | `https://<resource>.services.ai.azure.com` | Resource base |
| `AZURE_OPENAI_API_KEY` | _(secret)_ | Shared key for chat + image |
| `AZURE_OPENAI_BASE_URL` | `https://<resource>.services.ai.azure.com/openai/v1` | OpenAI-compatible v1 base |
| `AZURE_OPENAI_GPT4O_DEPLOYMENT` | `gpt-5.3-chat` | Chat deployment (legacy key name) |
| `AZURE_OPENAI_CHAT_DEPLOYMENT` | `gpt-5.3-chat` | Chat deployment (v1-aligned name) |
| `AZURE_OPENAI_IMAGE_DEPLOYMENT` | `MAI-Image-2.5` | Image deployment |
| `AZURE_OPENAI_IMAGE_ENDPOINT` | `https://<resource>.services.ai.azure.com/openai/v1/images/generations` | Full image gen URL |
| `AZURE_OPENAI_API_VERSION` | `preview` | API version for the v1 surface |
| `AZURE_AI_PROJECT_ENDPOINT` | `https://<resource>.services.ai.azure.com/api/projects/<project>` | Project endpoint (responses API) |

---

## 4. Working usage snippets

> The key is masked as `1284...g4Xs` below. **Never paste the real key into a committed
> file** — it lives only in `.env.local`. Read it from the environment at runtime.

### Image generation (curl)

```bash
curl -X POST \
  "https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1/images/generations" \
  -H "Authorization: Bearer 1284...g4Xs" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "MAI-Image-2.5",
    "prompt": "a minimalist product hero shot of a financial newsletter app, soft studio lighting",
    "size": "1024x1024",
    "n": 1,
    "output_format": "png"
  }'
# -> { "data": [ { "b64_json": "<base64 png bytes>" } ] }
```

### Chat via `responses.create` (Python, OpenAI SDK)

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1",
    api_key=os.environ["AZURE_OPENAI_API_KEY"],  # "1284...g4Xs"
)

resp = client.responses.create(
    model="gpt-5.3-chat",  # the deployment name
    input="Draft a 2-line cold-open for a fintech newsletter targeting indie founders.",
)
print(resp.output_text)
```

The equivalent in JS/TS uses the `openai` package with `baseURL` + `apiKey` and
`client.responses.create({ model: "gpt-5.3-chat", input: "..." })`.

---

## 5. MediaOS integration TODO

These are **deferred** to a dedicated worker after the Operator capstone completes. The
app does **not** call these models until they are done.

1. **Adapt chat in `src/lib/ai/azure.ts` to the v1 base URL.** The current code uses
   `@ai-sdk/azure`'s `createAzure({ baseURL: \`${endpoint}/openai\`, apiVersion, useDeploymentBasedUrls: true })`,
   which targets the classic deployment-based URL scheme. For the Foundry v1 surface,
   switch to an OpenAI-compatible provider (e.g. `@ai-sdk/openai`'s `createOpenAI`, or
   the `openai` SDK directly) configured with
   `baseURL = AZURE_OPENAI_BASE_URL` (`.../openai/v1`) + `apiKey = AZURE_OPENAI_API_KEY`,
   and use the **deployment name** (`gpt-5.3-chat`) as the model id. Prefer the responses
   API where available; chat completions also work on this base.
2. **Adapt `generateImage` to the `MAI-Image-2.5` endpoint + response shape.** Replace
   the classic URL
   (`${endpoint}/openai/deployments/${deployment}/images/generations?api-version=...`)
   with `AZURE_OPENAI_IMAGE_ENDPOINT`
   (`.../openai/v1/images/generations`). Send `model = MAI-Image-2.5` in the body, use
   `Authorization: Bearer <key>` (the v1 surface), and keep parsing `data[0].b64_json`
   (PNG). The existing `AzureImageApiResponse` shape (`data[].b64_json`) already matches.
   Consider exposing `output_format` / `output_compression`.
3. **Add the new env keys to the `src/lib/env.ts` schema.** Add
   `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_CHAT_DEPLOYMENT`, `AZURE_OPENAI_IMAGE_ENDPOINT`,
   and `AZURE_AI_PROJECT_ENDPOINT` to `envSchema` + the `getEnv()` parse object (with safe
   defaults so the app still boots), and update `AZURE_OPENAI_API_VERSION`'s default to
   `preview`. Optionally derive `AZURE_OPENAI_BASE_URL`/`AZURE_OPENAI_IMAGE_ENDPOINT` from
   `AZURE_OPENAI_ENDPOINT` when blank.
4. **Live-validate both models** end to end: a real chat completion through the Operator
   path and a real image generation through Creative Studio, confirming `b64_json` decodes
   to a valid PNG and uploads to Supabase Storage.

> Auth header note: classic Azure OpenAI uses the `api-key` header; the Foundry v1 surface
> uses standard OpenAI `Authorization: Bearer <key>`. The adaptation in steps 1–2 must
> switch the image helper's header accordingly.

---

## 6. Security

- The real API key lives **only** in `.env.local`, which is git-ignored (`.gitignore`
  matches `.env.*` with a `!.env.example` exception). It is masked everywhere in this
  committed doc as `1284...g4Xs`.
- The user intends to **rotate** this key. After rotation, update `AZURE_OPENAI_API_KEY`
  in `.env.local` only.
- `AZURE_OPENAI_API_KEY` is server-only — never expose it to the client bundle or a
  Client Component.

---

## Model versions & confirmed key-auth usage

Confirmed details from provisioning/testing against the Azure AI Foundry
OpenAI-compatible `v1` surface. **Access method: Key Authentication** (a shared API key
used for both models). The key is masked everywhere below as `1284...g4Xs` and the user
will rotate it later.

### Model versions

| Model (deployment) | Version | Auth |
|---|---|---|
| `MAI-Image-2.5` | `2026-06-02` | Key Authentication (shared API key) |
| `gpt-5.3-chat` | `2026-03-03` | Key Authentication (shared API key) |

### Chat (`gpt-5.3-chat`) — confirmed Python usage (OpenAI SDK, not the Azure SDK)

This was confirmed using the **OpenAI** Python SDK (not `@azure` / `openai.AzureOpenAI`),
pointing `base_url` at the `/openai/v1` surface, setting `api_key` directly, and calling
`responses.create(...)`. The result is read from `response.output[0]`.

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1",
    api_key="1284...g4Xs",  # masked — real key lives only in .env.local; rotate later
)

response = client.responses.create(
    model="gpt-5.3-chat",  # deployment name, version 2026-03-03
    input="Draft a 2-line cold-open for a fintech newsletter targeting indie founders.",
)

print(response.output[0])
```

### Image (`MAI-Image-2.5`) — confirmed curl usage

This was confirmed via a direct `POST` to the `/openai/v1/images/generations` endpoint
with a standard `Authorization: Bearer <key>` header. The base64 PNG is parsed from
`data[0].b64_json`.

```bash
curl -X POST \
  "https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1/images/generations" \
  -H "Authorization: Bearer $AZURE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a minimalist product hero shot of a financial newsletter app, soft studio lighting",
    "model": "MAI-Image-2.5",
    "size": "1024x1024",
    "n": 1,
    "output_format": "png",
    "output_compression": 100
  }'
# -> { "data": [ { "b64_json": "<base64 png bytes>" } ] }   # decode data[0].b64_json
```

> `$AZURE_API_KEY` is the masked `1284...g4Xs` key, read from the environment — never
> hard-code the real key.

### Integration implication for `src/lib/ai/azure.ts` (DEFERRED)

> This remains **DEFERRED** until after the Operator capstone completes (consistent with
> [§5 MediaOS integration TODO](#5-mediaos-integration-todo)).

- **Chat:** use an OpenAI-compatible client — either the AI SDK `@ai-sdk/openai`
  `createOpenAI({ baseURL: "https://aditjain2005-0132-resource.services.ai.azure.com/openai/v1", apiKey })`
  with model id `gpt-5.3-chat`, or the `openai` SDK directly. The `responses` API is
  available, but **chat-completions on the same `/openai/v1` base is the simpler AI-SDK
  path**.
- **Image:** `POST` to the `images/generations` endpoint with `Authorization: Bearer`,
  model `MAI-Image-2.5`, and decode `data[0].b64_json` (base64 PNG).
- **No `api-version` query param** is needed for the `/openai/v1` surface.
