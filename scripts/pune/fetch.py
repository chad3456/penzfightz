"""
Pune Pulse, step 1: pull one bounding box of Overture Maps data straight from
its public S3 bucket, reading only the parquet row groups whose bbox overlaps.

  python3 fetch.py transportation/type=segment seg.parquet id,geometry,...

Run it for: transportation/type=segment, buildings/type=building,
base/type=water, base/type=land_use, base/type=infrastructure,
divisions/type=division, places/type=place. Then run bake.py.
Data © OpenStreetMap contributors (ODbL), Overture Maps Foundation.
"""
import sys, re, json, requests, io, concurrent.futures as cf
import pyarrow.parquet as pq, pyarrow as pa, fsspec
R='release/2026-09-23.1'
B='https://overturemaps-us-west-2.s3.amazonaws.com'
W,S_,E,N = 73.79,18.47,73.95,18.58
theme=sys.argv[1]; out=sys.argv[2]; cols=sys.argv[3].split(',')
def keys():
    ks=[];tok=None
    while True:
        u=f'{B}/?list-type=2&prefix={R}/theme={theme}/'+(f'&continuation-token={requests.utils.quote(tok)}' if tok else '')
        x=requests.get(u,timeout=60).text
        ks+=re.findall(r'<Key>([^<]*\.parquet)</Key>',x)
        m=re.search(r'<NextContinuationToken>([^<]*)<',x)
        if not m: break
        tok=m.group(1)
    return ks
fs=fsspec.filesystem('http')
def rg_match(k):
    try:
        f=pq.ParquetFile(fs.open(f'{B}/{k}',block_size=1<<20))
    except Exception as e:
        return k,[],str(e)
    md=f.metadata; names=[md.schema.column(i).path for i in range(md.num_columns)]
    idx={n:i for i,n in enumerate(names)}
    hits=[]
    for r in range(md.num_row_groups):
        g=md.row_group(r)
        try:
            xmin=g.column(idx['bbox.xmin']).statistics.min; xmax=g.column(idx['bbox.xmax']).statistics.max
            ymin=g.column(idx['bbox.ymin']).statistics.min; ymax=g.column(idx['bbox.ymax']).statistics.max
        except Exception: hits.append(r); continue
        if xmax>=W and xmin<=E and ymax>=S_ and ymin<=N: hits.append(r)
    return k,hits,None
ks=keys(); print(len(ks),'files',file=sys.stderr)
found=[]
with cf.ThreadPoolExecutor(16) as ex:
    for k,h,e in ex.map(rg_match,ks):
        if e: print('ERR',k,e,file=sys.stderr)
        if h: found.append((k,h)); print(k.split('/')[-1][:20],h,file=sys.stderr)
tables=[]
for k,h in found:
    f=pq.ParquetFile(fs.open(f'{B}/{k}',block_size=8<<20))
    for r in h:
        t=f.read_row_group(r,columns=cols+['bbox'])
        bb=t.column('bbox').to_pylist()
        mask=[b['xmax']>=W and b['xmin']<=E and b['ymax']>=S_ and b['ymin']<=N for b in bb]
        t=t.filter(pa.array(mask))
        if t.num_rows: tables.append(t)
        print('rg',r,t.num_rows,file=sys.stderr)
T=pa.concat_tables(tables,promote_options='permissive')
pq.write_table(T,out)
print('rows',T.num_rows,file=sys.stderr)
