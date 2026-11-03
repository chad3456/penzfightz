import csv, json, sys
dl = sys.argv[1]; out = sys.argv[2]
ids = {'us':('United States','USA'),'cn':('China','CHN'),'in':('India','IND'),'ru':('Russia','RUS'),'gb':('United Kingdom','GBR'),'fr':('France','FRA'),'de':('Germany','DEU'),'jp':('Japan','JPN'),'br':('Brazil','BRA'),'ca':('Canada','CAN'),'it':('Italy','ITA'),'es':('Spain','ESP'),'au':('Australia','AUS'),'kr':('Korea','KOR'),'mx':('Mexico','MEX'),'id':('Indonesia','IDN'),'tr':('Turkey','TUR'),'sa':('Saudi Arabia','SAU'),'za':('South Africa','ZAF'),'ng':('Nigeria','NGA'),'eg':('Egypt','EGY'),'ar':('Argentina','ARG'),'il':('Israel','ISR'),'ir':('Iran','IRN'),'ua':('Ukraine','UKR'),'pl':('Poland','POL'),'se':('Sweden','SWE'),'nl':('Netherlands','NLD'),'ch':('Switzerland','CHE'),'sg':('Singapore','SGP'),'pk':('Pakistan','PAK'),'hu':('Hungary','HUN'),'cl':('Chile','CHL'),'co':('Colombia','COL'),'ph':('Philippines','PHL'),'kp':('North Korea','PRK'),'no':('Norway','NOR'),'pt':('Portugal','PRT'),'dk':('Denmark','DNK'),'vn':('Vietnam','VNM'),'th':('Thailand','THA'),'ve':('Venezuela','VEN'),'bd':('Bangladesh','BGD'),'et':('Ethiopia','ETH')}
sw = {}
for r in csv.DictReader(open(f'{dl}/swiid/data/swiid_summary.csv')):
    sw.setdefault(r['country'], []).append(r)
def f(x):
    try: return float(x)
    except: return None
gdp = {}; pop = {}
for r in csv.DictReader(open(f'{dl}/gdp/data/gdp.csv')): gdp.setdefault(r['Country Code'], {})[int(r['Year'])] = float(r['Value'])
for r in csv.DictReader(open(f'{dl}/population/data/population.csv')): pop.setdefault(r['Country Code'], {})[int(r['Year'])] = float(r['Value'])
res = {}
for cid, (name, iso) in ids.items():
    rows = sorted(sw.get(name, []), key=lambda r: int(r['year']))
    e = {}
    if rows:
        last = rows[-1]
        e['gini'] = {'v': f(last['gini_disp']), 'se': f(last['gini_disp_se']), 'year': int(last['year'])}
        e['giniMkt'] = {'v': f(last['gini_mkt']), 'se': f(last['gini_mkt_se']), 'year': int(last['year'])}
        rr = [r for r in rows if f(r['rel_red']) is not None]
        if rr: e['redist'] = {'v': f(rr[-1]['rel_red']), 'se': f(rr[-1]['rel_red_se']), 'year': int(rr[-1]['year'])}
        e['trend'] = [[int(r['year']), f(r['gini_disp'])] for r in rows if int(r['year']) >= 1980 and f(r['gini_disp']) is not None]
        e['trendMkt'] = [[int(r['year']), f(r['gini_mkt'])] for r in rows if int(r['year']) >= 1980 and f(r['gini_mkt']) is not None]
    g = gdp.get(iso, {}); p = pop.get(iso, {})
    yrs = [y for y in g if y in p]
    if yrs:
        y = max(yrs); e['gdppc'] = {'v': round(g[y] / p[y]), 'year': y}
    if p: y = max(p); e['pop'] = {'v': round(p[y]), 'year': y}
    gs = {y: g[y] / p[y] for y in g if y in p and y >= 1990}
    if gs: e['gdppcTrend'] = [[y, round(gs[y])] for y in sorted(gs)]
    res[cid] = e
missing = [c for c, e in res.items() if 'gini' not in e or 'gdppc' not in e]
print('missing', missing, {c: (('gini' in res[c]), ('gdppc' in res[c])) for c in missing})
json.dump(res, open(out, 'w'))
