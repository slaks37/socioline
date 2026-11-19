"""Original tileable pavement and tree crown textures, generated offline for the city."""
from PIL import Image,ImageDraw,ImageFilter
import math,random
from pathlib import Path
r=random.Random(423);d=Path('public/materials');d.mkdir(exist_ok=True)
s=384;im=Image.new('RGBA',(s,s));g=ImageDraw.Draw(im)
# Small leaves follow overlapping branches, with denser, shaded foliage at the base.
clusters=[]
for j in range(26):
 t=r.random()*math.tau;rad=math.sqrt(r.random());cx=192+math.cos(t)*rad*107;cy=184+math.sin(t)*rad*114
 clusters.append((cy,cx,r.uniform(32,57)))
for cy,cx,rad in sorted(clusters,reverse=True):
 for k in range(230):
  t=r.random()*math.tau;dist=math.sqrt(r.random());x=cx+math.cos(t)*dist*rad;y=cy+math.sin(t)*dist*rad
  lit=(1-dist)*.28+(cx-x+cy-y)/rad*.22+(1-y/384)*.25+r.uniform(-.15,.16)
  color=(int(31+70*max(0,lit)),int(65+70*max(0,lit)),int(40+37*max(0,lit)),255)
  rx=r.uniform(2,5);ry=r.uniform(1.4,3.7);g.ellipse((x-rx,y-ry,x+rx,y+ry),fill=color)
im.save(d/'canopy.webp',quality=91)
s=256;im=Image.new('RGB',(s,s));g=ImageDraw.Draw(im)
for y in range(s):
 for x in range(s):
  seam=(y%64<2 or (x+(64 if (y//64)%2 else 0))%128<2)
  n=r.gauss(0,4)-22*seam+3*math.sin(x*.11)*math.cos(y*.05)
  g.point((x,y),fill=tuple(max(0,min(255,int(c+n))) for c in [190,190,179]))
im.save(d/'limestone.webp',quality=84)
