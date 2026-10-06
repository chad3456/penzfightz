"""
Build src/ashtavakra/gita.json from the dhrmaorg/ashtavakra_gita dataset:
  - Sanskrit (source/sa.json; after Wikisource, public domain), cleaned and
    lightly corrected against the standard text;
  - English: John Henry Richards's translation, donated by him to the public
    domain (translation/johnhenryrichards_en.json).
The Hindi renderings and all commentary are written for this site
(src/ashtavakra/hi.ts, src/ashtavakra/chapters.ts) and are not taken from
any other translation.

  python3 build.py /path/to/ashtavakra_gita ../../src/ashtavakra/gita.json
"""
import json, re, sys

SRC, OUT = sys.argv[1], sys.argv[2]
sa = json.load(open(f'{SRC}/source/sa.json'))
en = json.load(open(f'{SRC}/translation/johnhenryrichards_en.json'))
chap = json.load(open(f'{SRC}/chapters/en.json'))

# Verses the dataset garbles; corrected to the commonly printed reading.
FIX = {
    '1.1': 'कथं ज्ञानमवाप्नोति कथं मुक्तिर्भविष्यति। वैराग्यं च कथं प्राप्तमेतद् ब्रूहि मम प्रभो॥',
    '1.2': 'मुक्तिमिच्छसि चेत्तात विषयान् विषवत्त्यज। क्षमार्जवदयातोषसत्यं पीयूषवद् भज॥',
    '1.8': 'अहं कर्तेत्यहंमानमहाकृष्णाहिदंशितः। नाहं कर्तेति विश्वासामृतं पीत्वा सुखी भव॥',
    '2.9': 'अहो विकल्पितं विश्वमज्ञानान्मयि भासते। रूप्यं शुक्तौ फणी रज्जौ वारि सूर्यकरे यथा॥',
    '18.16': 'येन दृष्टं परं ब्रह्म सोऽहं ब्रह्मेति चिन्तयेत्। किं चिन्तयति निश्चिन्तो द्वितीयं यो न पश्यति॥',
    '18.22': 'असंसारस्य तु क्वापि न हर्षो न विषादिता। स शीतलमना नित्यं विदेह इव राजते॥',
    '18.27': 'नानाविचारसुश्रान्तो धीरो विश्रान्तिमागतः। न कल्पते न जानाति न शृणोति न पश्यति॥',
}
SUB = [
    (':', 'ः'), ('दुखं', 'दुःखं'), ('असङगो', 'असङ्गो'), ('ज्ञानखंगेन', 'ज्ञानखड्गेन'), ('स्वरुप', 'स्वरूप'),
    ('देहमेनो', 'देहमेनं'), ('फेन बुदबुदाः', 'फेनबुद्बुदाः'), ('वीचिसऽन्निभः', 'वीचिसन्निभः'), ('किन्चिद्', 'किञ्चिद्'),
    ('गृण्हाति', 'गृह्णाति'), ('गृण्हन्', 'गृह्णन्'), ('काश्वपि', 'कास्वपि'), ('ब्रह्मन्न्', 'ब्रह्मन्'), ('मोऽहं', 'मोहं'),
    ('बुभुक्षभिः', 'बुभुक्षुभिः'), ('स्वाथ्यं', 'स्वास्थ्यं'), ('जिघ्रन्न्', 'जिघ्रन्'), ('जिघ्रन्न ', 'जिघ्रन् '),
    ('कर्मं', 'कर्तुं'), ('ब्रुवन्न् अपि', 'ब्रुवन्नपि'), ('किंचिन्न्न', 'किंचिन्न'), ('क्व बन्ध ', 'क्व बन्धः '),
    ('मुंचति', 'मुञ्चति'), ('वान्छति', 'वाञ्छति'), ('वांछति', 'वाञ्छति'), ('अहंमान महा', 'अहंमानमहा'),
]
# who speaks each chapter (following Richards)
JANAKA = {2, 7, 12, 13, 14, 19, 20}

def clean(k, raw):
    if k in FIX:
        t = FIX[k]
    else:
        lines = [l.strip() for l in raw.split('\n') if l.strip()]
        lines = [l for l in lines if not re.match(r'^(जनक|अष्टावक्र)\s*उवाच', l)]
        t = ''
        for l in lines:
            l = l.replace(',', '')
            if t.endswith('-'):
                t = t[:-1] + l
            else:
                t = (t + ' ' + l) if t else l
        t = re.sub(r'\s+', ' ', t).strip()
        for a, b in SUB:
            t = t.replace(a, b)
    t = t.replace(' ।', '।').replace(' ॥', '॥')
    # two half-verses, split at the first danda
    if '।' in t:
        a, b = t.split('।', 1)
        halves = [a.strip() + '।', b.strip()]
    else:
        w = t.split(' ')
        m = len(w) // 2
        halves = [' '.join(w[:m]), ' '.join(w[m:])]
    if not halves[1].endswith('॥'):
        halves[1] = halves[1].rstrip('।') + '॥'
    return halves

verses = []
for k in sa:
    c, n = map(int, k.split('.'))
    speaker = 'janaka' if (c in JANAKA or k == '1.1') else 'ashtavakra'
    e = re.sub(r'^(Janaka|Ashtavakra) said:\s*', '', en[k])
    verses.append({'id': k, 'c': c, 'n': n, 'sp': speaker, 'sa': clean(k, sa[k]), 'en': e})
out = {'chapters': {k: {'title': v['title'], 'subtitle': v['subtitle']} for k, v in chap.items()}, 'verses': verses}
json.dump(out, open(OUT, 'w'), ensure_ascii=False, indent=0)
print(len(verses), 'verses')
