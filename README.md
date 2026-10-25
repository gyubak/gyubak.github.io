# gyubak.github.io

박규현의 연구 포트폴리오와 공부 노트. [al-folio](https://github.com/alshedivat/al-folio) (Jekyll) 위에 종이 톤 디자인을 입혀 만들었습니다.

파일을 고치고 `main`에 push하면 GitHub Actions가 2~3분 안에 사이트를 다시 만들어 배포합니다.

## 글은 어디에 쓰나

| 무엇                      | 어디에                           | 머리말에 적을 것                                                             |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| 메인 소개, 관심 분야      | `_pages/about.md`                | `display_name`, `display_name_en`, `demo`, `interests`                       |
| 연구 (Research)           | `_projects/<이름>.md`            | `title`, `description`, `stack`, `featured`, `importance`, `period` 등       |
| 연구 노트                 | `_research_notes/<날짜-이름>.md` | `title`, `date`, `project: <연구 파일 이름>`, `kind: 실험 / 아이디어 / 회고` |
| Study 글 (기초·응용·리뷰) | `_posts/YYYY-MM-DD-<이름>.md`    | `title`, `section: basic / applied / review`, `subject`, `tags`              |
| Study 과목 목록           | `_data/study.yml`                |                                                                              |
| 논문 (Publications)       | `_bibliography/papers.bib`       | BibTeX                                                                       |
| CV · Résumé               | `_data/cv.yml`                   | `resume: true`인 항목만 Résumé에 들어갑니다                                  |
| 이메일, GitHub 등 연락처  | `_data/socials.yml`              |                                                                              |

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
