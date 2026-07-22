# Cloudflare R2 asset delivery

The application can load its Three.js models from Cloudflare R2 while preserving the existing local `public/assets` tree as a rollout fallback.

## Runtime contract

- `src/data/r2AssetManifest.js` maps stable application asset IDs to audited R2 GLB object keys.
- `src/systems/assetLoader.js` resolves those keys against `VITE_ASSET_BASE_URL`.
- If `VITE_ASSET_BASE_URL` is absent, the loader keeps using the existing local GLTF files.
- If `VITE_ASSET_LOCAL_FALLBACK=true`, a failed R2 request is retried against the local GLTF path. Disable this after the R2 rollout is stable so failures remain visible.
- R2 keys in a published manifest version are immutable. Upload a replacement under a new object key and update the manifest instead of overwriting an existing object.

## Netlify environment

Set these variables for the preview deployment first:

```text
VITE_ASSET_BASE_URL=https://assets.frokie.com/
VITE_ASSET_LOCAL_FALLBACK=true
```

After R2 delivery is verified in production:

```text
VITE_ASSET_LOCAL_FALLBACK=false
```

Vite embeds `VITE_*` values at build time, so changing either variable requires a new Netlify deployment.

## R2 custom domain

Connect the bucket to the dedicated subdomain `assets.frokie.com`. Keep `frokie.com` for the application and redirects; do not attach the apex domain directly to the asset bucket. The existing `r2.dev` URL is suitable for validation only.

The current object keys are flat beneath the `kaykit-assets/` prefix. The manifest handles the renamed files explicitly; the runtime never performs suffix matching.

## CORS for the current project phase

The GLBs are already publicly readable and the application only performs `GET`/`HEAD`, so an open read-only CORS policy is appropriate during Netlify preview development:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 86400
  }
]
```

This does not make a private resource public: the bucket is already public. It only allows browsers on localhost, Netlify previews, the current production origin (`https://fanciful-kulfi-73c127.netlify.app`), and the future `https://frokie.com` origin to read the public files. If the bucket later contains private data, split it into a separate private bucket instead of using CORS as access control.

After changing R2 CORS, purge the custom-domain cache so previously cached responses receive the new headers.

## Cache policy

Treat every object key referenced by a manifest release as immutable and return:

```text
Cache-Control: public, max-age=31536000, immutable
Content-Type: model/gltf-binary
```

Configure the custom domain to cache GLB responses at the edge. When an asset changes, publish a new key (for example, `base_hex_grass_v2.glb`) and update the manifest. Do not overwrite `base_hex_grass.glb` while it is referenced by a release.

## Validation

Validate object existence, MIME type, GLB headers, lengths, duplicate keys, and optional CORS before deploying:

```bash
npm run validate:assets
```

Validate the production custom domain and Netlify origin:

```bash
VITE_ASSET_BASE_URL=https://assets.frokie.com/ \
ASSET_CORS_ORIGIN=https://fanciful-kulfi-73c127.netlify.app \
npm run validate:assets
```

Validate local development CORS:

```bash
VITE_ASSET_BASE_URL=https://assets.frokie.com/ \
ASSET_CORS_ORIGIN=http://localhost:3000 \
npm run validate:assets
```

## Rollout order

1. Connect `assets.frokie.com` to the R2 bucket.
2. Apply CORS and cache configuration.
3. Run the validator against the custom domain.
4. Add the Netlify variables to a preview deployment.
5. Verify the world loads all referenced assets and produces no loader warnings.
6. Promote the deployment with local fallback still enabled.
7. Disable local fallback after a stable release.
8. Remove local 3D packs, tracked build copies, `node_modules`, unused formats, and Windows `Zone.Identifier` files in a separate cleanup pull request.
