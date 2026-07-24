# Third-party 3D assets

The Thronwick world uses KayKit assets created and distributed by Kay Lousberg.

- Creator: Kay Lousberg
- Catalog: https://kaylousberg.itch.io/
- Official asset pages: https://kaylousberg.com/game-assets
- License: Creative Commons Zero 1.0 Universal (CC0 1.0)
- License text: https://creativecommons.org/publicdomain/zero/1.0/

The project uses models originating from the free KayKit Adventurers, Block Bits, Character Animations, Dungeon Remastered, Fantasy Weapons Bits, Forest Nature, Furniture Bits, Medieval Hexagon, Resource Bits, RPG Tools Bits, and Skeletons packages.

The model bytes are stored in Cloudflare R2 and intentionally are not versioned in this Git repository. `thronwick/src/data/r2AssetManifest.js` is the authoritative mapping from application asset IDs to immutable R2 object keys.

Attribution is not required by CC0, but this file is retained to preserve provenance and make license review straightforward.
