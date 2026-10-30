"""Build the self-contained local arcade archive using only Python's standard library."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
output = root / "downloads" / "offllinecodebbase.zip"
excluded = {".git", "node_modules", "__pycache__", "uploads"}
files = sorted(path for path in root.rglob("*") if path.is_file()
               and not any(part in excluded for part in path.relative_to(root).parts)
               and path.suffix.lower() != ".zip")
with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for path in files:
        archive.write(path, "CardArcade/" + path.relative_to(root).as_posix())
with ZipFile(output) as archive:
    assert archive.testzip() is None, "Archive failed its CRC check"
    names = set(archive.namelist())
    for required in ["index.html", "demo.html", "LOCAL-README.txt", "js/animations.js",
                     "vendor/chess.js", "js/board-ai.js", "js/board-worker.js",
                     "js/classic-levels.js", "js/demo-history.js", "page-themes.css", "js/page-themes.js", "duel-screen.css",
                     "ordinary/catalog-tools.js", "ordinary/cards-creature.json"]:
        assert "CardArcade/" + required in names, "Missing " + required
print(f"Packaged {len(files)} files in {output.relative_to(root)} ({output.stat().st_size:,} bytes)")
