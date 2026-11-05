import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
art = sys.argv[1]
pieces = [('set.flat-1@5x.png','blue flat'),('set.flat-2@5x.png','brick red flat'),('set.flat-5@5x.webp','dark corrugated flat'),('set.flat-10@5x.png','cream flat'),('grip.platform@6x.webp','platform (multi-color)')]
palette = [('sage','#9DB08A'),('coral','#E2725B'),('mustard','#E0A93B'),('plum','#7B4B6A'),('teal','#3F8F8C'),('cream','#F0E2C4')]
def hex2(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)/255
def neutral(rgb, a):
    L = (rgb*[0.2126,0.7152,0.0722]).sum(-1)
    med = np.percentile(L[a>0.5], 90)
    return np.clip(L/med*0.94,0,1), med
def tint(n, col): return n[...,None]*col[None,None,:]
H=300; pad=14; label=26
rows=[]
for fn,name in pieces:
    im = Image.open(f'{art}/{fn}').convert('RGBA')
    s = H/im.height; im = im.resize((max(1,int(im.width*s)),H), Image.LANCZOS)
    arr = np.asarray(im,float)/255; rgb, a = arr[...,:3], arr[...,3]
    n, med = neutral(rgb,a)
    own = np.array([np.median(rgb[...,i][a>0.5]) for i in range(3)])
    cells=[('original',rgb),('neutral',np.repeat(n[...,None],3,-1)),('own color back',tint(n,np.clip(own/0.94*med/max(np.median((rgb*[0.2126,0.7152,0.0722]).sum(-1)[a>0.5]),1e-6),0,1)))]
    cells += [(pn,tint(n,hex2(ph))) for pn,ph in palette]
    rows.append((name,[(t,Image.fromarray((np.dstack([c,a])*255).astype('uint8'),'RGBA')) for t,c in cells]))
cw = max(c.width for _,r in rows for _,c in r)+pad
W = cw*9+pad; Hh=(H+label+pad)*len(rows)+pad
sheet = Image.new('RGB',(W,Hh),'#2C2A33'); d=ImageDraw.Draw(sheet)
try: f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
except: f=ImageFont.load_default()
y=pad
for name,r in rows:
    for i,(t,c) in enumerate(r):
        x=pad+i*cw; sheet.paste(c,(x+(cw-pad-c.width)//2,y+label),c); d.text((x,y),t if i else name,fill='#EDE6D6',font=f)
    y+=H+label+pad
sheet.save('tint-test.png'); print(sheet.size)
