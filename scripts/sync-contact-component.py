"""Embed the shared contact template without changing other page markup."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
component = (root / 'components/contact-tools.html').read_text()
pattern = re.compile(r'<!-- Shared enquiry dialog\.[\s\S]*?</aside>(?=\s*<script src="assets/(?:direct-enquiry|contact-tools)\.js)')
for page in sorted(root.glob('*.html')):
    original = page.read_text()
    updated, count = pattern.subn(lambda _: component.rstrip(), original)
    if count != 1:
        raise RuntimeError(f'{page.name}: expected one shared contact component, got {count}')
    updated = updated.replace('assets/contact-tools.css?v=1', 'assets/contact-tools.css?v=2')
    updated = updated.replace('assets/contact-tools.js?v=1', 'assets/contact-tools.js?v=2')
    if 'src="assets/direct-enquiry.js' not in updated:
        updated = updated.replace('<script src="assets/contact-tools.js', '<script src="assets/direct-enquiry.js?v=1" defer></script>\n<script src="assets/contact-tools.js')
    if updated != original:
        page.write_text(updated)
