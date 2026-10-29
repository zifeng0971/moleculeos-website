# PD-L1 官网案例交接

生成时间：2026-10-20T14:03:10.152770+07:00（Asia/Jakarta）。工作区：`/Users/zifengye/Documents/ChatGPT/mos`。素材根目录：`/Users/zifengye/Documents/ChatGPT/mos/website-cases/pdl1`。

本次仅执行 MOS、采集和整理素材，没有开发官网前端。五个案例使用统一的人 PD-L1 靶点，但 Binder、输入构建体和编号各自独立。

读取顺序：先 `website-cards.json`，再各案例顶层 `input.json` / `results.json`。原始 ZIP 和 MOS/Mocha 导出保持原样；其中发现的编号、面积和化学表述问题已在顶层结果中校正，**不要直接把 raw 报告文案贴上官网**。

原生 MMetrics 现已完成可用界面与十份 CSV 采集。02 的官网1:1复现优先读取 `02-mmetrics/MMETRICS_REPRODUCTION.md`、`raw/native-ui/` 和 native 截图。此前11项独立任务结果仍保留为补充，数值覆盖范围与原生导出分开。

数据类别：`sources/` 含公开实验参考及单独标注的内部 GitLab 补充规则库；MOS 新预测/评分在各 `raw/`；本地审校和图表由 `handoff/scripts/` 生成。模型评分、启发式排名、几何测量与实验事实必须保持独立标签。

## 01 — Understand the Interaction

**能力与案例：** MMFold；PD-L1 + KN035 VHH。

**叙事：** 从两条序列预测复合物，选择平台排名最高的样本，展示真实结合界面和预测置信度。

**实际结果：** 最佳样本 ipTM 0.918，整体 pLDDT 93.71；相对 5JDS 的 242 个匹配 Cα RMSD 为 1.05 Å。

建议展示的指标：

- ipTM：0.9182515740394592 0–1。来源：MOS confidence JSON。
- Global pLDDT：93.71290588378906 0–100。来源：MOS confidence JSON。
- Complex CA RMSD vs 5JDS：1.0545397656943167 Å。来源：local alignment of MOS prediction and experimental reference。242 matched CA atoms; one least-squares fit over both chains
- Sampled structures：5 models。来源：MOS task outputs。

**可用素材：**

- `01-structure/raw/MMFold_1.cif` — hero_structure；MOS prediction。
- `01-structure/raw/input.fasta` — input_sequences；submitted input。
- `01-structure/raw/summary_confidences_sample_1.json` — confidence；MOS output。
- `01-structure/raw/highlights.json` — highlights；verified derived analysis。
- `01-structure/raw/model-1-derived-contacts.json` — contacts；geometry of MOS prediction。
- `01-structure/visuals/predicted-complex.jpg` — screenshot；MOS UI。
- `01-structure/visuals/model-confidence.png` — chart；local plot of MOS scores。
- `sources/5JDS.cif` — reference_structure；experimental reference。

**动态形式：** 两条链靠近形成复合物；随后显示 B 链 CDR3，再高亮界面与三个 PD-L1 热点；置信度数字随数据出现。

**残基与区域：**

```json
{
  "prediction_target_chain": "A",
  "prediction_binder_chain": "B",
  "prediction_target_hotspots": [
    38,
    40,
    97
  ],
  "original_pdl1_auth_hotspots": [
    54,
    56,
    113
  ],
  "binder_cdr3": [
    97,
    117
  ],
  "mapping": "01-structure/raw/model-1-reference-mapping.json"
}
```

**展示边界：**

- PAE 未交付。
- 五个样本的 ipTM 不同；样本 1 依据平台 ranking_score 选择。
- 置信度与参考 RMSD 不表示实测结合亲和力。

## 02 — Decode Molecular Intelligence

**能力与案例：** MMetrics native UI + supplemental explicit analyses；PD-L1 + avelumab VH/VL (5GRJ)。

**叙事：** 复现实际原生 MMetrics：复合物描述、注释高亮、链间交互网络、突变评分和抗体设计文件。

**实际结果：** 原生面板与十份 CSV 已取得；43 个 Paratope 位点、38 个 Epitope 位点、71 条链间交互记录；三份原生矩阵各8,341个非同义替换，VH/VL亲和力评分4,294条。

建议展示的指标：

- Native Paratope annotations：43 residues。来源：native MMetrics。
- Native Epitope annotations：38 residues。来源：native MMetrics。
- Interaction records：71 typed records。来源：native MMetrics tables。38 A:C + 22 A:B + 11 B:C; types can repeat a residue pair
- Nonself rows per native matrix：8341 substitutions。来源：audited native MMetrics CSV。8780 rows include 439 WT→WT
- Native antibody affinity rows：4294 substitutions。来源：native MutXaff.csv。VH/VL only; 226 modeled residues x 19
- VH2 humanness：0.83598256 model score。来源：native AbScN_heavy..csv。
- VL2 humanness：0.94844085 model score。来源：native AbScN_light.csv。

**可用素材：**

- `02-mmetrics/raw/mos-export/case02_complete/00_structure/5GRJ_mos_sanitized.cif` — hero_structure；experimental reference sanitized by MOS。
- `02-mmetrics/MMETRICS_REPRODUCTION.md` — native_reproduction_guide；actual UI observation。
- `02-mmetrics/native-ui-capture.json` — capture_index；actual UI observation。
- `02-mmetrics/raw/native-ui/verified-native-summary.json` — native_summary；audited native UI exports。
- `02-mmetrics/raw/native-ui/native-datasets.json` — native_complete_datasets；ten native CSVs converted without score changes。
- `02-mmetrics/raw/native-ui/annotations.json` — native_annotations；native UI text, tooltip and style。
- `02-mmetrics/raw/native-ui/interactions.json` — native_interactions；native UI tables。
- `02-mmetrics/raw/native-ui/verified-antibody-csv-numbering.json` — native_numbering；audited native CSV to original atom-site mapping。
- `02-mmetrics/raw/native-ui/interaction-plot-1.svg` — native_interaction_AC；rendered native SVG。
- `02-mmetrics/raw/native-ui/interaction-plot-2.svg` — native_interaction_AB；rendered native SVG。
- `02-mmetrics/raw/native-ui/interaction-plot-3.svg` — native_interaction_BC；rendered native SVG。
- `02-mmetrics/raw/native-ui/layout-and-typography.json` — native_layout；actual DOM geometry and computed styles。
- `02-mmetrics/raw/native-ui/file-view-layout.json` — native_CSV_layout；actual DOM geometry and computed styles。
- `02-mmetrics/visuals/native-final-overview.jpg` — native_UI_overview；MOS UI。
- `02-mmetrics/visuals/native-paratope-selected.jpg` — native_UI_selection；MOS UI。
- `02-mmetrics/visuals/native-affinity-sorted.jpg` — native_UI_sort；MOS UI。
- `02-mmetrics/visuals/native-pagination-options.jpg` — native_UI_pagination；MOS UI。
- `02-mmetrics/raw/mos-export/case02_complete/02_homologs/homology_summary.json` — supplemental_homologs；earlier explicit MOS search, native UI shows empty。
- `02-mmetrics/raw/mos-export/case02_complete/04_liabilities/liability_sites.json` — supplemental_risks；earlier built-in motif analysis, not standalone native panel。
- `02-mmetrics/raw/mos-export/case02_complete/06_mutations/recommended_mutations.csv` — supplemental_recommendations；earlier heuristic analysis, not standalone native panel。

**动态形式：** 按实际纵向模块顺序呈现：Description → Homologs空结果 → Annotations群组选中 → Interaction 2D/Table → CSV View/排序/分页。完整复现细节见 MMETRICS_REPRODUCTION.md。

**残基与区域：**

```json
{
  "mos_chain_roles": {
    "A": "VH",
    "B": "VL",
    "C": "PD-L1"
  },
  "original_auth_chain_roles": {
    "H": "VH",
    "L": "VL",
    "A": "PD-L1"
  },
  "native_annotation_data": "02-mmetrics/raw/native-ui/annotations.json",
  "native_CDR_regions": {
    "heavy": {
      "imgt": [
        {
          "region": "CDR1",
          "csv_indices": [
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33
          ],
          "numbering": [
            "H27",
            "H28",
            "H29",
            "H30",
            "H35",
            "H36",
            "H37",
            "H38"
          ],
          "sequence": "GFTFSSYI"
        },
        {
          "region": "CDR2",
          "csv_indices": [
            51,
            52,
            53,
            54,
            55,
            56,
            57,
            58
          ],
          "numbering": [
            "H56",
            "H57",
            "H58",
            "H59",
            "H62",
            "H63",
            "H64",
            "H65"
          ],
          "sequence": "IYPSGGIT"
        },
        {
          "region": "CDR3",
          "csv_indices": [
            97,
            98,
            99,
            100,
            101,
            102,
            103,
            104,
            105,
            106,
            107,
            108,
            109
          ],
          "numbering": [
            "H105",
            "H106",
            "H107",
            "H108",
            "H109",
            "H110",
            "H111",
            "H112",
            "H113",
            "H114",
            "H115",
            "H116",
            "H117"
          ],
          "sequence": "ARIKLGTVTTVDY"
        }
      ],
      "kabat": [
        {
          "region": "CDR1",
          "csv_indices": [
            31,
            32,
            33,
            34,
            35
          ],
          "numbering": [
            "H31",
            "H32",
            "H33",
            "H34",
            "H35"
          ],
          "sequence": "SYIMM"
        },
        {
          "region": "CDR2",
          "csv_indices": [
            50,
            51,
            52,
            53,
            54,
            55,
            56,
            57,
            58,
            59,
            60,
            61,
            62,
            63,
            64,
            65,
            66
          ],
          "numbering": [
            "H50",
            "H51",
            "H52",
            "H52A",
            "H53",
            "H54",
            "H55",
            "H56",
            "H57",
            "H58",
            "H59",
            "H60",
            "H61",
            "H62",
            "H63",
            "H64",
            "H65"
          ],
          "sequence": "SIYPSGGITFYADTVKG"
        },
        {
          "region": "CDR3",
          "csv_indices": [
            99,
            100,
            101,
            102,
            103,
            104,
            105,
            106,
            107,
            108,
            109
          ],
          "numbering": [
            "H95",
            "H96",
            "H97",
            "H98",
            "H99",
            "H100",
            "H100A",
            "H100B",
            "H100C",
            "H101",
            "H102"
          ],
          "sequence": "IKLGTVTTVDY"
        }
      ],
      "chothia": [
        {
          "region": "CDR1",
          "csv_indices": [
            26,
            27,
            28,
            29,
            30,
            31,
            32
          ],
          "numbering": [
            "H26",
            "H27",
            "H28",
            "H29",
            "H30",
            "H31",
            "H32"
          ],
          "sequence": "GFTFSSY"
        },
        {
          "region": "CDR2",
          "csv_indices": [
            52,
            53,
            54,
            55,
            56,
            57
          ],
          "numbering": [
            "H52",
            "H52A",
            "H53",
            "H54",
            "H55",
            "H56"
          ],
          "sequence": "YPSGGI"
        },
        {
          "region": "CDR3",
          "csv_indices": [
            99,
            100,
            101,
            102,
            103,
            104,
            105,
            106,
            107,
            108,
            109
          ],
          "numbering": [
            "H95",
            "H96",
            "H97",
            "H98",
            "H99",
            "H100",
            "H100A",
            "H100B",
            "H100C",
            "H101",
            "H102"
          ],
          "sequence": "IKLGTVTTVDY"
        }
      ]
    },
    "light": {
      "imgt": [
        {
          "region": "CDR1",
          "csv_indices": [
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33
          ],
          "numbering": [
            "L27",
            "L28",
            "L29",
            "L30",
            "L31",
            "L35",
            "L36",
            "L37",
            "L38"
          ],
          "sequence": "SSDVGGYNY"
        },
        {
          "region": "CDR2",
          "csv_indices": [
            51,
            52,
            53
          ],
          "numbering": [
            "L56",
            "L57",
            "L65"
          ],
          "sequence": "DVS"
        },
        {
          "region": "CDR3",
          "csv_indices": [
            90,
            91,
            92,
            93,
            94,
            95,
            96,
            97,
            98,
            99
          ],
          "numbering": [
            "L105",
            "L106",
            "L107",
            "L108",
            "L109",
            "L113",
            "L114",
            "L115",
            "L116",
            "L117"
          ],
          "sequence": "SSYTSSSTRV"
        }
      ],
      "kabat": [
        {
          "region": "CDR1",
          "csv_indices": [
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33,
            34,
            35
          ],
          "numbering": [
            "L24",
            "L25",
            "L26",
            "L27",
            "L27A",
            "L27B",
            "L27C",
            "L28",
            "L29",
            "L30",
            "L31",
            "L32",
            "L33",
            "L34"
          ],
          "sequence": "TGTSSDVGGYNYVS"
        },
        {
          "region": "CDR2",
          "csv_indices": [
            51,
            52,
            53,
            54,
            55,
            56,
            57
          ],
          "numbering": [
            "L50",
            "L51",
            "L52",
            "L53",
            "L54",
            "L55",
            "L56"
          ],
          "sequence": "DVSNRPS"
        },
        {
          "region": "CDR3",
          "csv_indices": [
            90,
            91,
            92,
            93,
            94,
            95,
            96,
            97,
            98,
            99
          ],
          "numbering": [
            "L89",
            "L90",
            "L91",
            "L92",
            "L93",
            "L94",
            "L95",
            "L95A",
            "L96",
            "L97"
          ],
          "sequence": "SSYTSSSTRV"
        }
      ],
      "chothia": [
        {
          "region": "CDR1",
          "csv_indices": [
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
            32,
            33,
            34,
            35
          ],
          "numbering": [
            "L24",
            "L25",
            "L26",
            "L27",
            "L28",
            "L29",
            "L30",
            "L30A",
            "L30B",
            "L30C",
            "L31",
            "L32",
            "L33",
            "L34"
          ],
          "sequence": "TGTSSDVGGYNYVS"
        },
        {
          "region": "CDR2",
          "csv_indices": [
            51,
            52,
            53,
            54,
            55,
            56,
            57
          ],
          "numbering": [
            "L50",
            "L51",
            "L52",
            "L53",
            "L54",
            "L55",
            "L56"
          ],
          "sequence": "DVSNRPS"
        },
        {
          "region": "CDR3",
          "csv_indices": [
            90,
            91,
            92,
            93,
            94,
            95,
            96,
            97,
            98,
            99
          ],
          "numbering": [
            "L89",
            "L90",
            "L91",
            "L92",
            "L93",
            "L94",
            "L95",
            "L95A",
            "L96",
            "L97"
          ],
          "sequence": "SSYTSSSTRV"
        }
      ]
    }
  },
  "native_CSV_mapping": "02-mmetrics/raw/native-ui/verified-antibody-csv-numbering.json",
  "original_mapping": "02-mmetrics/raw/verified-residue-numbering.json"
}
```

**展示边界：**

- 原生共有六个纵向区块；未出现独立 Risk Sites/Recommended Mutations，补充数据需另标来源。
- 原生 Homologs 为空，不可用独立检索结果替换后仍声称是原生显示。
- 轻链CSV紧凑序号1对应结构B2；原生矩阵439个位点与先前完整实体451个位点的独立任务不同。
- 原生自动任务最终状态未在当前列表中暴露；有原生界面和十份实际下载结果，但未虚构任务状态。
- UniProt Feature C:ARG221 与 C→S tooltip身份不一致，且不在晶体坐标中；避免用于科学主张。
- 模型分数和注释不是实验证实的亲和力、修饰或人源性百分比。

## 03 — Engineer Stronger Binding

**能力与案例：** Binding Affinity Mutation Scoring；PD-L1 + DBL1_03 (7XYQ)。

**叙事：** 扫描现有 Binder 的单点突变，依据真实预测 ΔΔG 排序，并保留靶点序列。

**实际结果：** Binder 链扫描 2,356 个突变，最佳模型候选 Q18Y 的预测结合 ΔΔG 为 −2.45 kcal/mol；此处 18 是实体/MOS 序列编号，对应原始作者 B13。 两种代表变体另完成独立 MMFold，分别提供5个结构与置信度文件。

建议展示的指标：

- Binder substitutions：2356 substitutions。来源：MOS output。
- Q18Y predicted ΔΔG：-2.4513278 kcal/mol。来源：MOS affinity prediction。Relative to WT; lower is more favorable; not measured Kd
- Scored substitutions across both chains：6213 substitutions。来源：MOS output。
- Q18Y structure ipTM：0.821414589881897 0–1。来源：MOS MMFold confidence JSON。Five samples, best selected by ranking_score; separate from affinity ΔΔG
- V17I structure ipTM：0.776024580001831 0–1。来源：MOS MMFold confidence JSON。Five samples, best selected by ranking_score; separate from affinity ΔΔG

**可用素材：**

- `03-affinity/raw/mos-export/case03_complete/inputs/7XYQ_PDL1_DBL1_03_MOSsanitized.cif` — baseline_structure；experimental reference sanitized by MOS。
- `03-affinity/raw/MutXaff.csv` — raw_mutation_scores；MOS output。
- `03-affinity/raw/binder-ranked-candidates.json` — ranked_candidates；audited MOS scores。
- `03-affinity/raw/baseline-and-top10.fasta` — candidate_sequences；verified single substitutions。
- `03-affinity/raw/residue-numbering-map.json` — numbering；original RCSB atom-site mapping。
- `03-affinity/visuals/top-binder-mutations.png` — chart；local plot of MOS scores。
- `03-affinity/visuals/reference-complex.jpg` — screenshot；MOS UI。
- `03-affinity/raw/variant-structure-export/case03_variant_structures/Q18Y/cif/179246519899289_model_sample_1.cif` — candidate_structure；MOS MMFold variant prediction。
- `03-affinity/raw/variant-structure-export/case03_variant_structures/Q18Y/confidence/summary_confidences_sample_1.json` — candidate_confidence；MOS MMFold output。
- `03-affinity/raw/variant-structure-export/case03_variant_structures/V17I/cif/179246520081974_model_sample_1.cif` — candidate_structure；MOS MMFold variant prediction。
- `03-affinity/raw/variant-structure-export/case03_variant_structures/V17I/confidence/summary_confidences_sample_1.json` — candidate_confidence；MOS MMFold output。

**动态形式：** Baseline → 一处突变 → 候选列表。展示 WT 相对 ΔΔG=0 与单点预测，不生成未经模拟的多点性能轨迹。模型排名与界面位置分开展示。

**残基与区域：**

```json
{
  "binder_MOS_chain": "B",
  "best_MOS_position": 18,
  "best_original_auth_position": 13,
  "direct_interface_alternative_MOS_position": 17,
  "direct_interface_alternative_original_auth_position": 12,
  "mapping": "03-affinity/raw/residue-numbering-map.json"
}
```

**展示边界：**

- 没有绝对 ΔG/Kd 或实测亲和力。
- 不能叠加单点收益得到组合突变结论。
- 多数排名靠前位置并非直接界面接触；Q18Y 在界面边缘，V17I 是额外的接触位点候选。
- 变体 MMFold 只验证输出结构与结构置信度，不重新测量亲和力或证明 ΔΔG。

## 04 — Design for Developability

**能力与案例：** Structural / sequence / evolutionary fitness + liability screening；PD-L1-binding KN035 VHH (5JDS)。

**叙事：** 在保护 CDR、二硫键和关键界面位点的条件下筛选框架突变，并展示模型评分与序列性质的取舍。

**实际结果：** 75 个框架位点、1,425 个非同义替换形成 7 个审阅候选；M34L 将 Met 数量从 4 降到 3，R19S 的理论 pI 从 9.01 降到 8.76。

建议展示的指标：

- Framework positions screened：75 positions。来源：MOS structural scan input。
- Screened nonself substitutions：1425 substitutions。来源：MOS output / protected-position filter。
- Curated single-mutant shortlist：7 candidates。来源：heuristic review of MOS scores。
- M34L methionine count：{'WT': 4, 'M34L': 3} residues。来源：verified sequence property。
- R19S theoretical pI：{'WT': 9.01, 'R19S': 8.76} pH units。来源：BioPython sequence calculation。

**可用素材：**

- `04-developability/raw/mos-export/case04_pkg/inputs/5JDS_complex_renum.pdb` — hero_structure；experimental reference, renumbered。
- `04-developability/raw/verified-single-mutant-shortlist.fasta` — candidate_sequences；verified WT plus seven single mutants; no combined variant。
- `04-developability/raw/mos-export/case04_pkg/results/top_candidates.csv` — candidate_scores；MOS scores / heuristic shortlist。
- `04-developability/raw/mos-export/case04_pkg/results/sequence_liabilities.json` — sequence_risks；built-in motif and property calculations。
- `04-developability/raw/verified-residue-mapping.json` — numbering；verified original RCSB atom-site map。
- `04-developability/visuals/candidate-score-tradeoffs.png` — chart；local plot of actual MOS scores。
- `04-developability/visuals/candidate-residues.jpg` — screenshot；MOS UI。
- `04-developability/supplementary-risk-materials.md` — supplementary_guide；internal GitLab reference / local motif annotation; not MOS output。
- `04-developability/raw/supplementary-liability-matches.json` — supplementary_risk_sites；internal GitLab reference / local motif annotation; not MOS output。
- `04-developability/raw/supplementary-liability-matches.csv` — supplementary_risk_table；internal GitLab reference / local motif annotation; not MOS output。
- `sources/developabilityliabilities/rules.json` — supplementary_rule_catalogue；internal GitLab reference / local motif annotation; not MOS output。
- `sources/developabilityliabilities/source.json` — supplementary_provenance；internal GitLab reference / local motif annotation; not MOS output。

**动态形式：** 先显示受保护的 CDR/二硫键，再高亮允许修改的框架。以分列评分图和序列性质对比替代没有数据支撑的溶解性/聚集风险雷达图。

**残基与区域：**

```json
{
  "renumbered_VHH_chain": "A",
  "renumbered_PDL1_chain": "B",
  "CDRs": {
    "CDR1": [
      26,
      33
    ],
    "CDR2": [
      51,
      58
    ],
    "CDR3": [
      97,
      117
    ]
  },
  "disulfides": [
    [
      22,
      96
    ],
    [
      33,
      106
    ]
  ],
  "candidate_domain_positions": [
    19,
    24,
    34,
    48,
    61,
    85,
    87
  ],
  "original_VHH_auth_chain": "B",
  "mapping": "04-developability/raw/verified-residue-mapping.json"
}
```

**展示边界：**

- 未提供溶解性、聚集风险、Tm、表达量或 humanness 预测。
- 结构/序列/进化分数为模型任意单位，不是物理稳定性 ΔΔG。
- Met 数量、理论 pI 与 motif 数量不是实验性能。
- S85N 把 NS 换成 NN；仅指定 N[SGHT] motif 数量变为零，不能说消除了脱酰胺风险。
- 七突变组合仅留在原始归档中，无联合模拟，不用于官网候选成绩。
- 补充库含38条规则、12组；S85N 的 NS→NN 仍命中该库脱酰胺关注规则。固定 CDR/Fc 划分及偶数 Cys 无风险假设未采用；本补充没有 RSA。

## 05 — Invent New Binders

**能力与案例：** Protein Binder Design / De Novo；Three new binders against human PD-L1 extracellular structure。

**叙事：** 对统一 PD-L1 结合面使用三个独立种子生成新骨架、序列与预测复合物，展示候选多样性和置信度。

**实际结果：** 三个独立设计均成功；得到 73、66、95 aa 新序列。95 aa 的 seed333 在返回结构中覆盖六个预设热点，其 Binder Cα 平均 pLDDT 为 82.60。

建议展示的指标：

- Completed independent designs：3 designs。来源：MOS task status。
- Binder lengths：{'seed111': 73, 'seed222': 66, 'seed333': 95} aa。来源：MOS aligned.cif sequences。
- seed333 binder CA-mean pLDDT：82.59842105263156 0–100。来源：local averaging of MOS prediction B factors。Explicit CA averaging, not the different all-atom mean in raw Mocha report
- seed333 hotspots within 4.5 Å：6 of 6。来源：geometry of MOS prediction。

**可用素材：**

- `05-denovo/raw/direct-task-exports/seed333/raw/aligned.cif` — hero_structure；MOS designed sequence + predicted complex。
- `05-denovo/raw/seed333-designed-complex.pdb` — hero_structure_PDB；format conversion of MOS output。
- `05-denovo/raw/designed-binders.fasta` — candidate_sequences；verified MOS output。
- `05-denovo/raw/seed333-verified-analysis.json` — candidate_metrics_and_highlights；local audit of MOS output。
- `05-denovo/raw/seed111-verified-analysis.json` — candidate_metrics；local audit of MOS output。
- `05-denovo/raw/seed222-verified-analysis.json` — candidate_metrics；local audit of MOS output。
- `05-denovo/visuals/candidate-comparison.png` — chart；local plot of actual output。
- `05-denovo/visuals/seed333-designed-complex.jpg` — screenshot；MOS UI。
- `05-denovo/raw/mos-export/case05/target/PD-L1_5GRJ_chainA_target.mos.cif` — target_input；experimental reference, target only。

**动态形式：** 固定靶点，依次呈现三种真实 Binder；切换候选时保留相同热点，显示长度与实际置信度。可用 seed333 作首屏视觉、seed111 展示更大几何界面。

**残基与区域：**

```json
{
  "output_binder_chain": "A",
  "output_target_chain": "B",
  "output_target_hotspots": [
    37,
    39,
    41,
    51,
    96,
    106
  ],
  "original_target_auth_hotspots": [
    54,
    56,
    58,
    68,
    113,
    123
  ],
  "seed333_ionic_examples": {
    "binder_E84": "target R96 (original R113)",
    "binder_R88": "target E41 (original E58)"
  },
  "mapping_and_distances": "05-denovo/raw/seed333-verified-analysis.json"
}
```

**展示边界：**

- 没有 ipTM、pTM、PAE、Kd 或实验验证。
- seed111/222 的 Binder 置信度较低；三种序列有不同程度的组成偏倚。
- seed333 有两组链间重原子距离小于 2 Å，需几何松弛与进一步验证。
- output.cif 中的 poly-Gly 和 B-factor 0/1 是骨架占位，不能用作最终序列或置信度。
- 热点覆盖和局部埋藏面积不是实验结合证据；排序不是亲和力排名。

## 编号与数据使用约定

- 01：预测 A=PD-L1、B=KN035；PD-L1 的原始 I54/Y56/R113 对应预测 A38/A40/A97。
- 02：MOS A/B/C=VH/VL/PD-L1，原始 auth H/L/A；PD-L1 必须保留实体序列的缺失段，不能按 213 个有坐标残基连续重排。
- 03：Binder 的 MOS B18=原始作者 B13；MOS B17=作者 B12。负的原始作者编号也应保留。
- 04：重编号 VHH A1=原始 5JDS auth B1=原始 label A3。Raw 文案中 domain+2 被误称为作者编号，已校正。
- 05：目标输入为 A，但设计输出反转为 Binder A、PD-L1 B；目标输出 B37/B39/B96 对应原始 I54/Y56/R113。

所有候选都属于计算结果。前端可以呈现实际预测与参数，不应写入未经测量的亲和力倍数、Tm、聚集率、溶解性或成功率。

## 验证与复用

`manifest.json` 索引文件大小与 SHA-256。所有卡片素材路径均在交付前逐个检查。ZIP 经过 CRC 检查；结构经 Biopython 解析；突变分数与原始 CSV 对照；CDR 序列及原始 label/auth 编号经过核对。

可选重算脚本位于 `handoff/scripts/`，依赖 Biopython、NumPy、Matplotlib。前端读取已审校 JSON/CSV 即可，不需要重新调用 MOS。
