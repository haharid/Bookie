/* EPUB 내부 board.css 자동 삽입용. css/board.css와 같은 내용입니다. */
const BOARD_CSS = `@charset "utf-8";
/* Styles for css */

    .bb,
    .bb p,
    .bb div,
    .bb strong {
      text-indent: 0 !important;
      word-break: normal;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* 전체 */

    .bb {
      display: block;
      margin: 1.5em 0.25em;
      padding: 0.5em;

      color: #35323b;
      font-size: 0.92em;
      line-height: 1.65;
      text-align: left;

      background-color: #ffffff;
      border: 1px solid #c7bed5;

      overflow: visible;

      page-break-before: auto;
      page-break-after: auto;
      page-break-inside: auto;

      break-before: auto;
      break-after: auto;
      break-inside: auto;

      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
    }

    .bb p {
      display: block;
      margin: 0;
      padding: 0;

      color: inherit;
      font-size: 1em;
      line-height: inherit;

      overflow: visible;
    }

    /* 게시판명 */

    .bb-n {
      padding: 0.35em 0.5em !important;

      color: #776493 !important;
      font-size: 0.74em !important;
      font-weight: bold;

      background-color: #faf8fc;
      border-top: 0.18em solid #8d7aae;
      border-bottom: 1px solid #ded7e7;

      page-break-after: avoid;
      break-after: avoid;
    }

    /* 제목 전용 칸 */

    .bb-t {
      padding: 0.65em 0.55em !important;

      color: #302a3a !important;
      font-size: 1.1em !important;
      font-weight: bold;
      line-height: 1.5 !important;

      background-color: #f0ebf6;
      border-left: 0.2em solid #9a86b7;
      border-bottom: 1px solid #d2c7de;

      page-break-inside: avoid;
      page-break-after: avoid;

      break-inside: avoid;
      break-after: avoid;
    }
    
.bb > .bb-t:first-child {
  border-top: 0.18em solid #8d7aae;
  border-left: 0;
}

    /* 작성자 전용 칸 */

    .bb-a {
      padding: 0.35em 0.5em !important;

      color: #8e8399 !important;
      font-size: 0.74em !important;
      text-align: right;

      background-color: #faf9fb;
      border-bottom: 1px solid #ded9e4;

      page-break-inside: avoid;
      page-break-after: avoid;

      break-inside: avoid;
      break-after: avoid;
    }

    /* 본문 */

    .bb-c {
      display: block;
      padding: 0.85em 0.6em 1em 0.6em;

      background-color: #fffefe;
      border-bottom: 1px solid #d5cfdd;

      overflow: visible;

      page-break-inside: auto;
      break-inside: auto;
    }

    .bb-c p {
      margin: 0.45em 0 !important;

      color: #37333d !important;
      font-size: 1em !important;
      line-height: 1.75 !important;

      page-break-inside: auto;
      break-inside: auto;
    }

    /* 댓글 전체 */

    .bb-list {
      display: block;

      background-color: #f7fafc;

      overflow: visible;

      page-break-inside: auto;
      break-inside: auto;
    }

    /* 댓글 또는 댓글(12) */

    .bb-count {
      padding: 0.5em 0.65em !important;

      color: #58758d !important;
      font-size: 0.82em !important;
      font-weight: bold;

      background-color: #e8f2f8;
      border-bottom: 1px solid #c6dae7;

      page-break-after: avoid;
      break-after: avoid;
    }

    /* 일반 댓글 */

    .bb-m {
      padding: 0.68em 0.55em !important;

      color: #48434f !important;
      font-size: 0.94em !important;
      line-height: 1.6 !important;

      background-color: #fbfdfe;
      border-bottom: 1px dotted #d3d8dd;

      overflow: visible;

      page-break-inside: auto;
      break-inside: auto;
    }

    .bb-m strong {
      margin-right: 0.45em;

      color: #587b99;
      font-size: 0.86em;
      font-weight: bold;
    }

    /* 대댓글
       화살표는 CSS에 없으며 본문에 직접 입력 */

    .bb-r {
      margin-left: 1em !important;
      padding: 0.62em 0.5em !important;

      color: #59545f !important;
      font-size: 0.92em !important;
      line-height: 1.6 !important;

      background-color: #edf3f7;
      border-left: 0.18em solid #99b5c9;
      border-bottom: 1px dotted #d1dbe2;

      overflow: visible;

      page-break-inside: auto;
      break-inside: auto;
    }

    .bb-r strong {
      margin-right: 0.45em;

      color: #58778f;
      font-size: 0.86em;
      font-weight: bold;
    }
    
    
  /* 기사 */

    .news-simple {
      display: block;
      margin: 0.9em 0.3em;
      padding: 0.7em;
      border: 0.08em solid #cfd6df;
      color: #222222;
      background: #ffffff;
      font-size: 0.92em;
    }

    .news-simple-title {
      margin: 0;
      padding: 0 0 0.5em 0;
      border-bottom: 0.18em solid #315f9b;
      color: #111111;
      font-size: 1.1em;
      font-weight: bold;
      line-height: 1.4;
      text-align: left;
      text-indent: 0;
      page-break-after: avoid;
    }

    .news-simple-body {
      display: block;
      margin: 0.7em 0 0 0;
      padding: 0;
    }

    .news-simple-body p {
      margin: 0.55em 0;
      padding: 0;
      color: #292929;
      font-size: 1em;
      font-weight: normal;
      line-height: 1.7;
      text-align: justify;
      text-indent: 0;
    }

    .news-simple-reporter {
      margin: 0.9em 0 0 0;
      padding: 0.5em 0 0 0;
      border-top: 0.08em solid #dedede;
      color: #777777;
      font-size: 0.74em;
      line-height: 1.6;
      text-align: right;
      text-indent: 0;
    }

    .news-simple-reporter strong {
      color: #444444;
    }


    /* 제목들만 나열 */

    .news-list {
      display: block;
      margin: 0.9em 0.3em;
      padding: 0.7em;
      border: 0.08em solid #cfd6df;
      color: #222222;
      background: #ffffff;
      font-size: 0.92em;
    }

    .news-list-head {
      margin: 0;
      padding: 0 0 0.4em 0;
      border-bottom: 0.18em solid #315f9b;
      color: #315f9b;
      font-size: 0.74em;
      font-weight: bold;
      line-height: 1.4;
      text-align: left;
      text-indent: 0;
    }

    .news-headline {
      display: block;
      margin: 0;
      padding: 0.58em 0.15em;
      border-bottom: 0.08em solid #dedede;
      color: #222222;
      font-size: 1.1em;
      font-weight: bold;
      line-height: 1.45;
      text-align: left;
      text-indent: 0;
      page-break-inside: avoid;
    }

    .news-headline-point {
      display: inline;
      margin-right: 0.35em;
      color: #315f9b;
      font-size: 0.75em;
      font-weight: bold;
    }

`;
