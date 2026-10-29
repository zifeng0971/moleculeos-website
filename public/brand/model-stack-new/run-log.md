# Model stack molecular illustration run log

Date: 2026-10-22. Original art and website code were not changed. Only this output directory and `scripts/render-model-stack-art.py` were added. No generated bitmap, copied illustration, or stock protein silhouette was used.

## Sources and chain identity

- **mmfold.webp**: RCSB **5JDS**, downloaded as `sources/5JDS.cif`. Label **A** = KN035 nanobody (auth B, 958 heavy atoms); label **B** = PD-L1 (auth A, 921 heavy atoms). These assignments were checked against entity descriptions and sequence. The deposited protein interface is preserved by one shared rigid camera transformation. The local `website-cases/pdl1/sources/5JDS-protein-only.pdb` matches all 1,879 selected protein atoms exactly (maximum coordinate difference 0 Å after choosing blank/A alternate conformers). Sparse waters (every twelfth deposited HOH) and deposited NA/CL ions are projected with the same camera; water/ion dot radii are reduced to 55% for legibility. These dots are structural solvent, not invented decoration. PD-L1 #93C9EC, KN035 #E8D9BD. Atoms within 5 Å of the other chain receive a 14% warm cream color mix to suggest the interface, without lighting effects.
- **mmdesign.webp**: `public/demo/pdl1-denovo.cif`. **B** is the PD-L1 target (213 residues, 1,707 heavy atoms; sequence begins AFTVTVPKDL). Design chains **A** (95 residues, 770 heavy atoms), **C** (73 residues, 528 heavy atoms), **D** (66 residues, 532 heavy atoms) are rendered separately. The target is #8D9CA7, all candidates #A3DDBF. This is a visualization of the supplied computational design output, not experimental validation. Candidate bodies retain every selected source atom, with independent rigid orientations, display scale and translation to separate the alternatives. Their illustrated positions are a candidate lineup, not a simultaneous docking assembly or a ranking.
- **moleculeos.webp**: `public/demo/4zqk.cif`, **A** = PD-L1, **B** = PD-1 (checked against entity metadata), both retained in their deposited relative pose. A is #F4B393, B #C8B8A6. Two background copies of RCSB **1HZH**, `sources/1HZH.cif`, use label **A/B/C/D**, auth **H/K/L/M**, i.e. the two heavy plus two light chains of the intact IgG. These are anti-HIV b12 IgG context silhouettes, not claimed PD-L1-binding antibodies. Their color is #9B9189. Additional small #57535A background silhouettes use the actual design A/C/D atom surfaces, scaled and placed as context. Lower-third lipid bilayer is a schematic bead-based drawing (#C9BFB1 heads, #8B8278 tails), not a PDB-derived membrane. 4ZQK contains extracellular constructs, so proximity to the schematic membrane is illustrative; no transmembrane segments or missing stalks were fabricated. Cross-object scales and positions are editorial/perspective layout, not a measured cellular assembly. There are no intermolecular connecting lines.

## Rendering and reproducibility

From repository root:

```sh
python3 scripts/render-model-stack-art.py --supersample 2 --grain 1.5 --ink 0.83
```

Only Python, numpy and Pillow are required; no project dependency changes. Coordinate files downloaded from `https://files.rcsb.org/download/5JDS.cif` and `https://files.rcsb.org/download/1HZH.cif` are retained locally. Input SHA-256 hashes and palettes are in `render-manifest.json`. Projection matrices, centers, scales, selected chains, counts and sampled atom identities are in each `*-audit.json`.

All three use the same 2400×1500 raster, reduced with Lanczos to 1200×750. Heavy atoms only, first model, blank/A/1 alternate conformers, one record per atom. Element vdW radii in Å: C 1.70, N 1.55, O 1.52, S/P 1.80, Na 2.27, Cl 1.75. Exact orthographic sphere z-buffer resolves atom overlap. Each surface has flat pastel fill and one soft cel-shadow band (15%, no specular or rim-light term); background surfaces reduce shadow to 7% and omit internal depth outlines to remain quiet. Warm ink is #0A0910 at strength 0.83, roughly 0.5–1 output px, with slight deterministic width variation. Surface-depth discontinuity threshold is 2.3 output px. Identical paper texture parameters and seed (314159) apply to all scenes: fine grain sigma 1.5 RGB units plus weak coarse pigment variation. Texture affects occupied pixels only. No background color, global paper rectangle, glow, halo, labels, logos or arrows is added to the WebPs.

The preview contains three rounded #0F0E17 cards; images use contain inside an 88% width × 64% height area beginning 12% from the card top, matching the existing CSS proportions. It shows active opacity 1.0, without the website's perspective tilt. The additional central safe area inside the requested assets makes the content relatively compact in this literal card simulation.

## Checks and limitations

1. All WebPs reopened as **RGBA, 1200×750**, alpha range **0–255**. Every outer edge is alpha 0. Transparent pixel counts: mmfold 781,730; mmdesign 814,017; moleculeos 745,057. All occupied bounding boxes fit the central 88% × 64% safe region. Lossless WebP preserves alpha; antialias alpha below 4 is cleared to avoid vanishing fringes.
2. Opened final `preview.png` and full-size assets for visual inspection. Flat atom contours, consistent warm ink and one shadow band; no text, neon, glow or halo. Background IgG internal outlines were simplified after the first visual pass. The texture is deliberately subtle at card size. This is a reproducible ink/cel/gouache interpretation of the requested visual language, not an assertion that it reproduces hand-painted watercolor.
3. Independently re-read source atom records and recomputed 5 randomly selected atom projections per instance: **5 / 20 / 115 checks** across the three scenes. Source xyz values match exactly, forward screen-projection errors are 0 px, inverse transforms differ by less than 1e-9 Å. Results are in `validation.json`. Occlusion of buried atoms is expected; checks validate the coordinates sent to the actual sphere renderer, not that every sampled center is exposed in the final image.
4. **Source anomaly retained:** design chain D atom **3531**, terminal residue 66 oxygen O, is 30.17 Å from its nearest same-chain atom. It appears as a small detached green dot above the right-hand candidate. It was not silently moved or deleted, to honor the all-heavy-atom requirement. The deposited coordinates are shown faithfully; this visualization does not certify source stereochemistry or candidate binding.

## Visual-language references (read/viewed only)

- [David Goodsell biography](https://en.wikipedia.org/wiki/David_Goodsell)
- [PDB-101 Molecule of the Month archive](https://pdb101.rcsb.org/motm/motm-by-date)
- [PDB-101 Phenylalanine Hydroxylase](https://pdb101.rcsb.org/motm/61), viewed in the browser to study flat atom colors, ink contours and restrained shading. No reference image was downloaded, traced, copied or reused.
- Structure metadata: [5JDS](https://www.rcsb.org/structure/5JDS), [4ZQK](https://www.rcsb.org/structure/4ZQK), [1HZH](https://www.rcsb.org/structure/1HZH).
