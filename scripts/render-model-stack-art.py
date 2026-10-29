#!/usr/bin/env python3
"""Reproducible orthographic molecular ink/gouache illustrations. numpy + Pillow only.
Run: python3 scripts/render-model-stack-art.py [--supersample 2] [--grain 1.5] [--ink 0.8]
All molecular surfaces are unions of heavy-atom vdW spheres. No image generation.
"""
from pathlib import Path
import argparse, shlex, json, hashlib, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'public/brand/model-stack-new'
VDW = {'C':1.70,'N':1.55,'O':1.52,'S':1.80,'P':1.80,'NA':2.27,'CL':1.75}
INK=np.array([10,9,16.],dtype=np.float32)
PALETTE={'blue':'#93C9EC','cream':'#E8D9BD','sage':'#A3DDBF','quietblue':'#8D9CA7','orange':'#F4B393','warmgray':'#817D7C','membrane':'#C9BFB1'}
def rgb(h): return np.array(tuple(bytes.fromhex(h.lstrip('#'))),dtype=np.float32)
def read_atoms(path):
    headers=[]; rows=[]; seen=set()
    for line in path.read_text().splitlines():
        if line.startswith('_atom_site.'): headers.append(line.strip().split('.')[1])
        elif line.startswith(('ATOM ','HETATM ')) and headers:
            a=dict(zip(headers,shlex.split(line)))
            if a['pdbx_PDB_model_num']!='1' or a['type_symbol'].upper() in ('H','D') or a['label_alt_id'] not in ('.','A','1'): continue
            key=(a['label_asym_id'],a['auth_seq_id'],a['label_atom_id'])
            if key in seen: continue
            seen.add(key)
            rows.append(dict(xyz=[float(a['Cartn_'+k]) for k in 'xyz'], chain=a['label_asym_id'],auth=a['auth_asym_id'],res=a['auth_seq_id'],name=a['label_atom_id'],comp=a['label_comp_id'],element=a['type_symbol'].upper(),id=a['id'],group=a['group_PDB']))
    return rows

def xyz(at):return np.array([a['xyz'] for a in at],dtype=float)
def camera(at, horizontal=None):
    p=xyz(at); origin=p.mean(0); q=p-origin
    if horizontal is None:
        _,_,vt=np.linalg.svd(q,full_matrices=False); x,y=vt[:2]
    else:
        x=np.array(horizontal,dtype=float); x/=np.linalg.norm(x)
        q2=q-np.outer(q@x,x); _,_,vt=np.linalg.svd(q2,full_matrices=False);y=vt[0]
    z=np.cross(x,y);return origin,np.array([x,y,z]).T

class Scene:
    def __init__(self,name,args):
        self.name=name;self.args=args;self.s=args.supersample;self.w=1200*self.s;self.h=750*self.s
        self.z=np.full((self.h,self.w),-1e8,dtype=np.float32)
        self.ids=np.zeros((self.h,self.w),np.int16);self.col=np.zeros((self.h,self.w,3),np.float32)
        self.detail=np.zeros((self.h,self.w),bool)
        self.audit=[];self.instances=[];self.gid=0
    def molecule(self,at,colors,center,box,horizontal=None,angle=0,layer=0,interface=False,detail=True):
        origin,R=camera(at,horizontal);t=math.radians(angle);rot=np.array([[math.cos(t),-math.sin(t),0],[math.sin(t),math.cos(t),0],[0,0,1.]])
        R=R@rot; q=(xyz(at)-origin)@R; rad=np.array([VDW.get(a['element'],1.7) for a in at])
        lo=(q[:,:2]-rad[:,None]).min(0);hi=(q[:,:2]+rad[:,None]).max(0)
        scale=min(box[0]/(hi[0]-lo[0]),box[1]/(hi[1]-lo[1])); mid=(lo+hi)/2
        # map angstroms into screen; rigid orientation + uniform scale, never deform coordinates
        screen=(q[:,:2]-mid)*scale+center
        self.instances.append(dict(chains=sorted(set(a['chain'] for a in at)),atoms=len(at),origin=origin.tolist(),rotation=R.tolist(),mid=mid.tolist(),scale=scale,center=center,layer=layer))
        contact=np.zeros(len(at),bool)
        if interface:
            chains=list(colors)
            p=xyz(at)
            for c in chains:
                idx=np.array([i for i,a in enumerate(at) if a['chain']==c]);other=p[[a['chain']!=c for a in at]]
                for start in range(0,len(idx),128):
                    ix=idx[start:start+128];contact[ix]=np.min(np.sum((p[ix,None,:]-other[None,:,:])**2,2),axis=1)<25
        gids={}
        for c in colors:self.gid+=1;gids[c]=self.gid
        for i in np.argsort(q[:,2]):
            a=at[i];base=rgb(colors[a['chain']]); seed=int(hashlib.sha256((a['chain']+a['res']).encode()).hexdigest()[:6],16)
            base+=((seed%17)-8)*.45
            if contact[i]:base=base*.86+np.array([248,235,207])*.14
            self.sphere(screen[i,0],screen[i,1],rad[i]*scale, q[i,2]*scale+layer,base,gids[a['chain']],detail)
        rng=np.random.default_rng(20261022)
        for i in rng.choice(len(at),min(5,len(at)),replace=False):
            # Invert recorded affine projection, independently compare with source coordinate.
            rec=np.array([*((screen[i]-center)/scale+mid),q[i,2]])@R.T+origin
            err=float(np.max(abs(rec-xyz(at)[i])))
            assert err<1e-9
            self.audit.append(dict(chain=at[i]['chain'],auth_chain=at[i]['auth'],atom_id=at[i]['id'],atom=at[i]['name'],residue=at[i]['res'],source_xyz=at[i]['xyz'],screen_xy=screen[i].tolist(),max_inverse_error_angstrom=err))
    def sphere(self,x,y,r,z,base,gid,detail=True):
        s=self.s;x*=s;y*=s;r*=s;z*=s
        x0=max(0,int(x-r-1));x1=min(self.w,int(x+r+2));y0=max(0,int(y-r-1));y1=min(self.h,int(y+r+2))
        if x0>=x1 or y0>=y1:return
        yy,xx=np.mgrid[y0:y1,x0:x1];nx=(xx-x)/r;ny=(yy-y)/r;d=nx*nx+ny*ny
        nz=np.sqrt(np.maximum(0,1-d));front=z+r*nz
        sub=self.z[y0:y1,x0:x1];mask=(d<=1)&(front>sub)
        # One soft-edged cel shadow only, no specular term, rim light, glow or cast shadow.
        light=-.40*nx-.55*ny+.73*nz
        shade=np.clip((.38-light)/.13,0,1)*(.15 if detail else .07)
        color=base[None,None,:]*(1-shade[:,:,None])
        self.col[y0:y1,x0:x1][mask]=color[mask];sub[mask]=front[mask]
        self.ids[y0:y1,x0:x1][mask]=gid
        self.detail[y0:y1,x0:x1][mask]=detail
    def finish(self):
        mask=self.ids>0; edge=np.zeros_like(mask)
        # Outlines at silhouettes, chain boundaries and real surface-depth discontinuities.
        for dy,dx in [(0,1),(1,0),(-1,0),(0,-1)]:
            nid=np.roll(self.ids,(dy,dx),(0,1));nz=np.roll(self.z,(dy,dx),(0,1))
            edge|=mask&((nid!=self.ids)|(((self.z-nz)>self.s*2.3)&self.detail))
        em=Image.fromarray(np.uint8(edge)*255)
        # variable ink width from a fixed low frequency field; all scenes share settings
        thick=em.filter(ImageFilter.MaxFilter(3)); e=np.asarray(em)/255.;et=np.asarray(thick)/255.
        yy,xx=np.mgrid[:self.h,:self.w];vary=(np.sin(xx/37)+np.cos(yy/29)>0)
        ink=np.where(vary,et,e)*self.args.ink;ink*=mask
        col=self.col*(1-ink[:,:,None])+INK*ink[:,:,None]
        rng=np.random.default_rng(314159)
        coarse=Image.fromarray(np.uint8(rng.uniform(80,176,(self.h//12,self.w//12)))).resize((self.w,self.h),Image.Resampling.BILINEAR)
        noise=rng.normal(0,self.args.grain,(self.h,self.w))+(np.asarray(coarse).astype(float)-128)*.045
        col=np.clip(col+noise[:,:,None],0,255).astype(np.uint8);col[~mask]=0
        rgba=np.dstack((col,np.uint8(mask)*255))
        im=Image.fromarray(rgba).resize((1200,750),Image.Resampling.LANCZOS)
        # Remove vanishing antialias alpha; premultiplied Pillow resizing avoids colored fringe.
        arr=np.array(im);arr[arr[:,:,3]<4]=0;im=Image.fromarray(arr)
        im.save(OUT/(self.name+'.webp'),lossless=True,exact=True)
        alpha=np.array(im.getchannel('A'));ys,xs=np.where(alpha>0)
        report=dict(size=list(im.size),mode=im.mode,transparent_pixels=int((alpha==0).sum()),opaque_pixels=int((alpha==255).sum()),alpha_bbox=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)],instances=self.instances,atom_projection_checks=self.audit)
        (OUT/(self.name+'-audit.json')).write_text(json.dumps(report,indent=2)+'\n')
        return im

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--supersample',type=int,default=2);ap.add_argument('--grain',type=float,default=1.5);ap.add_argument('--ink',type=float,default=.83);args=ap.parse_args();OUT.mkdir(exist_ok=True,parents=True)
    paths={'5JDS':OUT/'sources/5JDS.cif','design':ROOT/'public/demo/pdl1-denovo.cif','4ZQK':ROOT/'public/demo/4zqk.cif','1HZH':OUT/'sources/1HZH.cif'}
    data={k:read_atoms(v) for k,v in paths.items()}
    protein=lambda k,cs:[a for a in data[k] if a['chain'] in cs and a['group']=='ATOM']
    imgs=[]
    s=Scene('mmfold',args);at=protein('5JDS','AB');vec=xyz(protein('5JDS','A')).mean(0)-xyz(protein('5JDS','B')).mean(0)
    # PD-L1 at left, nanobody at right; original experimental interface retained.
    s.molecule(at,{'A':PALETTE['cream'],'B':PALETTE['blue']},(600,375),(710,395),horizontal=vec,angle=-12,interface=True)
    # Sparse actual crystallographic waters and monatomic ions, same camera as complex.
    waters=[a for a in data['5JDS'] if a['comp']=='HOH'][::12]
    ions=[a for a in data['5JDS'] if a['comp'] in ('NA','CL')]
    origin,R=camera(at,vec);t=math.radians(-12);R=R@np.array([[math.cos(t),-math.sin(t),0],[math.sin(t),math.cos(t),0],[0,0,1.]])
    inst=s.instances[0];mid=np.array(inst['mid']);scale=inst['scale']
    for a in waters+ions:
        q=(np.array(a['xyz'])-origin)@R;xy=(q[:2]-mid)*scale+[600,375]
        if 160<xy[0]<1040 and 170<xy[1]<580:s.gid+=1;s.sphere(*xy,VDW.get(a['element'],1.52)*scale*.55,q[2]*scale,rgb('#A9B6BF' if a['comp']=='HOH' else '#D5C8AB'),s.gid)
    imgs.append(s.finish());print('mmfold rendered',flush=True)
    s=Scene('mmdesign',args)
    s.molecule(protein('design','B'),{'B':PALETTE['quietblue']},(600,470),(585,205),angle=8)
    # Alternative candidate chains separated in presentation, not asserted simultaneous binding.
    for c,center,angle in [('A',(340,275),-20),('C',(600,265),15),('D',(860,280),-15)]:
        s.molecule(protein('design',c),{c:PALETTE['sage']},center,(205,190),angle=angle,layer=200)
    imgs.append(s.finish());print('mmdesign rendered',flush=True)
    s=Scene('moleculeos',args);rng=np.random.default_rng(42)
    # Quiet background silhouettes are real design-chain surfaces, not invented protein blobs.
    for i in range(23):
        c='ACD'[i%3];cx=140+(i%8)*130+rng.uniform(-14,14);cy=220+(i//8)*100+rng.uniform(-20,20)
        if 420<cx<780 and cy>310:continue
        s.molecule(protein('design',c),{c:'#57535A'},(cx,cy),(58,50),angle=float(rng.uniform(-180,180)),layer=-400,detail=False)
    for cx,cy,ang in [(285,290,-25),(925,280,22)]:
        s.molecule(protein('1HZH','ABCD'),{c:'#9B9189' for c in 'ABCD'},(cx,cy),(250,192),angle=ang,layer=-100,detail=False)
    # Schematic lipid bilayer, explicitly not coordinate-derived. No fabricated protein stalks.
    for row,y in [(0,522),(1,588)]:
        for i,x in enumerate(np.linspace(112,1088,75)):
            yy=y+4*math.sin(x/105)+rng.uniform(-2,2)
            # Two flat tail beads per lipid, connected by direct overlap within membrane only.
            for k in range(1,7):
                s.gid+=1;s.sphere(x-2, yy+(1 if row==0 else -1)*k*6,4,-20,rgb('#8B8278'),s.gid,False)
            s.gid+=1;s.sphere(x,yy,7.2,35,rgb(PALETTE['membrane']),s.gid)
    at=protein('4ZQK','AB');vec=xyz(protein('4ZQK','B')).mean(0)-xyz(protein('4ZQK','A')).mean(0)
    s.molecule(at,{'A':PALETTE['orange'],'B':'#C8B8A6'},(600,422),(340,188),horizontal=vec,angle=-13,layer=300,interface=True)
    imgs.append(s.finish());print('moleculeos rendered',flush=True)
    # Actual contain dimensions: image 88% card width x 64% card height, top=12%.
    preview=Image.new('RGB',(1800,460),'#08070D');draw=ImageDraw.Draw(preview)
    for i,im in enumerate(imgs):
        x=18+i*594;draw.rounded_rectangle((x,16,x+576,444),radius=28,fill='#0F0E17',outline='#34303E',width=1)
        fit=im.copy();fit.thumbnail((507,274),Image.Resampling.LANCZOS)
        preview.paste(fit,(x+(576-fit.width)//2,67+(274-fit.height)//2),fit)
    preview.save(OUT/'preview.png')
    manifest={'parameters':vars(args),'palette':PALETTE,'sources':{k:{'path':str(v.relative_to(ROOT)),'sha256':hashlib.sha256(v.read_bytes()).hexdigest()} for k,v in paths.items()}}
    (OUT/'render-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    validate(paths)
def validate(paths):
    """Re-read source records independently, then recompute sampled pixel projections."""
    sources={}
    for key,path in paths.items():
        lines=path.read_text().splitlines()
        columns=[l.split()[0].split('.')[1] for l in lines if l.startswith('_atom_site.')]
        sources[key]={}
        for line in lines:
            if line.startswith(('ATOM ','HETATM ')):
                row=dict(zip(columns,shlex.split(line)))
                sources[key][row['id']]=row
    results={}
    for name in ['mmfold','mmdesign','moleculeos']:
        report=json.loads((OUT/(name+'-audit.json')).read_text())
        im=Image.open(OUT/(name+'.webp')); alpha=np.asarray(im)[:,:,3]
        assert im.mode=='RGBA' and im.size==(1200,750)
        assert max(alpha[0].max(),alpha[-1].max(),alpha[:,0].max(),alpha[:,-1].max())==0
        bbox=report['alpha_bbox']
        assert bbox[0]>=72 and bbox[1]>=135 and bbox[2]<=1128 and bbox[3]<=615
        checks=[]
        for j,inst in enumerate(report['instances']):
            key=('5JDS' if name=='mmfold' else 'design' if name=='mmdesign' else
                 '4ZQK' if j==len(report['instances'])-1 else '1HZH' if len(inst['chains'])==4 else 'design')
            for sample in report['atom_projection_checks'][j*5:j*5+5]:
                row=sources[key][sample['atom_id']]
                p=np.array([float(row['Cartn_'+v]) for v in 'xyz'])
                assert row['label_asym_id']==sample['chain']
                assert np.max(abs(p-sample['source_xyz']))==0
                q=(p-inst['origin'])@np.array(inst['rotation'])
                xy=(q[:2]-inst['mid'])*inst['scale']+inst['center']
                error=float(np.max(abs(xy-sample['screen_xy'])))
                assert error<1e-9
                checks.append(dict(source=key,atom_id=sample['atom_id'],chain=sample['chain'],projection_error_px=error))
        results[name]=dict(size=list(im.size),mode=im.mode,alpha_range=[int(alpha.min()),int(alpha.max())],
                           transparent_pixels=int((alpha==0).sum()),content_bbox=bbox,
                           independent_source_and_projection_checks=checks)
    (OUT/'validation.json').write_text(json.dumps(results,indent=2)+'\n')

if __name__=='__main__':main()
