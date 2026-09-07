"""Tests für den Projekt-Workspace — besonders das Path-Jail.

Das Jail ist die zentrale Sicherheitsgrenze der CLI: Tool-Argumente kommen bei
agentischer Nutzung vom Modell. Diese Tests sind deshalb keine Formsache.
"""

from __future__ import annotations

import os

import pytest

from yestools.project import DEFAULT_FOLDERS, ProjectContext, ProjectError


class TestInitUndDiscover:
    def test_init_legt_ordner_und_manifest_an(self, tmp_path):
        project = ProjectContext.init(tmp_path / "neu", name="Kunde X")

        assert project.initialized is True
        assert project.name == "Kunde X"
        for folder in DEFAULT_FOLDERS:
            assert (project.root / folder).is_dir()
        assert (project.root / ".yes" / "project.json").is_file()

    def test_init_ist_idempotent(self, tmp_path):
        first = ProjectContext.init(tmp_path / "p")
        (first.root / "html" / "bestand.html").write_text("x", encoding="utf-8")

        second = ProjectContext.init(tmp_path / "p")

        assert (second.root / "html" / "bestand.html").read_text(encoding="utf-8") == "x"

    def test_discover_findet_projekt_aus_unterordner(self, tmp_path):
        project = ProjectContext.init(tmp_path / "p")
        nested = project.root / "html" / "tief"
        nested.mkdir(parents=True)

        found = ProjectContext.discover(nested)

        assert found.root == project.root
        assert found.initialized is True

    def test_discover_ohne_projekt_nutzt_startordner(self, tmp_path):
        found = ProjectContext.discover(tmp_path)

        assert found.initialized is False
        assert found.root == tmp_path.resolve()

    def test_discover_respektiert_env_variable(self, tmp_path, monkeypatch):
        project = ProjectContext.init(tmp_path / "env-projekt")
        monkeypatch.setenv("YESTOOLS_PROJECT", str(project.root))

        assert ProjectContext.discover().root == project.root


class TestPathJail:
    def test_relative_pfade_werden_aufgeloest(self, project):
        assert project.resolve("html/seite.html").is_file()

    @pytest.mark.parametrize(
        "evil",
        [
            "../geheim.txt",
            "../../etc/passwd",
            "html/../../ausbruch.txt",
            "html/../../../tmp/x",
        ],
    )
    def test_ausbruch_nach_oben_wird_abgewiesen(self, project, evil):
        with pytest.raises(ProjectError, match="außerhalb"):
            project.resolve(evil)

    def test_absoluter_pfad_ausserhalb_wird_abgewiesen(self, project):
        with pytest.raises(ProjectError, match="außerhalb"):
            project.resolve("/etc/passwd")

    def test_absoluter_pfad_innerhalb_ist_erlaubt(self, project):
        inside = str(project.root / "html" / "seite.html")

        assert project.resolve(inside).is_file()

    @pytest.mark.skipif(os.name == "nt", reason="Symlinks brauchen Rechte auf Windows")
    def test_symlink_der_nach_aussen_zeigt_wird_abgewiesen(self, project, tmp_path):
        outside = tmp_path / "aussen.txt"
        outside.write_text("geheim", encoding="utf-8")
        (project.root / "link.txt").symlink_to(outside)

        with pytest.raises(ProjectError, match="außerhalb"):
            project.resolve("link.txt")

    def test_nullbyte_wird_abgewiesen(self, project):
        with pytest.raises(ProjectError, match="Null-Byte"):
            project.resolve("html/\x00evil")

    def test_leerer_pfad_wird_abgewiesen(self, project):
        with pytest.raises(ProjectError, match="Leerer Pfad"):
            project.resolve("   ")

    def test_must_exist_meldet_fehlende_datei(self, project):
        with pytest.raises(ProjectError, match="existiert nicht"):
            project.resolve("html/gibtsnicht.html", must_exist=True)


class TestIndex:
    def test_index_klassifiziert_dateitypen(self, project):
        (project.root / "assets" / "bild.webp").write_bytes(b"x")

        entries = {e["path"]: e["kind"] for e in project.index()}

        assert entries["html/seite.html"] == "html"
        assert entries["assets/bild.webp"] == "image"

    def test_index_ignoriert_interne_ordner(self, project):
        (project.root / "node_modules").mkdir()
        (project.root / "node_modules" / "paket.js").write_text("x", encoding="utf-8")

        paths = [e["path"] for e in project.index()]

        assert not any(p.startswith("node_modules/") for p in paths)
        assert not any(p.startswith(".yes/") for p in paths)

    def test_summary_nennt_projekt_und_dateien(self, project):
        summary = project.summary()

        assert "Testprojekt" in summary
        assert "html/seite.html" in summary
