# Project Structure Guide

```text
Bookie/
├── assets/
├── css/
├── js/
│   ├── core/
│   ├── engines/
│   ├── plugins/
│   └── steps/
├── docs/
│   ├── architecture/
│   ├── guides/
│   ├── release/
│   ├── roadmap/
│   └── tests/
├── tests/
├── backup/
│   ├── archive/
│   └── releases/
├── legacy/
├── README.md
├── MANIFEST.md
├── CHANGELOG.md
├── ROADMAP.md
├── VERSION.txt
└── index.html
```

실행 경로가 깨질 수 있으므로 런타임 파일(`index.html`, `js/`, `css/`, `assets/`)은 이번 Cleanup에서 이동하지 않아.
