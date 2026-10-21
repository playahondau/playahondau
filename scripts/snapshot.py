"""Snapshot estático de la temporada para index.html (lo leen los bots de IA, que no ejecutan JS).

Trae de lud-backend los datos de Playa Honda y reescribe el bloque entre
<!--SNAPSHOT:START--> y <!--SNAPSHOT:END--> de index.html. Lo corre .github/workflows/snapshot.yml.
Master no está en lud-backend: no aparece acá.
"""
import json, re, sys, time, urllib.request
from datetime import datetime, timedelta, timezone

BASE = 'https://lud-backend-ld7d.onrender.com/api'
TEAM = 120
# (categoría, fase donde juega Playa Honda). Segunda Rueda: Mayor/Pre Senior/Sub 20 Permanencia, Reserva Título.
PHASES = [('Mayor', 41), ('Reserva', 54), ('Pre Senior', 61), ('Sub 20', 79)]  # Sub 18: sumar cuando exista su fase de Segunda Rueda (la 30 es Primera Rueda)
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
         'septiembre', 'octubre', 'noviembre', 'diciembre']
DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
UPPER = {'XXIII', 'II', 'III', 'OCC', 'UTU', 'TEP'}


def get(path):
    for i in range(4):  # render.com duerme: reintenta
        try:
            with urllib.request.urlopen(BASE + path, timeout=60) as r:
                return json.load(r)
        except Exception:
            time.sleep(5 * (i + 1))
    raise SystemExit('lud-backend no responde: ' + path)


def nice(name):
    return ' '.join(w if w in UPPER else w.capitalize() for w in name.split())


def when(iso):
    d = datetime.fromisoformat(iso)
    return '%s %d de %s, %02d:%02d' % (DIAS[d.weekday()], d.day, MESES[d.month - 1], d.hour, d.minute)


def line(cat, phase):
    ms = get('/phases/%d/matches/?limit=500' % phase)
    st = get('/phases/%d/standings/' % phase)
    mine = [m for m in ms if TEAM in (m['home_team']['id'], m['away_team']['id'])]
    now = datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None)
    done = sorted([m for m in mine if m['status'] == 'finished' and m['home_score'] is not None],
                  key=lambda m: m['date'])
    nxt = sorted([m for m in mine if m['status'] != 'finished' and datetime.fromisoformat(m['date']) >= now],
                 key=lambda m: m['date'])
    parts = []
    pos = next((i + 1 for i, r in enumerate(st) if r['team']['id'] == TEAM), None)
    if pos:
        r = st[pos - 1]
        parts.append('%dº de %d en %s con %d puntos' % (pos, len(st), nice(r['phase_detail']['name']), r['total_points']))
    if done:
        m = done[-1]
        home = m['home_team']['id'] == TEAM
        rival = nice((m['away_team'] if home else m['home_team'])['name'])
        gf, gc = (m['home_score'], m['away_score']) if home else (m['away_score'], m['home_score'])
        res = 'ganó %d-%d a' if gf > gc else 'perdió %d-%d con' if gf < gc else 'empató %d-%d con'
        parts.append('último partido: %s %s (%s)' % (res % (gf, gc), rival, m['round']['name']))
    if nxt:
        m = nxt[0]
        home = m['home_team']['id'] == TEAM
        rival = nice((m['away_team'] if home else m['home_team'])['name'])
        venue = (', en ' + nice(m['venue']['name'])) if m.get('venue') else ''
        parts.append('próximo partido: %s %s, %s%s' % ('vs' if home else 'visitando a', rival, when(m['date']), venue))
    return '    <li><strong>%s</strong>: %s.</li>' % (cat, '; '.join(parts)) if parts else None


def main():
    lines = [l for l in (line(c, p) for c, p in PHASES) if l]
    hoy = datetime.now(timezone(timedelta(hours=-3)))
    block = ('<!--SNAPSHOT:START-->\n'
             '  <h3 class="geo-h3">Temporada 2026 al día <small>(actualizado el %d de %s de %d)</small></h3>\n'
             '  <ul class="geo-snap">\n%s\n  </ul>\n'
             '  <!--SNAPSHOT:END-->') % (hoy.day, MESES[hoy.month - 1], hoy.year, '\n'.join(lines))
    path = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
    s = open(path, encoding='utf-8').read()
    new = re.sub(r'<!--SNAPSHOT:START-->.*?<!--SNAPSHOT:END-->', lambda m: block, s, flags=re.S)
    if new != s:
        open(path, 'w', encoding='utf-8').write(new)
        print('actualizado')
    else:
        print('sin cambios')


if __name__ == '__main__':
    main()
