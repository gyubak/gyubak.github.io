# gyubak.github.io

박규현의 개발 블로그

## 구조

| 대상                       | 위치                                | 머리말                                                             |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| 메인 홈페이지                | `_pages/about.md`                   | `display_name`, `display_name_en`, `demo`, `interests`                       |
| 연구                       | `_projects/<이름>.md`                | `title`, `description`, `stack`, `featured`, `importance`, `period` 등       |
| 연구 노트                   | `_research_notes/<날짜-이름>.md`      | `title`, `date`, `project: <연구 파일 이름>`, `kind: 실험 / 아이디어 / 회고`         |
| Study 카테고리              | `_data/study.yml`                   |                                                                              |
| Study 내용                 | `_posts/YYYY-MM-DD-<이름>.md`        | `title`, `section: basic / applied / review`, `subject`, `tags`              |
| Publications              | `_bibliography/papers.bib`          | BibTeX                                                                       |
| CV · Résumé               | `_data/cv.yml`                      | `resume: true`인 항목에 한해 Résumé 생성                                          |
| 연락처                      | `_data/socials.yml`                 |                                                                              |

- 본문의 `##` 소제목이 왼쪽 목차(CONTENTS)가 됩니다.
- 수식은 `$...$`, `$$...$$` (LaTeX).
- 이미지는 `assets/img/`, 영상은 `assets/video/`에 넣고 `![설명](/assets/img/파일.png)`처럼 씁니다. 움직이는 데모는 GIF보다 mp4가 훨씬 가볍습니다.
- 제목에 `[예시]`가 붙은 파일은 자리표시자입니다. 실제 글이 생기면 지우세요.

## 사이트 구조

- `_config.yml` — 사이트 이름(`title`), 설명, 폰트 등 전체 설정
- `_layouts/`, `_includes/` — 이 사이트 전용 페이지 틀 (메인, 연구, Study, 연구 노트, CV)
- `_sass/_paper.scss` — 디자인(색, 폰트, 간격). `assets/css/main.scss`가 불러옵니다
- `assets/js/paper.js` — 목차, Study 탭, 연구 노트 필터
- `bin/build_cv.py` — `_data/cv.yml`로 `assets/pdf/CV.pdf`, `Resume.pdf` 생성. `_data/cv.yml`이 바뀌면 `.github/workflows/render-cv.yml`이 자동 실행합니다
- `.github/workflows/deploy.yml` — 사이트 빌드와 배포

나머지 레이아웃과 기능은 al-folio 테마 gem(`al_folio_core` 등)에서 옵니다.
