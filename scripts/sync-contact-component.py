"""Embed the shared contact template without changing other page markup."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
component = (root / 'components/contact-tools.html').read_text()
pattern = re.compile(r'<!-- Shared enquiry dialog\.[\s\S]*?</aside>(?=\s*<script src="assets/contact-tools\.js)')
for page in sorted(root.glob('*.html')):
    original = page.read_text()
    updated, count = pattern.subn(lambda _: component.rstrip(), original)
    if count != 1:
        raise RuntimeError(f'{page.name}: expected one shared contact component, got {count}')
    if updated != original:
        page.write_text(updated)
