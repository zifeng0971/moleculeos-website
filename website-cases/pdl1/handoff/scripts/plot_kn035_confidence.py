from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=Path(__file__).resolve().parents[2];d=json.loads((ROOT/'03-affinity-kn035/results.json').read_text()); vs=d['variant_models']
fig,ax=plt.subplots(figsize=(8,4.3))
for i,v in enumerate(vs):
 yy=[s['confidence_raw']['iptm'] for s in sorted(v['samples'],key=lambda x:x['sample'])]
 ax.scatter([i+(j-2)*.06 for j in range(5)],yy,color='#7359ba' if v['disulfide_breaking'] else '#238975',s=36,zorder=3)
ax.axhline(d['master_confidence_raw']['iptm'],color='#777',linestyle='--',label='MMFold_1 WT ipTM')
ax.set(xticks=range(len(vs)),xticklabels=[v['mutation'] for v in vs],ylim=(0,1),ylabel='ipTM (prediction confidence, unitless)',title='KN035 variants: all five raw MMFold samples')
ax.spines[['top','right']].set_visible(False);ax.legend(frameon=False);fig.text(.12,.015,'MOS prediction output; confidence does not establish affinity improvement.',fontsize=9,color='#555');fig.tight_layout(rect=(0,.035,1,1));fig.savefig(ROOT/'03-affinity-kn035/visuals/variant-iptm-all-samples.png',dpi=180);plt.close(fig)
