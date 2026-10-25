"""_data/cv.yml 하나로 CV(전체)와 Résumé(선별) PDF를 만든다.

사용법:  python bin/build_cv.py      (pip install "rendercv[full]" pyyaml 필요)
결과:    assets/pdf/CV.pdf, assets/pdf/Resume.pdf
GitHub에서는 _data/cv.yml이 바뀔 때마다 .github/workflows/render-cv.yml이 자동으로 실행한다.
"""
import copy
import pathlib
import subprocess
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_data" / "cv.yml"
OUT = ROOT / "assets" / "pdf"
WORK = ROOT / ".cv-build"


def strip_flags(sections, resume_only):
    """resume 플래그를 정리한다. resume_only면 resume: true 항목만 남긴다."""
    result = {}
    for title, entries in sections.items():
        kept = []
        for entry in entries:
            if isinstance(entry, dict):
                flagged = bool(entry.get("resume", False))
                entry = {k: v for k, v in entry.items() if k != "resume"}
            else:
                flagged = False
            if not resume_only or flagged:
                kept.append(entry)
        if kept:
            result[title] = kept
    return result


def render(data, name):
    WORK.mkdir(exist_ok=True)
    OUT.mkdir(exist_ok=True)
    src = WORK / f"{name}.yaml"
    data = copy.deepcopy(data)
    settings = data.setdefault("settings", {})
    settings["pdf_title"] = f"NAME - {name}"
    settings.setdefault("current_date", "today")
    settings["render_command"] = {
        "output_folder": str(WORK / name),
        "pdf_path": str(OUT / f"{name}.pdf"),
        "dont_generate_png": True,
        "dont_generate_markdown": True,
        "dont_generate_html": True,
    }
    src.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
    subprocess.run(["rendercv", "render", str(src)], check=True)


def main():
    data = yaml.safe_load(SRC.read_text(encoding="utf-8"))
    sections = data["cv"]["sections"]

    cv = copy.deepcopy(data)
    cv["cv"]["sections"] = strip_flags(sections, resume_only=False)
    render(cv, "CV")

    resume = copy.deepcopy(data)
    resume["cv"]["sections"] = strip_flags(sections, resume_only=True)
    render(resume, "Resume")


if __name__ == "__main__":
    sys.exit(main())
