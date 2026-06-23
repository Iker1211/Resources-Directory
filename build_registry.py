"""
build_registry.py
Escanea las carpetas de KayKit y genera registry.json automáticamente.

Uso:
  python build_registry.py "C:/ruta/a/tus/assets"

  O si tienes varias carpetas raíz:
  python build_registry.py "C:/kaykit/pack1" "C:/kaykit/pack2" "C:/kaykit/pack3"

Genera: registry.json en el directorio donde corres el script.
"""

import os
import sys
import json
import re
from pathlib import Path

# ── REGLAS DE AUTO-CATEGORIZACIÓN ────────────────────────
# Orden importa: primera coincidencia gana.
# Basado en los naming conventions reales de KayKit.

LAYER_RULES = [
    # LAYER 0 — Hex Tiles
    {
        "layer": 0,
        "patterns": [r"^hex_", r"^tile_"],
        "allowsEnv": None,     # se decide por subtipo abajo
        "allowsOccupant": None,
    },

    # LAYER 1 — Environment / Nature
    {
        "layer": 1,
        "patterns": [
            r"tree", r"bush", r"plant", r"flower", r"grass",
            r"rock", r"stone", r"mushroom", r"log", r"stump",
            r"vine", r"fern", r"reed", r"lily", r"crop",
            r"nature", r"forest", r"mountain", r"hill", r"cliff",
            r"cloud", r"water_?fall", r"river", r"lake",
            r"^prop_", r"^foliage_", r"^deco_",
        ],
        "validOn": ["grass", "dirt", "mountain"],
    },

    # LAYER 2 — Occupants: Buildings
    {
        "layer": 2,
        "subtype": "building",
        "patterns": [
            r"building", r"castle", r"tower", r"house", r"hut",
            r"mill", r"farm", r"barn", r"stable", r"forge",
            r"market", r"church", r"temple", r"dungeon",
            r"wall", r"gate", r"fence", r"bridge",
            r"^structure_", r"^arch_",
        ],
        "validOn": ["grass", "dirt"],
    },

    # LAYER 2 — Occupants: Characters
    {
        "layer": 2,
        "subtype": "character",
        "patterns": [
            r"adventurer", r"skeleton", r"knight", r"mage",
            r"rogue", r"warrior", r"archer", r"wizard",
            r"goblin", r"orc", r"troll", r"dragon",
            r"npc", r"enemy", r"hero", r"villain",
            r"^char_", r"^unit_", r"^mob_",
        ],
        "validOn": ["grass", "road", "dirt"],
    },

    # CONTEXTO B — UI/Inventario (sin capa en el hex world)
    {
        "layer": "ui",
        "patterns": [
            r"weapon", r"sword", r"axe", r"bow", r"staff",
            r"shield", r"armor", r"helmet", r"potion",
            r"book", r"scroll", r"coin", r"gem", r"chest",
            r"candle", r"torch", r"lantern",
            r"furniture", r"chair", r"table", r"bed",
            r"rpg", r"item_", r"^icon_",
        ],
    },
]

# Subtipos de hex tile y sus permisos
HEX_SUBTYPES = {
    "grass":    {"allowsEnv": True,  "allowsOccupant": True},
    "road":     {"allowsEnv": False, "allowsOccupant": True},
    "water":    {"allowsEnv": False, "allowsOccupant": False},
    "river":    {"allowsEnv": False, "allowsOccupant": False},
    "mountain": {"allowsEnv": True,  "allowsOccupant": False},
    "dirt":     {"allowsEnv": True,  "allowsOccupant": True},
    "sand":     {"allowsEnv": True,  "allowsOccupant": True},
    "snow":     {"allowsEnv": True,  "allowsOccupant": False},
    "lava":     {"allowsEnv": False, "allowsOccupant": False},
    "swamp":    {"allowsEnv": True,  "allowsOccupant": False},
}


def classify(stem: str) -> dict:
    """Clasifica un asset por su nombre de archivo (sin extensión)."""
    name = stem.lower()

    for rule in LAYER_RULES:
        for pat in rule["patterns"]:
            if re.search(pat, name):
                entry = {"layer": rule["layer"]}

                # Caso especial: hex tiles
                if rule["layer"] == 0:
                    # Detectar subtipo: hex_grass_A → grass
                    detected = "grass"  # fallback
                    for subtype in HEX_SUBTYPES:
                        if subtype in name:
                            detected = subtype
                            break
                    perms = HEX_SUBTYPES[detected]
                    entry["tileType"]        = detected
                    entry["allowsEnv"]       = perms["allowsEnv"]
                    entry["allowsOccupant"]  = perms["allowsOccupant"]

                # Caso: layer 1
                elif rule["layer"] == 1:
                    entry["validOn"] = rule.get("validOn", ["grass", "dirt"])

                # Caso: layer 2
                elif rule["layer"] == 2:
                    entry["subtype"]  = rule.get("subtype", "unknown")
                    entry["validOn"]  = rule.get("validOn", ["grass", "dirt"])

                # Caso: UI
                elif rule["layer"] == "ui":
                    entry["context"] = "ui"

                return entry

    # Sin clasificar — lo marcamos para revisión manual
    return {"layer": "unknown"}


def scan(roots: list[str]) -> dict:
    registry = {}
    seen_ids = {}  # para detectar duplicados entre packs

    total_gltf = 0
    skipped    = 0

    for root in roots:
        root_path = Path(root)
        if not root_path.exists():
            print(f"  [WARN] No existe: {root}")
            continue

        print(f"\n  Escaneando: {root_path}")

        for gltf_path in sorted(root_path.rglob("*.gltf")):
            stem     = gltf_path.stem          # "hex_grass_A"
            bin_path = gltf_path.with_suffix(".bin")

            asset_id = stem  # usamos el nombre de archivo como ID

            # Duplicado entre packs → sufijo con pack name
            if asset_id in seen_ids:
                pack_name = gltf_path.parent.name
                asset_id  = f"{stem}__{pack_name}"

            seen_ids[asset_id] = True
            total_gltf += 1

            entry = classify(stem)
            entry["file"]   = str(gltf_path).replace("\\", "/")
            entry["hasBin"] = bin_path.exists()
            entry["sizeKB"] = round(
                (gltf_path.stat().st_size + (bin_path.stat().st_size if bin_path.exists() else 0))
                / 1024, 1
            )

            if entry["layer"] == "unknown":
                skipped += 1
                entry["_review"] = True  # fácil de filtrar después

            registry[asset_id] = entry

    return registry, total_gltf, skipped


def main():
    if len(sys.argv) < 2:
        print("Uso: python build_registry.py <carpeta1> [carpeta2] ...")
        sys.exit(1)

    roots = sys.argv[1:]
    print(f"\n[build_registry] Escaneando {len(roots)} carpeta(s)…")

    registry, total, skipped = scan(roots)

    # Estadísticas
    layers = {"0": 0, "1": 0, "2": 0, "ui": 0, "unknown": 0}
    for v in registry.values():
        k = str(v["layer"])
        layers[k] = layers.get(k, 0) + 1

    out_path = Path("registry.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2, ensure_ascii=False)

    print(f"\n  ✔ registry.json generado — {total} assets")
    print(f"  Layer 0 (tiles):       {layers.get('0', 0)}")
    print(f"  Layer 1 (environment): {layers.get('1', 0)}")
    print(f"  Layer 2 (occupants):   {layers.get('2', 0)}")
    print(f"  UI / inventario:       {layers.get('ui', 0)}")
    print(f"  Sin clasificar:        {skipped}  ← revisar _review:true en el JSON")
    print(f"\n  Archivo: {out_path.resolve()}")


if __name__ == "__main__":
    main()