"""Unabhängige Qualitätsprüfung. Teilt keinen Code mit dem Geometrie-Kern.

Aufruf: python check_model.py <auftragsordner>
Liest model.stl + recipe.json, schreibt qc_report.json + preview.png.
Exit-Code 0 nur, wenn keine Prüfung FAIL ist.
"""
import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import trimesh
from matplotlib.patches import PathPatch
from matplotlib.path import Path as MplPath
from shapely.geometry import Point
from shapely.ops import unary_union

BED_MM = 256.0
BED_MARGIN_MM = 5.0
DIM_TOLERANCE_MM = 0.2
THIN_AREA_TOLERANCE_MM2 = 0.5


def check(results, name, passed, measured, threshold, warn=False):
    status = "PASS" if passed else ("WARN" if warn else "FAIL")
    results.append({"check": name, "status": status, "measured": measured, "threshold": threshold})


def cross_section(mesh):
    # Tatsächliche Mitte statt Soll-Dicke: eine falsche Dicke soll FAIL sein, kein Absturz.
    middle = (mesh.bounds[0][2] + mesh.bounds[1][2]) / 2
    section = mesh.section(plane_origin=[0, 0, middle], plane_normal=[0, 0, 1])
    planar, transform = section.to_2D()
    polygons = planar.polygons_full
    # to_2D verschiebt das Koordinatensystem; zurück in Modellkoordinaten.
    from shapely.affinity import affine_transform

    m = np.asarray(transform)
    params = [m[0, 0], m[0, 1], m[1, 0], m[1, 1], m[0, 3], m[1, 3]]
    return unary_union([affine_transform(p, params) for p in polygons])


def thin_area(shape, width):
    """Fläche, die eine Kreisscheibe des Durchmessers `width` nicht erreicht."""
    opened = shape.buffer(-width / 2).buffer(width / 2)
    # 0,1 mm Abtrag trennt echte dünne Stellen von Rundungsresten an Ecken.
    return shape.difference(opened.buffer(0.02)).buffer(-0.1)


def narrow_gap_area(shape, gap):
    closed = shape.buffer(gap / 2).buffer(-gap / 2)
    return closed.difference(shape.buffer(0.02)).buffer(-0.1)


def run(folder):
    folder = Path(folder)
    recipe = json.loads((folder / "recipe.json").read_text(encoding="utf-8"))
    expected = recipe["meta"]["expected"]
    results = []

    mesh = trimesh.load_mesh(folder / "model.stl")
    check(results, "datei_lesbar", len(mesh.faces) > 0, len(mesh.faces), "> 0 Dreiecke")
    check(results, "wasserdicht", bool(mesh.is_watertight), bool(mesh.is_watertight), True)
    check(results, "volumen_positiv", bool(mesh.is_volume) and mesh.volume > 0, round(float(mesh.volume), 1), "> 0 mm³")

    bodies = mesh.split(only_watertight=False)
    check(results, "ein_koerper", len(bodies) == 1, len(bodies), 1)

    size = mesh.bounds[1] - mesh.bounds[0]
    for axis, value, target in (
        ("breite", size[0], expected["widthMm"]),
        ("hoehe", size[1], expected["heightMm"]),
        ("dicke", size[2], expected["thicknessMm"]),
    ):
        check(results, f"mass_{axis}", abs(value - target) <= DIM_TOLERANCE_MM, round(float(value), 2), f"{target} ± {DIM_TOLERANCE_MM}")

    fits = max(size[0], size[1]) <= BED_MM - 2 * BED_MARGIN_MM
    check(results, "druckbereich", fits, [round(float(s), 1) for s in size], f"≤ {BED_MM - 2 * BED_MARGIN_MM} mm")

    shape = cross_section(mesh)

    thin = thin_area(shape, expected["minFeatureMm"])
    check(
        results, "mindeststeg", thin.area <= THIN_AREA_TOLERANCE_MM2, round(thin.area, 2),
        f"Fläche dünner als {expected['minFeatureMm']} mm ≤ {THIN_AREA_TOLERANCE_MM2} mm²",
    )
    gaps = narrow_gap_area(shape, expected["minGapMm"])
    check(
        results, "mindestspalt", gaps.area <= THIN_AREA_TOLERANCE_MM2, round(gaps.area, 2),
        f"Spaltfläche unter {expected['minGapMm']} mm ≤ {THIN_AREA_TOLERANCE_MM2} mm²",
    )

    cx, cy = expected["holeCenterMm"]
    hole_r = expected["holeDiameterMm"] / 2
    hole = Point(cx, cy).buffer(hole_r * 0.95)
    check(results, "oese_loch_frei", not shape.intersects(hole), round(shape.intersection(hole).area, 3), "0 mm²")
    collar = Point(cx, cy).buffer(hole_r + 2.0).difference(Point(cx, cy).buffer(hole_r + 0.05))
    covered = shape.intersection(collar).area / collar.area
    check(results, "oese_wandstaerke", covered >= 0.98, round(covered, 3), "≥ 2 mm Material rundum")

    expected_area = np.pi * (expected["widthMm"] / 2) ** 2
    fill = shape.area / expected_area
    check(results, "materialanteil", 0.12 <= fill <= 0.75, round(fill, 3), "0,12–0,75", warn=True)
    if recipe["meta"]["bridges"]:
        longest = max(b["length"] for b in recipe["meta"]["bridges"])
        check(results, "stege_kurz", longest <= 8.0, round(longest, 2), "≤ 8 mm", warn=True)

    fail = any(r["status"] == "FAIL" for r in results)
    report = {
        "ok": not fail,
        "params": recipe["params"],
        "bridges": len(recipe["meta"]["bridges"]),
        "checks": results,
    }
    (folder / "qc_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    render_preview(shape, thin, gaps, folder / "preview.png", recipe["params"])
    return report


def rings(geometry):
    polys = geometry.geoms if hasattr(geometry, "geoms") else [geometry]
    for poly in polys:
        if poly.geom_type == "Polygon" and not poly.is_empty:
            yield poly


def patch(geometry, **style):
    vertices, codes = [], []
    for poly in rings(geometry):
        for ring in [poly.exterior, *poly.interiors]:
            xy = np.asarray(ring.coords)
            vertices.extend(xy)
            codes.extend([MplPath.MOVETO] + [MplPath.LINETO] * (len(xy) - 2) + [MplPath.CLOSEPOLY])
    return PathPatch(MplPath(vertices, codes), **style) if vertices else None


def render_preview(shape, thin, gaps, target, params):
    fig, ax = plt.subplots(figsize=(6, 6.6), dpi=130)
    ax.add_patch(patch(shape, facecolor="#2b2b2b", edgecolor="none"))
    for overlay, color in ((thin, "#e8362b"), (gaps, "#1c7fe0")):
        artist = patch(overlay, facecolor=color, edgecolor=color, linewidth=0.4)
        if artist:
            ax.add_patch(artist)
    minx, miny, maxx, maxy = shape.bounds
    ax.set_xlim(minx - 2, maxx + 2)
    ax.set_ylim(miny - 2, maxy + 2)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title(f"{params['name']} · {params.get('shape', 'wreath')} · {params['frame']} · {params['diameterMm']} mm", fontsize=9)
    fig.savefig(target, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    outcome = run(sys.argv[1])
    print(json.dumps({"ok": outcome["ok"], "failed": [c["check"] for c in outcome["checks"] if c["status"] != "PASS"]}, ensure_ascii=False))
    sys.exit(0 if outcome["ok"] else 1)
