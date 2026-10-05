"""
Pune 411, step 2: bake the fetched Overture parquet files and AWS Terrarium
elevation tiles into the compact files the game streams from public/pune/.

  python3 bake.py <dir with seg/bld/water/lu/infra/div parquet + dem/> <out dir>

World frame: metres, x east, z south (three.js: -z is north), origin at
ORIGIN below. Coordinates are stored as int16 in half-metres.

Data © OpenStreetMap contributors (ODbL), Overture Maps Foundation;
elevation: Terrarium tiles (SRTM and others) via the AWS open data registry.
"""
import sys, os, json, math, struct, hashlib, glob
import numpy as np
import pyarrow.parquet as pq
import shapely
import shapely.wkb as WKB
from shapely.geometry import box, Polygon, LineString, MultiPolygon, Point
from shapely.ops import unary_union
from shapely.strtree import STRtree
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

W, S, E, N = 73.818, 18.488, 73.915, 18.562
LON0, LAT0 = (W + E) / 2, (S + N) / 2
KX = 111320.0 * math.cos(math.radians(LAT0))
KZ = 110650.0
HX = (E - W) / 2 * KX
HZ = (N - S) / 2 * KZ
BBOX = box(W, S, E, N)
print('world half-size', round(HX), round(HZ))


def to_xy(lon, lat):
    return (lon - LON0) * KX, -(lat - LAT0) * KZ


def proj(g):
    return shapely.transform(g, lambda c: np.column_stack([(c[:, 0] - LON0) * KX, -(c[:, 1] - LAT0) * KZ]))


def h32(s):
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)


def rnd(s):
    return h32(s) / 0xFFFFFFFF


def name_of(r):
    return ((r.get('names') or {}).get('primary') or '').strip()


def read(f, cols=None):
    return pq.read_table(os.path.join(SRC, f), columns=cols).to_pylist()

# ---------------------------------------------------------------- terrain
GRID = 16.0
NX = int(round(2 * HX / GRID)) + 1
NZ = int(round(2 * HZ / GRID)) + 1
print('terrain grid', NX, NZ)


def load_dem():
    tiles = {}
    for p in glob.glob(os.path.join(SRC, 'dem', '14_*.png')):
        _, x, y = os.path.basename(p)[:-4].split('_')
        a = np.asarray(Image.open(p).convert('RGB'), dtype=np.float64)
        tiles[(int(x), int(y))] = a[:, :, 0] * 256 + a[:, :, 1] + a[:, :, 2] / 256 - 32768
    z = 14
    xs = np.linspace(-HX, HX, NX)
    zs = np.linspace(-HZ, HZ, NZ)
    X, Z = np.meshgrid(xs, zs)
    lon = X / KX + LON0
    lat = -Z / KZ + LAT0
    fx = (lon + 180) / 360 * 2 ** z
    r = np.radians(lat)
    fy = (1 - np.log(np.tan(r) + 1 / np.cos(r)) / math.pi) / 2 * 2 ** z
    px = fx * 256 - 0.5
    py = fy * 256 - 0.5
    out = np.zeros_like(px)

    def sample(ix, iy):
        tx, ty = ix // 256, iy // 256
        res = np.zeros(ix.shape)
        for key, arr in tiles.items():
            m = (tx == key[0]) & (ty == key[1])
            if m.any():
                res[m] = arr[iy[m] % 256, ix[m] % 256]
        return res
    x0 = np.floor(px).astype(int)
    y0 = np.floor(py).astype(int)
    ax = px - x0
    ay = py - y0
    out = (sample(x0, y0) * (1 - ax) * (1 - ay) + sample(x0 + 1, y0) * ax * (1 - ay)
           + sample(x0, y0 + 1) * (1 - ax) * ay + sample(x0 + 1, y0 + 1) * ax * ay)
    return out


H = load_dem()
print('raw elevation', H.min().round(1), H.max().round(1))
# The source is a surface model in places: smooth out building-sized bumps
# but keep the hills.
H = ndimage.gaussian_filter(H, 2.6)


def cell(x, z):
    return (x + HX) / GRID, (z + HZ) / GRID


def raster(geoms, scale=1.0, fill=1):
    """Rasterise projected polygons onto the terrain grid (or a finer one)."""
    w, h = int((NX - 1) * scale) + 1, int((NZ - 1) * scale) + 1
    im = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(im)
    for g in geoms:
        polys = g.geoms if hasattr(g, 'geoms') else [g]
        for p in polys:
            if p.geom_type != 'Polygon' or p.is_empty:
                continue
            d.polygon([((x + HX) / GRID * scale, (z + HZ) / GRID * scale) for x, z in p.exterior.coords], fill=fill)
            for hole in p.interiors:
                d.polygon([((x + HX) / GRID * scale, (z + HZ) / GRID * scale) for x, z in hole.coords], fill=0)
    return np.asarray(im) > 0

# ---------------------------------------------------------------- water
water_rows = read('water.parquet')
rivers = []
ponds = []
for r in water_rows:
    g = WKB.loads(r['geometry'])
    if not g.intersects(BBOX):
        continue
    if r['subtype'] in ('river',) and g.geom_type.endswith('Polygon'):
        rivers.append(proj(g.intersection(BBOX.buffer(0.004))))
    elif r['subtype'] in ('lake', 'pond', 'reservoir', 'water') and g.geom_type.endswith('Polygon') and r['class'] not in ('wastewater',):
        pg = proj(g)
        if pg.area > 150:
            ponds.append((pg, name_of(r)))
river_u = unary_union(rivers).buffer(0)
print('river area km2', round(river_u.area / 1e6, 3))
rmask = raster([river_u])
# Water level: a low envelope of the smoothed surface, smoothed along the bed.
lowest = ndimage.minimum_filter(H, size=9)
lvl = ndimage.gaussian_filter(np.where(rmask, lowest, np.nan_to_num(lowest)), 4)
# Spread the in-river level out to the banks.
dist, (iy, ix) = ndimage.distance_transform_edt(~rmask, return_indices=True)
lvl_near = lvl[iy, ix]
WATER_DROP = 1.2
water_level = lvl_near - WATER_DROP
# Carve the bed and slope the banks down to it over ~40 m.
bank = np.clip(dist * GRID / 40.0, 0, 1)
bank = bank * bank * (3 - 2 * bank)
target = water_level + 2.2
Hc = np.where(rmask, water_level - 3.0, np.minimum(H, target + (H - target) * bank + 0.0 * bank))
Hc = np.where(rmask | (dist * GRID < 40), np.minimum(H, Hc), H)
H = Hc
for pg, _ in ponds:
    m = raster([pg])
    if m.any():
        lv = H[m].min() - 0.6
        H[m] = np.minimum(H[m], lv - 1.5)

BASE = float(np.round(np.percentile(H, 5)))
print('BASE', BASE, 'range', H.min().round(1), H.max().round(1))


def hat(x, z):
    """Bilinear terrain height at a world point (absolute metres)."""
    cx, cz = cell(x, z)
    cx = min(max(cx, 0), NX - 1.001)
    cz = min(max(cz, 0), NZ - 1.001)
    i, j = int(cx), int(cz)
    fx, fz = cx - i, cz - j
    return (H[j, i] * (1 - fx) * (1 - fz) + H[j, i + 1] * fx * (1 - fz)
            + H[j + 1, i] * (1 - fx) * fz + H[j + 1, i + 1] * fx * fz)


def wlevel(x, z):
    cx, cz = cell(x, z)
    i = int(min(max(round(cx), 0), NX - 1))
    j = int(min(max(round(cz), 0), NZ - 1))
    return water_level[j, i]

# ---------------------------------------------------------------- roads
CLASS = ['trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service', 'living_street',
         'unclassified', 'unknown', 'track', 'footway', 'path', 'steps', 'pedestrian', 'cycleway',
         'motorway', 'rail', 'metro']
WIDTH = {'motorway': 22, 'trunk': 20, 'primary': 15, 'secondary': 12, 'tertiary': 9.5, 'residential': 6.5,
         'service': 4.5, 'living_street': 5, 'unclassified': 6, 'unknown': 5.5, 'track': 4, 'footway': 2.4,
         'path': 2, 'steps': 2.4, 'pedestrian': 5, 'cycleway': 2.4, 'rail': 4.2, 'metro': 9}
DRIVE = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential', 'service', 'living_street',
         'unclassified', 'unknown', 'track'}

seg_rows = read('seg.parquet')
names = []
name_ix = {}


def nidx(n):
    if not n:
        return 0xFFFF
    if n not in name_ix:
        name_ix[n] = len(names)
        names.append(n)
    return name_ix[n]


def ranges(rules, key='values'):
    out = []
    for rr in rules or []:
        b = rr.get('between') or [0.0, 1.0]
        out.append((b[0], b[1], rr.get(key) if key else rr))
    return out


def flag_at(fr, t, flag):
    for a, b, v in fr:
        if a - 1e-9 <= t <= b + 1e-9 and v and flag in v:
            return True
    return False


def level_at(lr, t):
    for a, b, v in lr:
        if a - 1e-9 <= t <= b + 1e-9:
            return v
    return 0


nodes = {}      # connector id -> index
node_xy = []


def node(cid, x, z):
    if cid not in nodes:
        nodes[cid] = len(node_xy)
        node_xy.append((x, z))
    return nodes[cid]


pieces = []     # dicts
clip = box(-HX - 30, -HZ - 30, HX + 30, HZ + 30)
for r in seg_rows:
    g = WKB.loads(r['geometry'])
    if g.geom_type != 'LineString':
        continue
    cls = r['class'] or 'unknown'
    if r['subtype'] == 'rail':
        if cls == 'subway' or cls == 'light_rail':
            cls = 'metro'
        elif cls in ('standard_gauge', 'unknown'):
            cls = 'rail'
        else:
            continue
    if cls not in WIDTH:
        continue
    if any('is_under_construction' in (v or []) for _, _, v in ranges(r['road_flags'])) and cls != 'metro':
        continue
    pg = proj(g)
    if not pg.intersects(clip):
        continue
    flags = ranges(r['road_flags'] if r['subtype'] == 'road' else r['rail_flags'])
    lv = [(a, b, v['value']) for a, b, v in ranges(r['level_rules'], None)]
    width = WIDTH[cls]
    for a, b, v in ranges(r['width_rules'], None):
        if v.get('value') and 2 < v['value'] < 40:
            width = v['value']
    one = 0
    for a, b, v in ranges(r['access_restrictions'], None):
        w = v.get('when') or {}
        if v.get('access_type') == 'denied' and w.get('heading') and not w.get('mode') and not w.get('using'):
            one = 1 if w['heading'] == 'backward' else 2
    conns = sorted([(c['at'], c['connector_id']) for c in (r['connectors'] or [])])
    if not conns or conns[0][0] > 1e-6:
        conns.insert(0, (0.0, r['id'] + ':s'))
    if conns[-1][0] < 1 - 1e-6:
        conns.append((1.0, r['id'] + ':e'))
    L = pg.length
    for (ta, ca), (tb, cb) in zip(conns, conns[1:]):
        if tb - ta < 1e-9:
            continue
        sub = shapely.ops.substring(pg, ta * L, tb * L)
        if sub.geom_type != 'LineString' or sub.length < 0.3:
            continue
        if not sub.intersects(clip):
            continue
        # resample to <= 9 m spacing so the road can follow the ground
        n = max(1, int(math.ceil(sub.length / 9.0)))
        coords = list(sub.coords)
        dense = [coords[0]]
        for p, q in zip(coords, coords[1:]):
            seg_len = math.dist(p, q)
            k = max(1, int(math.ceil(seg_len / 9.0)))
            for i in range(1, k + 1):
                dense.append((p[0] + (q[0] - p[0]) * i / k, p[1] + (q[1] - p[1]) * i / k))
        # per-point flags and levels in segment parameter space
        acc = 0.0
        pts = []
        for i, (x, z) in enumerate(dense):
            if i:
                acc += math.dist(dense[i - 1], dense[i])
            t = ta + (tb - ta) * (acc / max(sub.length, 1e-6))
            br = flag_at(flags, t, 'is_bridge')
            tu = flag_at(flags, t, 'is_tunnel')
            pts.append([x, z, br, tu, level_at(lv, t)])
        na = node(ca, *dense[0])
        nb = node(cb, *dense[-1])
        pieces.append(dict(cls=cls, w=width, one=one, name=name_of(r), a=na, b=nb, pts=pts, id=r['id']))

print('pieces', len(pieces), 'nodes', len(node_xy))

# Heights: ground, flyovers (level>=1 or bridges), ramps toward elevated nodes.
LEVEL_H = 6.5
node_off = np.zeros(len(node_xy))
for p in pieces:
    for idx, end in ((p['a'], p['pts'][0]), (p['b'], p['pts'][-1])):
        lvl = end[4]
        if p['cls'] == 'metro':
            continue
        if lvl and lvl > 0:
            node_off[idx] = max(node_off[idx], LEVEL_H * lvl)
metro_node_off = np.zeros(len(node_xy))


def piece_heights(p):
    pts = p['pts']
    n = len(pts)
    ys = []
    s = [0.0]
    for i in range(1, n):
        s.append(s[-1] + math.dist(pts[i - 1][:2], pts[i][:2]))
    L = s[-1]
    ground = [hat(x, z) for x, z, *_ in pts]
    if p['cls'] == 'metro':
        # elevated unless flagged tunnel; underground pieces are hidden
        out = []
        for i, (x, z, br, tu, lv) in enumerate(pts):
            out.append(ground[i] - 12 if tu else ground[i] + 11.5)
        # smooth the viaduct
        out = list(ndimage.uniform_filter1d(np.array(out), size=7, mode='nearest')) if n > 3 else out
        return out
    ha, hb = node_off[p['a']], node_off[p['b']]
    out = []
    for i, (x, z, br, tu, lv) in enumerate(pts):
        off = LEVEL_H * lv if lv and lv > 0 else 0.0
        if off == 0.0:
            ramp = 90.0
            off = max(ha * max(0.0, 1 - s[i] / ramp), hb * max(0.0, 1 - (L - s[i]) / ramp))
        out.append(ground[i] + off)
    # bridges: a straight deck between the bridge's own end heights, clear of the water
    i = 0
    while i < n:
        if pts[i][2]:
            j = i
            while j + 1 < n and pts[j + 1][2]:
                j += 1
            a0 = out[max(i - 1, 0)] if i > 0 else out[i]
            b0 = out[min(j + 1, n - 1)] if j < n - 1 else out[j]
            for k in range(i, j + 1):
                t = (s[k] - s[i]) / max(s[j] - s[i], 1e-6)
                deck = a0 + (b0 - a0) * t
                wl = wlevel(pts[k][0], pts[k][1])
                out[k] = max(deck, out[k], wl + 5.0) if pts[k][2] else out[k]
            i = j + 1
        else:
            i += 1
    return out


for p in pieces:
    p['ys'] = piece_heights(p)

# fix the node heights so pieces meet: average of piece ends
node_y = {}
for p in pieces:
    for idx, y in ((p['a'], p['ys'][0]), (p['b'], p['ys'][-1])):
        node_y.setdefault(idx, []).append(y)
for p in pieces:
    if p['cls'] == 'metro':
        continue
    ya = max(node_y[p['a']])
    yb = max(node_y[p['b']])
    n = len(p['ys'])
    # blend the first/last 20 m to the agreed node height
    s = [0.0]
    for i in range(1, n):
        s.append(s[-1] + math.dist(p['pts'][i - 1][:2], p['pts'][i][:2]))
    L = s[-1]
    for i in range(n):
        wa = max(0.0, 1 - s[i] / 20.0)
        wb = max(0.0, 1 - (L - s[i]) / 20.0)
        y = p['ys'][i]
        y = y + (ya - p['ys'][0]) * wa
        y = y + (yb - p['ys'][-1]) * wb
        p['ys'][i] = y


def q(v):
    return max(-32767, min(32767, int(round(v * 2))))


def qy(v):
    return max(-32767, min(32767, int(round((v - BASE) * 10))))


with open(os.path.join(OUT, 'roads.bin'), 'wb') as f:
    f.write(struct.pack('<II', len(node_xy), len(pieces)))
    for i, (x, z) in enumerate(node_xy):
        f.write(struct.pack('<hh', q(x), q(z)))
    for p in pieces:
        flags = (p['one'] & 3)
        flags |= 4 if any(pt[2] for pt in p['pts']) else 0
        flags |= 8 if any(pt[3] for pt in p['pts']) else 0
        f.write(struct.pack('<BBBBHII H', CLASS.index(p['cls']), flags, min(255, int(round(p['w'] * 4))), 0,
                            nidx(p['name']), p['a'], p['b'], len(p['pts'])))
        for (x, z, br, tu, lv), y in zip(p['pts'], p['ys']):
            f.write(struct.pack('<hhhBB', q(x), q(z), qy(y), (1 if br else 0) | (2 if tu else 0), 0))
print('roads.bin', os.path.getsize(os.path.join(OUT, 'roads.bin')))

# ---------------------------------------------------------------- land use
lu_rows = read('lu.parquet')
LU = {
    'park': 'park', 'garden': 'park', 'grass': 'grass', 'pitch': 'pitch', 'recreation_ground': 'grass',
    'golf_course': 'grass', 'fairway': 'grass', 'green': 'grass', 'tee': 'grass', 'bunker': 'sand',
    'cemetery': 'cemetery', 'military': 'military', 'university': 'campus', 'college': 'campus',
    'school': 'campus', 'education': 'campus', 'hospital': 'campus', 'railway': 'railway', 'farmland': 'farm',
    'meadow': 'grass', 'playground': 'pitch', 'track': 'track', 'stadium': 'pitch', 'quarry': 'quarry',
    'construction': 'construction', 'species_management_area': 'park', 'flowerbed': 'park',
    'plant_nursery': 'park', 'industrial': 'industrial', 'commercial': 'commercial', 'retail': 'commercial',
    'religious': 'campus',
}
landuse = []
for r in lu_rows:
    k = LU.get(r['class'])
    if not k:
        continue
    g = WKB.loads(r['geometry'])
    if not g.intersects(BBOX):
        continue
    pg = proj(g)
    landuse.append((k, pg, name_of(r)))
print('landuse', len(landuse))

# ---------------------------------------------------------------- buildings
bld_rows = read('bld.parquet', ['id', 'geometry', 'height', 'num_floors', 'class', 'names'])

# zones for height guesses (lon/lat boxes converted to world polygons)
def zbox(w, s, e, n):
    a = to_xy(w, n)
    b = to_xy(e, s)
    return box(a[0], a[1], b[0], b[1])


Z_PETH = zbox(73.8435, 18.5025, 73.8705, 18.5245)            # the old city
Z_CAMP = zbox(73.8700, 18.5040, 73.8920, 18.5230)            # cantonment
Z_KP = zbox(73.8840, 18.5300, 73.9050, 18.5450)              # Koregaon Park lanes
Z_NEW = [zbox(73.8930, 18.5420, 73.9150, 18.5620),            # Kalyani Nagar / Viman Nagar edge
         zbox(73.8180, 18.4880, 73.8350, 18.5150)]            # Kothrud edge
mil = unary_union([g for k, g, _ in landuse if k == 'military']).buffer(0)
campus = unary_union([g for k, g, _ in landuse if k == 'campus']).buffer(0)
mil_t = STRtree([mil]) if not mil.is_empty else None

LANDMARK_NAMES = {
    'shaniwar wada': 'shaniwarwada', 'shreemant dagdusheth halwai ganpati mandir': 'dagdusheth',
    'aga khan palace': 'agakhan', 'pune railway station': 'station',
}
landmark_foot = {}
TYPES = ['house', 'apartment', 'wada', 'colonial', 'temple', 'shed', 'campus', 'tower', 'vasti', 'commercial', 'bungalow']
blds = []
dropped = 0
for r in bld_rows:
    g = WKB.loads(r['geometry'])
    if g.geom_type == 'MultiPolygon':
        g = max(g.geoms, key=lambda p: p.area)
    if g.geom_type != 'Polygon':
        continue
    c = g.centroid
    if not (W <= c.x <= E and S <= c.y <= N):
        continue
    nm = name_of(r).lower()
    if nm in LANDMARK_NAMES:
        landmark_foot.setdefault(LANDMARK_NAMES[nm], []).append(proj(g))
        continue
    pg = proj(g)
    A = pg.area
    if A < 14:
        dropped += 1
        continue
    pg = pg.simplify(0.45, preserve_topology=True)
    if pg.geom_type != 'Polygon' or pg.is_empty:
        continue
    ring = list(pg.exterior.coords)[:-1]
    if len(ring) < 3:
        continue
    if len(ring) > 40:
        pg2 = pg.simplify(1.2, preserve_topology=True)
        if pg2.geom_type == 'Polygon':
            ring = list(pg2.exterior.coords)[:-1]
    if len(ring) > 60:
        ring = list(pg.minimum_rotated_rectangle.exterior.coords)[:-1]
    # ensure CCW in (x, z-south) frame == clockwise on a map; normalise to CCW in x/-z
    pr = Polygon(ring)
    if not pr.exterior.is_ccw:
        ring = ring[::-1]
    u = rnd(r['id'])
    u2 = rnd(r['id'] + 'b')
    cls = r['class'] or ''
    ctr = pg.centroid
    floors = None
    if r['height']:
        hgt = float(r['height'])
    elif r['num_floors']:
        hgt = 3.1 * r['num_floors'] + 0.8
    else:
        hgt = None
    typ = 'apartment'
    if cls in ('temple', 'church', 'mosque', 'religious', 'shrine'):
        typ = 'temple'
    elif cls in ('industrial', 'warehouse', 'shed', 'roof', 'garage', 'garages', 'hangar', 'train_station', 'shelter', 'carport'):
        typ = 'shed'
    elif cls in ('school', 'university', 'college', 'hospital', 'public', 'government', 'civic'):
        typ = 'campus'
    elif cls in ('house', 'detached', 'bungalow', 'semidetached_house'):
        typ = 'bungalow'
    elif cls in ('commercial', 'retail', 'office', 'hotel', 'supermarket'):
        typ = 'commercial'
    in_peth = Z_PETH.contains(ctr)
    in_camp = Z_CAMP.contains(ctr)
    in_kp = Z_KP.contains(ctr)
    in_new = any(z.contains(ctr) for z in Z_NEW)
    in_mil = (not mil.is_empty) and mil.contains(ctr)
    in_campus = (not campus.is_empty) and campus.contains(ctr)
    if hgt is None:
        if A < 45 and not in_campus:
            typ = 'vasti' if typ == 'apartment' else typ
            hgt = 3.2 + (3.0 if u < 0.35 else 0.0)
        elif typ == 'shed':
            hgt = 5 + 4 * u
        elif typ == 'temple':
            hgt = 7 + 5 * u
        elif in_mil:
            typ = 'colonial'
            hgt = 5 + 3 * u
        elif in_peth:
            typ = 'wada' if A < 500 else ('commercial' if u < 0.5 else 'apartment')
            fl = 2 + int(u * 3.2) if A < 500 else 3 + int(u * 3)
            hgt = 3.2 * fl + 0.8
        elif in_camp:
            typ = 'colonial' if A < 900 and u < 0.7 else typ
            hgt = 3.6 * (2 + int(u * 2.2)) + 1.0
        elif in_kp:
            typ = 'bungalow' if A < 450 else typ
            hgt = 3.3 * (2 + int(u * 2.5)) + 1 if A < 450 else 3.2 * (4 + int(u * 6)) + 1
        elif in_campus:
            typ = 'campus'
            hgt = 3.6 * (2 + int(u * 3)) + 1
        else:
            if A < 110:
                typ = 'house'
                hgt = 3.1 * (1 + int(u * 2.6)) + 0.6
            elif A < 450:
                hgt = 3.1 * (3 + int(u * 3)) + 1
                typ = 'apartment'
            elif A < 2500:
                big = 7 if in_new else 4
                hgt = 3.1 * (big + int(u * (8 if in_new else 6))) + 1.5
                typ = 'tower' if hgt > 28 else 'apartment'
            else:
                hgt = 3.6 * (2 + int(u * 4)) + 1
                typ = 'commercial' if u2 < 0.6 else 'shed'
    hgt = max(3.0, min(120.0, hgt))
    blds.append(dict(ring=ring, h=hgt, t=TYPES.index(typ), id=r['id'], ctr=(ctr.x, ctr.y), area=A))
print('buildings', len(blds), 'dropped small', dropped)

# street frontage: for buildings near a busier road, which edge faces it
major = [LineString([(x, z) for x, z, *_ in p['pts']]) for p in pieces
         if p['cls'] in ('trunk', 'primary', 'secondary', 'tertiary') and len(p['pts']) > 1]
major_tree = STRtree(major)
for b in blds:
    b['front'] = 255
    if b['t'] in (TYPES.index('shed'), TYPES.index('vasti')):
        continue
    pc = Point(b['ctr'])
    near = major_tree.query(pc.buffer(30))
    if len(near) == 0:
        continue
    road = min((major[i] for i in near), key=lambda l: l.distance(pc))
    if road.distance(pc) > 28:
        continue
    best, bd = 255, 1e9
    ring = b['ring']
    for i in range(len(ring)):
        a, c2 = ring[i], ring[(i + 1) % len(ring)]
        if math.dist(a, c2) < 3:
            continue
        m = Point((a[0] + c2[0]) / 2, (a[1] + c2[1]) / 2)
        d = road.distance(m)
        if d < bd:
            bd, best = d, i
    if bd < 16:
        b['front'] = best

with open(os.path.join(OUT, 'buildings.bin'), 'wb') as f:
    f.write(struct.pack('<I', len(blds)))
    for b in blds:
        f.write(struct.pack('<BBBB', len(b['ring']), b['t'], min(255, int(round(b['h'] * 2))), b['front']))
        for x, z in b['ring']:
            f.write(struct.pack('<hh', q(x), q(z)))
print('buildings.bin', os.path.getsize(os.path.join(OUT, 'buildings.bin')))

# ---------------------------------------------------------------- ground texture
TEX_M = 4.0
TW, TH = int(2 * HX / TEX_M), int(2 * HZ / TEX_M)
print('ground texture', TW, TH)
img = Image.new('RGB', (TW, TH), (168, 146, 112))
dr = ImageDraw.Draw(img)


def tp(x, z):
    return ((x + HX) / TEX_M, (z + HZ) / TEX_M)


def poly(g, col):
    for p in (g.geoms if hasattr(g, 'geoms') else [g]):
        if p.geom_type != 'Polygon' or p.is_empty:
            continue
        dr.polygon([tp(*c) for c in p.exterior.coords], fill=col)


# slope + height tint: hills are dry scrub and rock
gy, gx = np.gradient(H, GRID)
slope = np.hypot(gx, gy)
hill = np.clip((H - (BASE + 25)) / 60, 0, 1)
noise = ndimage.gaussian_filter(np.random.RandomState(4).rand(NZ, NX), 2)
base = np.zeros((NZ, NX, 3))
earth = np.array([168, 146, 112])
scrub = np.array([128, 122, 78])
rock = np.array([140, 120, 98])
mix = np.clip(hill + slope * 2.2, 0, 1)[..., None]
base = earth * (1 - mix) + (scrub * (1 - np.clip(slope * 3, 0, 1)[..., None]) + rock * np.clip(slope * 3, 0, 1)[..., None]) * mix
base = base * (0.9 + 0.2 * noise[..., None])
bimg = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).resize((TW, TH), Image.BILINEAR)
img.paste(bimg)
dr = ImageDraw.Draw(img)
COL = {'park': (92, 122, 62), 'grass': (110, 132, 70), 'pitch': (104, 140, 66), 'cemetery': (120, 122, 90),
       'military': (150, 140, 104), 'campus': (150, 138, 104), 'railway': (122, 112, 98), 'farm': (140, 136, 84),
       'sand': (200, 186, 140), 'track': (166, 98, 72), 'quarry': (160, 150, 140), 'construction': (176, 150, 116),
       'industrial': (150, 142, 130), 'commercial': (160, 150, 132)}
ORDER = ['commercial', 'industrial', 'military', 'campus', 'farm', 'railway', 'construction', 'quarry', 'cemetery',
         'park', 'grass', 'pitch', 'sand', 'track']
for k in ORDER:
    for kk, g, _ in landuse:
        if kk == k:
            poly(g, (150, 132, 92) if k == 'track' and g.area > 40000 else COL[k])
# water bodies darker under the water plane
poly(river_u, (60, 70, 62))
for pg, _ in ponds:
    poly(pg, (60, 70, 62))
# building shadows/aprons: compounds are paved
for b in blds:
    if b['area'] > 60 and b['t'] != TYPES.index('vasti'):
        dr.polygon([tp(*c) for c in Polygon(b['ring']).buffer(2.5, join_style=2).exterior.coords], fill=(176, 166, 146))
img = img.filter(ImageFilter.GaussianBlur(0.8))
img.save(os.path.join(OUT, 'ground.jpg'), quality=82)
print('ground.jpg', os.path.getsize(os.path.join(OUT, 'ground.jpg')))

# ---------------------------------------------------------------- trees
rng = np.random.RandomState(11)
occ = Image.new('L', (TW, TH), 0)
od = ImageDraw.Draw(occ)
for b in blds:
    od.polygon([tp(*c) for c in b['ring']], fill=255)
for p in pieces:
    pts = [tp(x, z) for x, z, *_ in p['pts']]
    if len(pts) > 1:
        od.line(pts, fill=255, width=max(1, int(p['w'] / TEX_M + 1.5)))
for g in [river_u] + [pg for pg, _ in ponds]:
    for pp in (g.geoms if hasattr(g, 'geoms') else [g]):
        if pp.geom_type == 'Polygon':
            od.polygon([tp(*c) for c in pp.exterior.coords], fill=255)
occ = np.asarray(occ) > 0
occ = ndimage.binary_dilation(occ, iterations=1)
green = Image.new('L', (TW, TH), 0)
gd = ImageDraw.Draw(green)
for k, g, _ in landuse:
    if k in ('park', 'cemetery', 'campus', 'military', 'grass'):
        for pp in (g.geoms if hasattr(g, 'geoms') else [g]):
            if pp.geom_type == 'Polygon':
                gd.polygon([tp(*c) for c in pp.exterior.coords], fill={'park': 255, 'cemetery': 200, 'campus': 150, 'military': 160, 'grass': 90}[k])
green = np.asarray(green) / 255.0
# riverbanks are thick with trees in Pune, and so are the hills
rb = ndimage.distance_transform_edt(~raster([river_u], scale=GRID / TEX_M)[:TH, :TW]) * TEX_M if True else None
hillTex = np.asarray(Image.fromarray((hill * 255).astype(np.uint8)).resize((TW, TH), Image.BILINEAR)) / 255.0
dens = 0.012 + green * 0.10 + np.where((rb > 4) & (rb < 45), 0.08, 0) + hillTex * 0.05
cand = rng.rand(TH, TW) < dens * 0.32
cand &= ~occ
ys_, xs_ = np.nonzero(cand)
trees = []
for y, x in zip(ys_, xs_):
    wx = (x + rng.rand()) * TEX_M - HX
    wz = (y + rng.rand()) * TEX_M - HZ
    kind = rng.randint(0, 4)
    if hillTex[y, x] > 0.4:
        kind = 4 if rng.rand() < 0.6 else kind
    trees.append((wx, wz, kind, int(140 + rng.rand() * 115)))
# avenue trees along roads (many Pune roads are lined with old rain trees and banyans)
for p in pieces:
    if p['cls'] not in ('primary', 'secondary', 'tertiary', 'residential'):
        continue
    pts = p['pts']
    step = 26 if p['cls'] != 'residential' else 34
    acc = 0
    for i in range(1, len(pts)):
        a, b = pts[i - 1], pts[i]
        d = math.dist(a[:2], b[:2])
        acc += d
        if acc < step or a[2] or b[2] or (a[4] or 0) > 0:
            continue
        acc = 0
        dx, dz = (b[0] - a[0]) / d, (b[1] - a[1]) / d
        for side in (-1, 1):
            if rng.rand() < 0.5:
                continue
            off = p['w'] / 2 + 2.2
            wx, wz = b[0] - dz * off * side, b[1] + dx * off * side
            tx, ty = int((wx + HX) / TEX_M), int((wz + HZ) / TEX_M)
            if 0 <= tx < TW and 0 <= ty < TH and not occ[ty, tx]:
                trees.append((wx, wz, rng.choice([0, 1, 2]), int(170 + rng.rand() * 85)))
print('trees', len(trees))
with open(os.path.join(OUT, 'trees.bin'), 'wb') as f:
    f.write(struct.pack('<I', len(trees)))
    for x, z, k, s in trees:
        f.write(struct.pack('<hhBB', q(x), q(z), k, s))

# ---------------------------------------------------------------- terrain file
with open(os.path.join(OUT, 'terrain.bin'), 'wb') as f:
    f.write(struct.pack('<IIff', NX, NZ, GRID, BASE))
    f.write(np.clip((H - BASE) * 10, -32767, 32767).astype('<i2').tobytes())
    wl = np.where(dist * GRID < 60, water_level - BASE, -999)
    f.write(np.clip(wl * 10, -32767, 32767).astype('<i2').tobytes())

# ---------------------------------------------------------------- water + land polygons (json)
def rings(g, tol=1.0):
    out = []
    for p in (g.geoms if hasattr(g, 'geoms') else [g]):
        if p.geom_type != 'Polygon' or p.is_empty:
            continue
        p = p.simplify(tol)
        if p.is_empty or p.geom_type != 'Polygon':
            continue
        out.append([[v for x, z in p.exterior.coords[:-1] for v in (q(x), q(z))],
                    [[v for x, z in h.coords[:-1] for v in (q(x), q(z))] for h in p.interiors]])
    return out


water_json = {'rivers': rings(river_u, 1.5), 'ponds': [dict(name=n, rings=rings(pg, 0.8)) for pg, n in ponds]}
json.dump(water_json, open(os.path.join(OUT, 'water.json'), 'w'), separators=(',', ':'))

# ---------------------------------------------------------------- meta
div_rows = read('div.parquet')
hoods = []
for r in div_rows:
    if r['subtype'] in ('macrohood', 'neighborhood', 'locality', 'microhood'):
        g = WKB.loads(r['geometry'])
        c = g if g.geom_type == 'Point' else g.centroid
        n = name_of(r)
        if not (W <= c.x <= E and S <= c.y <= N) or not n or n.startswith('Ward') or n == 'Pune':
            continue
        if any(ord(ch) > 0x900 for ch in n):
            continue
        x, z = to_xy(c.x, c.y)
        hoods.append(dict(name=n, x=round(x), z=round(z), k=r['subtype']))
# a few the division layer lacks, placed from the landmark and land-use data
EXTRA_HOODS = [
    ('Koregaon Park', 73.8935, 18.5369), ('Camp', 73.8790, 18.5150), ('Budhwar Peth', 73.8580, 18.5165),
    ('Raviwar Peth', 73.8610, 18.5145), ('Bhavani Peth', 73.8680, 18.5090), ('Rasta Peth', 73.8680, 18.5195),
    ('Bund Garden', 73.8830, 18.5410), ('Sangamwadi', 73.8660, 18.5370), ('Parvati', 73.8480, 18.4970),
    ('Gokhalenagar', 73.8320, 18.5300), ('Laxmi Road', 73.8520, 18.5140), ('FC Road', 73.8410, 18.5230),
    ('Pune Station', 73.8730, 18.5290), ('Tadiwala Road', 73.8800, 18.5280), ('Ghorpadi', 73.9050, 18.5250),
    ('Narayan Peth', 73.8511, 18.5156), ('Bhawani Peth', 73.8680, 18.5090), ('Prabhat Road', 73.8350, 18.5140),
    ('Wakdewadi', 73.8520, 18.5360), ('Mundhwa Road', 73.9080, 18.5400), ('Salisbury Park', 73.8770, 18.4950),
    ('Kalyani Nagar', 73.9026, 18.5481), ('Yerawada', 73.8900, 18.5520),
]
have = {h['name'] for h in hoods}
for n, lo, la in EXTRA_HOODS:
    if n not in have and W <= lo <= E and S <= la <= N:
        x, z = to_xy(lo, la)
        hoods.append(dict(name=n, x=round(x), z=round(z), k='extra'))

# landmarks: real positions; where we have a footprint, its orientation too
LANDMARKS = [
    ('shaniwarwada', 'Shaniwar Wada', 73.85534, 18.51955),
    ('dagdusheth', 'Dagdusheth Halwai Ganpati', 73.8561, 18.51638),
    ('kasba', 'Kasba Ganpati', 73.85893, 18.52086),
    ('lalmahal', 'Lal Mahal', 73.85655, 18.51871),
    ('tulshibaug', 'Tulshibaug Ram Mandir', 73.8555, 18.51373),
    ('mandai', 'Mahatma Phule Mandai', 73.85629, 18.51291),
    ('vishrambaug', 'Vishrambaug Wada', 73.85336, 18.51383),
    ('omkareshwar', 'Omkareshwar Mandir', 73.84807, 18.51803),
    ('parvati', 'Parvati Temple', 73.84819, 18.49758),
    ('sarasbaug', 'Saras Baug', 73.85296, 18.5013),
    ('swargate', 'Swargate', 73.85897, 18.49996),
    ('station', 'Pune Railway Station', 73.87241, 18.52976),
    ('sassoon', 'Sassoon General Hospital', 73.8745, 18.5292),
    ('agakhan', 'Aga Khan Palace', 73.90147, 18.55233),
    ('osho', 'Osho Teerth Park', 73.89116, 18.53649),
    ('bundgarden', 'Bund Garden', 73.88424, 18.54168),
    ('fergusson', 'Fergusson College', 73.83889, 18.52279),
    ('balgandharva', 'Balgandharva Rangmandir', 73.84869, 18.52199),
    ('coep', 'College of Engineering, Pune', 73.8566, 18.53066),
    ('court', 'Shivajinagar District Court', 73.85633, 18.52771),
    ('deccan', 'Deccan Gymkhana', 73.84108, 18.51503),
    ('sambhaji', 'Sambhaji Bridge (Lakdi Pul)', 73.84318, 18.51344),
    ('zbridge', 'Z Bridge', 73.84374, 18.51562),
    ('sambhajiudyan', 'Sambhaji Udyan', 73.84722, 18.52072),
    ('chaturshringi', 'Chaturshringi Mandir', 73.82777, 18.53889),
    ('university', 'Savitribai Phule Pune University', 73.82694, 18.55197),
    ('empress', 'Empress Botanical Garden', 73.89778, 18.51295),
    ('faraskhana', 'Faraskhana Police Station', 73.85584, 18.51644),
    ('mgroad', 'MG Road, Camp', 73.8789, 18.5150),
    ('shivajinagar', 'Shivajinagar Station', 73.84949, 18.53269),
    ('nehru', 'Nehru Stadium', 73.85556, 18.50215),
    ('vetal', 'Vetal Tekdi', 73.8240, 18.5265),
    ('gpo', 'Shivajinagar Post Office', 73.85044, 18.52752),
    ('boatclub', 'COEP Boat Club', 73.85626, 18.53097),
]
lms = []
for key, label, lo, la in LANDMARKS:
    x, z = to_xy(lo, la)
    d = dict(key=key, name=label, x=round(x, 1), z=round(z, 1), y=round(hat(x, z) - BASE, 2))
    if key in landmark_foot:
        g = unary_union(landmark_foot[key])
        mrr = g.minimum_rotated_rectangle
        cs = list(mrr.exterior.coords)
        e0 = (cs[1][0] - cs[0][0], cs[1][1] - cs[0][1])
        e1 = (cs[2][0] - cs[1][0], cs[2][1] - cs[1][1])
        d['x'], d['z'] = round(mrr.centroid.x, 1), round(mrr.centroid.y, 1)
        d['y'] = round(hat(d['x'], d['z']) - BASE, 2)
        d['w'] = round(math.hypot(*e0), 1)
        d['d'] = round(math.hypot(*e1), 1)
        d['rot'] = round(math.atan2(e0[1], e0[0]), 4)
        d['foot'] = [v for c in g.exterior.coords[:-1] for v in (round(c[0], 1), round(c[1], 1))] if g.geom_type == 'Polygon' else None
    lms.append(d)

parks = []
for k, g, n in landuse:
    if n and k in ('park', 'campus', 'pitch', 'military', 'cemetery') and g.area > 4000:
        c = g.representative_point()
        parks.append(dict(name=n, k=k, x=round(c.x), z=round(c.y)))

meta = dict(
    bbox=[W, S, E, N], origin=[LON0, LAT0], kx=KX, kz=KZ, half=[HX, HZ], base=BASE,
    classes=CLASS, types=TYPES, names=names, hoods=hoods, landmarks=lms, places=parks,
    attribution='Map data © OpenStreetMap contributors (ODbL) via Overture Maps Foundation; elevation: Terrarium tiles (SRTM and others), AWS Open Data.',
)
json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
for fn in sorted(os.listdir(OUT)):
    print(fn, os.path.getsize(os.path.join(OUT, fn)))
