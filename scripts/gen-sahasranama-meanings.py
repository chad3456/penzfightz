"""Regenerate src/sahasranama/meanings.ts from src/sahasranama/source/meanings.txt (number|name|meaning)."""
import json, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
src = os.path.join(root, 'src', 'sahasranama', 'source', 'meanings.txt')
dst = os.path.join(root, 'src', 'sahasranama', 'meanings.ts')
rows = [l.rstrip('\n').split('|', 2) for l in open(src, encoding='utf8') if l.strip()]
assert len(rows) == 1000 and all(int(r[0]) == i + 1 for i, r in enumerate(rows)), 'need 1000 numbered rows, in order'
head = open(dst, encoding='utf8').read().split('export const MEANINGS')[0]
body = 'export const MEANINGS: [string, string][] = [\n' + ''.join('  ' + json.dumps([r[1], r[2]], ensure_ascii=False) + ',\n' for r in rows) + '];\n'
open(dst, 'w', encoding='utf8').write(head + body)
print('wrote', dst)
