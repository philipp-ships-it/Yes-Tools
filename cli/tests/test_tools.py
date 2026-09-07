"""Tests für die Werkzeuge und die Registry."""

from __future__ import annotations

import pytest

from yestools import htmlfmt
from yestools.registry import all_tools, call_tool, get_tool, manifest, openai_tools
from yestools.schemas import ToolError


class TestRegistry:
    def test_tool_namen_sind_eindeutig(self):
        names = [spec.name for spec in all_tools()]

        assert len(names) == len(set(names))

    def test_jedes_tool_hat_handler_und_beschreibung(self):
        for spec in all_tools():
            assert spec.handler is not None, spec.name
            assert len(spec.description) > 20, spec.name
            assert spec.category, spec.name

    def test_openai_schemas_deckungsgleich_mit_registry(self):
        assert len(openai_tools()) == len(all_tools())

    def test_manifest_enthaelt_aufrufbeispiel_je_tool(self):
        data = manifest()

        assert data["version"] == 1
        assert len(data["tools"]) == len(all_tools())
        assert all(entry["cli"].startswith("yestools run ") for entry in data["tools"])

    def test_unbekanntes_tool_wirft(self):
        with pytest.raises(ToolError, match="Unbekanntes Tool"):
            get_tool("gibt_es_nicht")

    def test_call_tool_kapselt_fehler_statt_zu_werfen(self, project):
        # Ein Agent im Loop soll aus dem Fehler lernen können, nicht abbrechen.
        result = call_tool("html_analyze", {"path": "fehlt.html"}, project=project)

        assert result.ok is False
        assert "existiert nicht" in (result.error or "")

    def test_call_tool_validiert_argumente(self, project):
        result = call_tool("html_beautify", {"unbekannt": 1}, project=project)

        assert result.ok is False
        assert "Unbekannte Parameter" in (result.error or "")


class TestHtmlFormatierer:
    def test_beautify_ruecke_verschachtelung_ein(self):
        out = htmlfmt.beautify("<div><p>Hallo</p></div>")

        assert out.splitlines()[0] == "<div>"
        assert out.splitlines()[1].startswith("  <p>")

    def test_beautify_haelt_inline_elemente_in_einer_zeile(self):
        out = htmlfmt.beautify("<p>Text mit <strong>fett</strong> drin</p>")

        assert "<strong>fett</strong>" in out
        assert len([line for line in out.splitlines() if "fett" in line]) == 1

    def test_beautify_laesst_mso_conditional_comment_unveraendert(self):
        source = '<div><!--[if mso]><table><tr><td>O</td></tr></table><![endif]--></div>'

        out = htmlfmt.beautify(source)

        assert "<!--[if mso]><table><tr><td>O</td></tr></table><![endif]-->" in out
        # Einzeiliger Block darf die Einrückung des Folgeelements nicht verschieben.
        assert out.splitlines()[-1] == "</div>"

    def test_beautify_bewahrt_pre_inhalt(self):
        out = htmlfmt.beautify("<div><pre>  roh\n  bleibt</pre></div>")

        assert "  roh" in out

    def test_beautify_ist_robust_gegen_kaputtes_html(self):
        assert isinstance(htmlfmt.beautify("<div><span>offen"), str)

    def test_beautify_leere_eingabe(self):
        assert htmlfmt.beautify("") == ""

    def test_minify_entfernt_whitespace_zwischen_tags(self):
        out = htmlfmt.minify("<div>\n  <p>x</p>\n</div>")

        assert out == "<div><p>x</p></div>"

    def test_minify_behaelt_mso_kommentar_auch_bei_strip_comments(self):
        source = "<div><!-- normal --><!--[if mso]><i>x</i><![endif]--></div>"

        out = htmlfmt.minify(source, strip_comments=True)

        assert "normal" not in out
        assert "[if mso]" in out

    def test_minify_bewahrt_script_inhalt(self):
        out = htmlfmt.minify("<script>const a = {  b:1 };</script>")

        assert "const a = {  b:1 };" in out

    def test_strip_tags_liefert_reinen_text(self):
        text = htmlfmt.strip_tags("<p>Hallo <b>Welt</b></p><script>ignoriert()</script>")

        assert "Hallo" in text and "Welt" in text
        assert "ignoriert" not in text


class TestHtmlTools:
    def test_analyze_findet_fehlende_alt_texte_und_zweite_h1(self, project):
        result = call_tool("html_analyze", {"path": "html/seite.html"}, project=project)

        assert result.ok
        assert result.data["images"] == 2
        assert result.data["images_without_alt"] == 1
        assert result.data["links_external"] == 1
        assert result.data["meta"]["viewport"] is True

    def test_analyze_akzeptiert_inline_html(self, project):
        result = call_tool("html_analyze", {"html": "<html><body><h1>A</h1></body></html>"}, project=project)

        assert result.ok
        assert "keine Meta-Description" in result.data["findings"]

    def test_analyze_lehnt_beide_quellen_gleichzeitig_ab(self, project):
        result = call_tool(
            "html_analyze", {"html": "<p>x</p>", "path": "html/seite.html"}, project=project
        )

        assert result.ok is False
        assert "nicht beides" in (result.error or "")

    def test_beautify_schreibt_datei_nur_mit_out_path(self, project):
        without = call_tool("html_beautify", {"html": "<p>x</p>"}, project=project)
        with_out = call_tool(
            "html_beautify", {"html": "<p>x</p>", "out_path": "output/schoen.html"}, project=project
        )

        assert without.artifacts == []
        assert with_out.artifacts == ["output/schoen.html"]
        assert (project.root / "output" / "schoen.html").is_file()

    def test_extract_text_zaehlt_woerter(self, project):
        result = call_tool("html_extract_text", {"path": "html/seite.html"}, project=project)

        assert result.ok
        assert result.data["words"] > 0

    def test_svg_optimize_entfernt_kommentare(self, project):
        result = call_tool(
            "svg_optimize", {"svg": "<svg><!-- weg --><rect/></svg>"}, project=project
        )

        assert "weg" not in result.data["svg"]


class TestTextTools:
    def test_encoding_fix_repariert_mojibake(self, project):
        result = call_tool(
            "fix_text_encoding", {"text": "GrÃ¼ÃŸe aus MÃ¼nchen"}, project=project
        )

        assert result.ok
        assert result.data["text"] == "Grüße aus München"
        assert result.data["changed"] is True

    def test_encoding_fix_laesst_sauberen_text_unveraendert(self, project):
        result = call_tool("fix_text_encoding", {"text": "Grüße"}, project=project)

        assert result.data["text"] == "Grüße"
        assert result.data["changed"] is False

    def test_diff_markiert_hinzugefuegte_und_entfernte_zeilen(self, project):
        result = call_tool(
            "text_diff", {"original": "a\nb\nc", "updated": "a\nx\nc"}, project=project
        )

        assert "-b" in result.data["unified_diff"]
        assert "+x" in result.data["unified_diff"]
        assert result.data["lines_added"] == 1
        assert result.data["lines_removed"] == 1

    def test_diff_erkennt_identische_texte(self, project):
        result = call_tool("text_diff", {"original": "a", "updated": "a"}, project=project)

        assert result.data["unified_diff"] == ""
        assert "identisch" in result.summary

    def test_hyphenate_setzt_weiche_trennstellen(self, project):
        pytest.importorskip("pyphen")

        result = call_tool(
            "text_hyphenate", {"text": "Silbentrennung"}, project=project
        )

        assert result.ok
        assert "&shy;" in result.data["text"]

    def test_hyphenate_unicode_modus(self, project):
        pytest.importorskip("pyphen")

        result = call_tool(
            "text_hyphenate", {"text": "Silbentrennung", "output": "unicode"}, project=project
        )

        assert "­" in result.data["text"]


class TestWordTools:
    def test_extract_text_liest_absaetze(self, project, docx_file):
        result = call_tool("word_extract_text", {"path": "documents/brief.docx"}, project=project)

        assert result.ok
        assert "Überschrift" in result.data["text"]
        assert "äöüß" in result.data["text"]
        assert result.data["paragraphs"] >= 3

    def test_extract_images_schreibt_nach_assets(self, project, docx_file):
        result = call_tool("word_extract_images", {"path": "documents/brief.docx"}, project=project)

        assert result.ok
        assert result.data["count"] == 1
        assert result.artifacts[0].startswith("assets/brief/")
        assert (project.root / result.artifacts[0]).is_file()

    def test_extract_text_lehnt_nicht_docx_ab(self, project):
        result = call_tool("word_extract_text", {"path": "html/seite.html"}, project=project)

        assert result.ok is False
        assert "keine .docx" in (result.error or "")

    def test_word_to_html_erzeugt_semantisches_html(self, project, docx_file):
        pytest.importorskip("mammoth")

        result = call_tool(
            "word_to_html",
            {"path": "documents/brief.docx", "out_path": "html/brief.html"},
            project=project,
        )

        assert result.ok
        assert "<h1>" in result.data["html"]
        assert (project.root / "html" / "brief.html").is_file()


class TestImageTools:
    def test_convert_nach_webp_verkleinert(self, project):
        PIL = pytest.importorskip("PIL.Image")
        source = project.root / "assets" / "gross.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        PIL.new("RGB", (1200, 600), (200, 30, 30)).save(source)

        result = call_tool(
            "image_convert",
            {"path": "assets/gross.png", "max_width": 400, "format": "webp"},
            project=project,
        )

        assert result.ok
        assert result.data["size_after"] == [400, 200]
        assert (project.root / result.artifacts[0]).is_file()

    def test_info_liest_abmessungen(self, project):
        PIL = pytest.importorskip("PIL.Image")
        source = project.root / "assets" / "info.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        PIL.new("RGB", (64, 32)).save(source)

        result = call_tool("image_info", {"path": "assets/info.png"}, project=project)

        assert result.data["width"] == 64 and result.data["height"] == 32


class TestProjectTools:
    def test_index_listet_dateien_und_typen(self, project):
        result = call_tool("project_index", {}, project=project)

        assert result.ok
        assert result.data["by_kind"]["html"] >= 1

    def test_index_filtert_nach_typ(self, project):
        result = call_tool("project_index", {"kind": "html"}, project=project)

        assert all(entry["kind"] == "html" for entry in result.data["files"])

    def test_read_file_liest_text(self, project):
        result = call_tool("project_read_file", {"path": "html/seite.html"}, project=project)

        assert result.ok
        assert "<h1>Titel</h1>" in result.data["content"]

    def test_read_file_lehnt_binaerformat_ab(self, project, docx_file):
        result = call_tool("project_read_file", {"path": "documents/brief.docx"}, project=project)

        assert result.ok is False
        assert "word_extract_text" in (result.error or "")

    def test_read_file_schneidet_bei_max_bytes_ab(self, project):
        (project.root / "html" / "lang.html").write_text("x" * 5000, encoding="utf-8")

        result = call_tool(
            "project_read_file", {"path": "html/lang.html", "max_bytes": 100}, project=project
        )

        assert result.data["truncated"] is True
        assert len(result.data["content"]) == 100

    def test_write_file_schreibt_neue_datei(self, project):
        result = call_tool(
            "project_write_file",
            {"path": "output/neu.html", "content": "<p>neu</p>"},
            project=project,
        )

        assert result.ok
        assert (project.root / "output" / "neu.html").read_text(encoding="utf-8") == "<p>neu</p>"

    def test_write_file_ueberschreibt_nicht_ohne_flag(self, project):
        call_tool("project_write_file", {"path": "output/x.txt", "content": "alt"}, project=project)

        result = call_tool(
            "project_write_file", {"path": "output/x.txt", "content": "neu"}, project=project
        )

        assert result.ok is False
        assert "overwrite" in (result.error or "")
        assert (project.root / "output" / "x.txt").read_text(encoding="utf-8") == "alt"

    def test_write_file_ueberschreibt_mit_flag(self, project):
        call_tool("project_write_file", {"path": "output/y.txt", "content": "alt"}, project=project)

        result = call_tool(
            "project_write_file",
            {"path": "output/y.txt", "content": "neu", "overwrite": True},
            project=project,
        )

        assert result.ok
        assert (project.root / "output" / "y.txt").read_text(encoding="utf-8") == "neu"

    def test_write_file_kann_nicht_aus_projekt_ausbrechen(self, project, tmp_path):
        result = call_tool(
            "project_write_file",
            {"path": "../ausbruch.txt", "content": "böse"},
            project=project,
        )

        assert result.ok is False
        assert not (tmp_path / "ausbruch.txt").exists()
