"""Fehlereinspeisung: beschädigte Modelle müssen die Prüfung nicht bestehen.

Aufruf: python -m unittest test_check_model  (aus services/qc, QC_GOOD_CASE zeigt auf einen gültigen Auftrag)
"""
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path

import numpy as np
import trimesh

from check_model import run

GOOD = Path(os.environ["QC_GOOD_CASE"])


class FaultInjection(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        for name in ("model.stl", "recipe.json"):
            shutil.copy(GOOD / name, self.dir / name)
        self.mesh = trimesh.load_mesh(self.dir / "model.stl")

    def tearDown(self):
        shutil.rmtree(self.dir)

    def failed(self):
        return {c["check"] for c in run(self.dir)["checks"] if c["status"] == "FAIL"}

    def save(self, mesh):
        mesh.export(self.dir / "model.stl")

    def test_gutes_modell_besteht(self):
        self.assertEqual(self.failed(), set())

    def test_loch_im_netz(self):
        self.save(trimesh.Trimesh(self.mesh.vertices, self.mesh.faces[:-40], process=False))
        self.assertIn("wasserdicht", self.failed())

    def test_loses_teil(self):
        loose = trimesh.creation.box(extents=[3, 3, 3])
        loose.apply_translation([0, 0, 1.5])
        self.save(trimesh.util.concatenate([self.mesh, loose]))
        self.assertIn("ein_koerper", self.failed())

    def test_falsche_groesse(self):
        self.mesh.apply_scale([1.1, 1.1, 1.0])
        self.save(self.mesh)
        self.assertIn("mass_breite", self.failed())

    def test_falsche_dicke(self):
        self.mesh.apply_scale([1.0, 1.0, 0.5])
        self.save(self.mesh)
        self.assertIn("mass_dicke", self.failed())

    def test_zu_gross_fuer_drucker(self):
        recipe = json.loads((self.dir / "recipe.json").read_text(encoding="utf-8"))
        recipe["meta"]["expected"]["widthMm"] = 800
        recipe["meta"]["expected"]["heightMm"] = 800
        (self.dir / "recipe.json").write_text(json.dumps(recipe), encoding="utf-8")
        self.mesh.apply_scale([10.0, 10.0, 1.0])
        self.save(self.mesh)
        self.assertIn("druckbereich", self.failed())

    def test_oesenloch_zu(self):
        recipe = json.loads((self.dir / "recipe.json").read_text(encoding="utf-8"))
        recipe["meta"]["expected"]["holeCenterMm"] = [0, 0]  # dort liegt Material
        (self.dir / "recipe.json").write_text(json.dumps(recipe), encoding="utf-8")
        self.assertIn("oese_loch_frei", self.failed())

    def test_zu_duenne_stege(self):
        recipe = json.loads((self.dir / "recipe.json").read_text(encoding="utf-8"))
        recipe["meta"]["expected"]["minFeatureMm"] = 6.0
        (self.dir / "recipe.json").write_text(json.dumps(recipe), encoding="utf-8")
        self.assertIn("mindeststeg", self.failed())

    def test_kaputte_datei(self):
        (self.dir / "model.stl").write_bytes(b"keine stl-datei")
        with self.assertRaises(Exception):
            run(self.dir)


if __name__ == "__main__":
    unittest.main()
