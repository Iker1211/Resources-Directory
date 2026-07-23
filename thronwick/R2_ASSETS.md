# Cloudflare R2 asset delivery

All Three.js model bytes are served from Cloudflare R2 in local development, previews, and production. KayKit model files are intentionally not versioned in Git.

## Runtime contract

- `src/data/r2AssetManifest.js` maps stable application asset IDs to immutable R2 GLB object keys.
- `src/systems/assetLoader.js` resolves every model URL against `VITE_ASSET_BASE_URL`.
- If the variable is absent, the validated public R2 endpoint is used:
  `https://pub-37dce3d7ecf94df9acc08cadeb70022c.r2.dev/`.
- There is no repository fallback for model bytes.
- GLBs require `EXT_meshopt_compression`; the loader configures Three.js `MeshoptDecoder`.
- The prebuild gate validates the generated world and scene-space bounds for grass, water, and road GLBs.

## Local setup

```bash
cd thronwick
npm ci
npm run dev
```

No local model download is required. To override the model origin:

```bash
VITE_ASSET_BASE_URL=https://example-assets-domain/ npm run dev
```

## Validation

```bash
npm run validate:world
npm run validate:tiles
npm run validate:assets
npm run build
```

`npm run build` automatically runs `validate:world` and `validate:tiles` first.

## R2 configuration

The bucket is public and configured for read-only browser CORS (`GET`/`HEAD`). Object keys under `kaykit-assets/` are immutable and use `Content-Type: model/gltf-binary`.

A future custom domain should be `assets.frokie.com`; until the `frokie.com` zone and nameservers are configured, the validated `r2.dev` origin remains the default.

## Updating assets

Do not overwrite an object referenced by a released manifest. Upload a new object key, update `r2AssetManifest.js`, run all validators, and deploy atomically.
