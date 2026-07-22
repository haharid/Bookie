/* EPUB 내부 sns.css 자동 삽입용. css/sns.css와 같은 내용입니다. */
const SNS_CSS = `/* =========================================
   RIDI SNS 공통
   Instagram / X
   Maximum / Mini
   ========================================= */

.snsbox,
.snsbox * {
  box-sizing: border-box;
}

.snsbox {
  width: 100%;
  max-width: none;
  height: auto;
  min-height: 0;
  max-height: none;
  margin: 1.5em 0;
  padding: 0.5em;
  overflow: visible;

  background: #ffffff;
  color: #0f1419;

  font-family: Arial, sans-serif;
  font-size: 0.75em;
  line-height: 1.5;

  text-align: left;
  text-indent: 0;

  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;

  border-radius: 0.85em;
  box-shadow: none;

  page-break-before: auto;
  page-break-after: auto;
  page-break-inside: auto;

  break-before: auto;
  break-after: auto;
  break-inside: auto;

  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  -webkit-text-size-adjust: 100%;
}

/* 인스타 외곽선 */

.snsbox.sns-ig {
  border: 1px solid #833ab4;
}

/* X 외곽선 */

.snsbox.sns-x {
  border: 1px solid #cfd9de;
  border-top: 0.24em solid #0f1419;
  border-radius: 0.45em;
}

/* 기존 본문 p 스타일 초기화 */

.snsbox p {
  display: block;
  width: auto;
  max-width: none;
  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0;
  padding: 0;
  overflow: visible;

  color: inherit;
  font: inherit;
  line-height: inherit;

  text-align: left;
  text-indent: 0;

  white-space: normal;
  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;

  orphans: 1;
  widows: 1;

  page-break-inside: auto;
  break-inside: auto;
}

/* =========================================
   상단 사용자 정보
   ========================================= */

.snsbox .sns-head {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;

  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;

  width: 100%;
  height: auto;
  min-height: 0;
  max-height: none;

  padding: 0.3em 0.25em 0.65em;
  overflow: visible;

  page-break-inside: avoid;
  page-break-after: avoid;

  break-inside: avoid;
  break-after: avoid;
}

/* 프로필 사진 */

.snsbox .sns-avatar {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;

  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;

  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;

  width: 3em;
  height: 3em;

  -webkit-box-flex: 0;
  -webkit-flex: 0 0 3em;
  flex: 0 0 3em;

  margin-right: 0.65em;
  border-radius: 50%;

  font-size: 1em;
  font-weight: 700;
  line-height: 1;

  text-align: center;
  text-indent: 0;
}

/* 인스타 프로필 */

.sns-ig .sns-avatar {
  border: 0.15em solid #ffffff;

  background: #c13584;
  background:
    -webkit-linear-gradient(
      135deg,
      #feda75,
      #fa7e1e 28%,
      #d62976 57%,
      #962fbf 78%,
      #4f5bd5
    );
  background:
    linear-gradient(
      135deg,
      #feda75,
      #fa7e1e 28%,
      #d62976 57%,
      #962fbf 78%,
      #4f5bd5
    );

  color: #ffffff;
}

/* 인스타 게시물용 카메라 표시 */

.sns-ig .sns-ig-icon {
  position: relative;
  color: transparent;
  text-indent: 0;
}

.sns-ig .sns-ig-icon::before {
  content: "";

  position: absolute;
  top: 50%;
  left: 50%;

  width: 1.35em;
  height: 1.35em;

  margin-top: -0.78em;
  margin-left: -0.78em;

  border: 0.13em solid #ffffff;
  border-radius: 0.38em;
}

.sns-ig .sns-ig-icon::after {
  content: "";

  position: absolute;
  top: 50%;
  left: 50%;

  width: 0.43em;
  height: 0.43em;

  margin-top: -0.28em;
  margin-left: -0.28em;

  border: 0.12em solid #ffffff;
  border-radius: 50%;

  box-shadow: 0.43em -0.43em 0 -0.15em #ffffff;
}

/* X 프로필 */

.sns-x .sns-avatar {
  background: #0f1419;
  color: #ffffff;
}

/* 미니 프로필 크기 */

.snsbox.sns-mini .sns-avatar {
  width: 2.5em;
  height: 2.5em;

  -webkit-flex-basis: 2.5em;
  flex-basis: 2.5em;
}

/* 사용자명 영역 */

.snsbox .sns-user {
  display: block;

  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  flex: 1 1 auto;

  min-width: 0;
  overflow: visible;
}

.snsbox .sns-name {
  display: block;

  margin: 0;
  padding: 0;

  color: inherit;

  font-size: 1em;
  font-weight: 700;
  line-height: 1.3;

  text-indent: 0;
}

.snsbox .sns-sub {
  display: block;

  margin-top: 0.1em;

  color: #737373;

  font-size: 1em;
  font-weight: 400;
  line-height: 1.3;

  text-indent: 0;
}

.sns-x .sns-sub {
  color: #536471;
}

/* 인증 표시 */

.snsbox .sns-verified {
  color: #1d9bf0;
  font-weight: 700;
}

/* 팔로우 */

.snsbox .sns-follow {
  display: block;

  margin-left: 0.55em;

  color: #0095f6;

  font-size: 1em;
  font-weight: 700;
  line-height: 1.3;

  white-space: nowrap;
  text-indent: 0;
}

/* 더보기 */

.snsbox .sns-more {
  display: block;

  margin-left: 0.55em;

  color: inherit;

  font-size: 1.25em;
  font-weight: 700;
  line-height: 1;

  white-space: nowrap;
  text-indent: 0;
}

/* =========================================
   게시물 이미지
   ========================================= */

.snsbox .sns-media {
  display: block;

  width: 100%;
  max-width: none;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0;
  overflow: visible;

  border: 1px solid #dbdbdb;
  border-radius: 0.4em;

  text-align: center;
  text-indent: 0;

  page-break-inside: avoid;
  break-inside: avoid;
}

.snsbox .sns-media-placeholder {
  padding: 5.5em 0.5em;

  color: #ffffff;

  font-size: 1em;
  font-weight: 700;
  line-height: 1.3;
}

.sns-ig .sns-media-placeholder {
  background: #833ab4;
  background:
    -webkit-linear-gradient(
      135deg,
      #4f9de8,
      #c69cf4 55%,
      #f5b58c
    );
  background:
    linear-gradient(
      135deg,
      #4f9de8,
      #c69cf4 55%,
      #f5b58c
    );
}

.sns-x .sns-media-placeholder {
  background: #1d9bf0;
  background:
    -webkit-linear-gradient(
      135deg,
      #1d9bf0,
      #655bea 55%,
      #a855f7
    );
  background:
    linear-gradient(
      135deg,
      #1d9bf0,
      #655bea 55%,
      #a855f7
    );
}

/* 실제 이미지 */

.snsbox .sns-media img {
  display: block;

  width: 100%;
  max-width: 100%;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0;
  padding: 0;

  border: 0;
}

/* =========================================
   맥시멈 아이콘과 통계
   ========================================= */

.snsbox .sns-actions {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;

  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;

  width: 100%;

  padding: 0.55em 0.2em 0.35em;
  overflow: visible;

  color: inherit;

  page-break-inside: avoid;
  break-inside: avoid;
}

.snsbox .sns-action {
  display: block;

  margin-right: 1em;

  font-size: 1.2em;
  line-height: 1;

  white-space: nowrap;
  text-indent: 0;
}

.snsbox .sns-action-last {
  margin-right: 0;
  margin-left: auto;
}

.sns-x .sns-actions {
  color: #536471;
}

.sns-x .sns-action {
  font-size: 1em;
}

.snsbox .sns-meta {
  display: block;

  padding: 0.2em 0.35em 0.45em;

  color: inherit;

  font-size: 1em;
  font-weight: 700;
  line-height: 1.4;

  text-indent: 0;

  page-break-after: avoid;
  break-after: avoid;
}

/* =========================================
   게시물 본문
   ========================================= */

.snsbox .sns-content {
  display: block;

  width: 100%;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0;
  padding: 0.65em 0.35em;
  overflow: visible;

  border-top: 1px solid #d8bee9;

  page-break-inside: auto;
  break-inside: auto;
}

.sns-x .sns-content {
  border-top-color: #cfd9de;
}

.snsbox .sns-content p {
  font-size: 1em;
  line-height: 1.55;
}

.snsbox .sns-content strong {
  font-weight: 700;
}

.snsbox .sns-tag {
  color: #1d6fa5;
}

/* =========================================
   댓글
   ========================================= */

.snsbox .sns-comments {
  display: block;

  width: 100%;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0;
  padding: 0.65em 0.35em 0.25em;
  overflow: visible;

  border-top: 1px solid #d8bee9;

  page-break-inside: auto;
  break-inside: auto;
}

.sns-x .sns-comments {
  border-top-color: #cfd9de;
}

.snsbox .sns-comment-count {
  display: block;

  margin: 0 0 0.4em;

  color: #737373;

  font-size: 1em;
  line-height: 1.4;

  text-indent: 0;

  page-break-after: avoid;
  break-after: avoid;
}

.snsbox .sns-comment {
  display: block;

  width: 100%;

  margin: 0.35em 0;
  overflow: visible;

  font-size: 1em;
  line-height: 1.5;

  page-break-inside: auto;
  break-inside: auto;
}

.snsbox .sns-comment strong {
  margin-right: 0.35em;
  font-weight: 700;
}

.snsbox .sns-comment-heart {
  color: #737373;
  white-space: nowrap;
}

/* 게시 시각 */

.snsbox .sns-time {
  display: block;

  padding: 0.35em;

  color: #8e8e8e;

  font-size: 1em;
  line-height: 1.3;

  text-indent: 0;

  page-break-before: avoid;
  break-before: avoid;
}

/* =========================================
   X 타래
   ========================================= */

.snsbox .sns-thread {
  display: block;

  width: 100%;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0;
  padding: 0.65em 0.35em 0.2em;
  overflow: visible;

  border-top: 1px solid #cfd9de;

  page-break-inside: auto;
  break-inside: auto;
}

.snsbox .sns-thread-item {
  display: block;

  width: auto;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0 0 0.65em 0.35em;
  padding: 0 0 0.15em 0.75em;
  overflow: visible;

  border-left: 0.18em solid #cfd9de;

  page-break-inside: auto;
  break-inside: auto;
}

.snsbox .sns-thread-name {
  display: block;

  margin-bottom: 0.2em;

  color: #0f1419;

  font-size: 1em;
  font-weight: 700;
  line-height: 1.3;

  text-indent: 0;

  page-break-after: avoid;
  break-after: avoid;
}

.snsbox .sns-thread-handle {
  color: #536471;
  font-weight: 400;
}

.snsbox .sns-thread-item p {
  font-size: 1em;
  line-height: 1.55;
}

/* =========================================
   미니 버전
   ========================================= */

.snsbox.sns-mini {
  margin: 1em 0;
}

.snsbox.sns-mini .sns-head {
  padding-bottom: 0.5em;
}

.snsbox.sns-mini .sns-content {
  padding-top: 0.55em;
  padding-bottom: 0.55em;
}

.snsbox.sns-mini .sns-comments,
.snsbox.sns-mini .sns-thread {
  padding-top: 0.55em;
}

/* =========================================
   RIDI Instagram DM
   일반 글자: 0.75em
   대화 글자: 최종 0.9em
   ========================================= */

.igdm-box,
.igdm-box * {
  box-sizing: border-box;
}

.igdm-box {
  width: 100%;
  max-width: none;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 1.5em 0;
  padding: 0.5em;
  overflow: visible;

  background: #ffffff;
  color: #262626;

  border: 1px solid #833ab4;
  border-radius: 0.9em;
  box-shadow: none;

  font-family: Arial, sans-serif;
  font-size: 0.75em;
  line-height: 1.5;

  text-align: left;
  text-indent: 0;

  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;

  page-break-before: auto;
  page-break-after: auto;
  page-break-inside: auto;

  break-before: auto;
  break-after: auto;
  break-inside: auto;

  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;

  -webkit-text-size-adjust: 100%;
}

/* DM 본문 p 스타일 초기화 */

.igdm-box p {
  display: block;

  width: auto;
  max-width: none;

  height-width: none;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0;
  padding: 0;
  overflow: visible;

  color: inherit;
  font: inherit;
  line-height: inherit;

  text-align: left;
  text-indent: 0;

  white-space: normal;
  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;

  orphans: 1;
  widows: 1;

  page-break-inside: auto;
  break-inside: auto;
}

/* DM 상단 사용자 정보 */

.igdm-head {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;

  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;

  width: 100%;

  height: auto;
  min-height: 0;
  max-height: none;

  padding: 0.35em 0.35em 0.7em;
  overflow: visible;

  border-bottom: 1px solid #d8bee9;

  page-break-inside: avoid;
  page-break-after: avoid;

  break-inside: avoid;
  break-after: avoid;
}

/* DM 프로필 원형 */

.igdm-avatar {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;

  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;

  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;

  width: 3.1em;
  height: 3.1em;

  -webkit-box-flex: 0;
  -webkit-flex: 0 0 3.1em;
  flex: 0 0 3.1em;

  margin-right: 0.65em;

  border: 0.15em solid #ffffff;
  border-radius: 50%;

  background: #c13584;
  background:
    -webkit-linear-gradient(
      135deg,
      #feda75,
      #fa7e1e 28%,
      #d62976 57%,
      #962fbf 78%,
      #4f5bd5
    );
  background:
    linear-gradient(
      135deg,
      #feda75,
      #fa7e1e 28%,
      #d62976 57%,
      #962fbf 78%,
      #4f5bd5
    );

  color: #ffffff;

  font-size: 1em;
  font-weight: 700;
  line-height: 1;

  text-align: center;
  text-indent: 0;
}

/* DM 전용 인스타 카메라 표시 */

.igdm-box .sns-ig-icon {
  position: relative;
  color: transparent;
  text-indent: 0;
}

.igdm-box .sns-ig-icon::before {
  content: "";

  position: absolute;
  top: 50%;
  left: 50%;

  width: 1.35em;
  height: 1.35em;

  margin-top: -0.78em;
  margin-left: -0.78em;

  border: 0.13em solid #ffffff;
  border-radius: 0.38em;
}

.igdm-box .sns-ig-icon::after {
  content: "";

  position: absolute;
  top: 50%;
  left: 50%;

  width: 0.43em;
  height: 0.43em;

  margin-top: -0.28em;
  margin-left: -0.28em;

  border: 0.12em solid #ffffff;
  border-radius: 50%;

  box-shadow: 0.43em -0.43em 0 -0.15em #ffffff;
}

/* DM 사용자명 */

.igdm-user {
  display: block;

  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  flex: 1 1 auto;

  min-width: 0;
  overflow: visible;
}

.igdm-name {
  display: block;

  margin: 0;
  padding: 0;

  color: #262626;

  font-size: 1em;
  font-weight: 700;
  line-height: 1.3;

  text-indent: 0;
}

.igdm-status {
  display: block;

  margin-top: 0.12em;

  color: #737373;

  font-size: 1em;
  font-weight: 400;
  line-height: 1.3;

  text-indent: 0;
}

.igdm-info {
  display: block;

  margin-left: 0.65em;

  color: #262626;

  font-size: 1.5em;
  font-weight: 400;
  line-height: 1;

  text-align: center;
  text-indent: 0;
}

/* DM 대화 영역 */

.igdm-chat {
  display: block;

  width: 100%;

  height: auto;
  min-height: 0;
  max-height: none;

  padding: 0.7em 0.25em;
  overflow: visible;

  page-break-inside: auto;
  break-inside: auto;
}

.igdm-day {
  display: block;

  margin: 0.2em 0 0.9em;

  color: #8e8e8e;

  font-size: 1em;
  line-height: 1.3;

  text-align: center;
  text-indent: 0;

  page-break-after: avoid;
  break-after: avoid;
}

/* DM 메시지 묶음 */

.igdm-left,
.igdm-right {
  display: block;

  width: 82%;
  max-width: 82%;

  height: auto;
  min-height: 0;
  max-height: none;

  margin-top: 0.65em;
  overflow: visible;

  page-break-before: auto;
  page-break-after: auto;
  page-break-inside: auto;

  break-before: auto;
  break-after: auto;
  break-inside: auto;
}

.igdm-left {
  margin-right: 18%;
  margin-left: 0;
}

.igdm-right {
  margin-right: 0;
  margin-left: auto;
}

.igdm-sender {
  display: block;

  margin: 0 0 0.25em 0.55em;

  color: #737373;

  font-size: 1em;
  line-height: 1.3;

  text-align: left;
  text-indent: 0;

  page-break-after: avoid;
  break-after: avoid;
}

/*
  부모 0.75em × 말풍선 1.2em
  최종 대화 글자 크기 0.9em
*/

.igdm-box .igdm-bubble {
  display: block;

  width: auto;
  max-width: 100%;

  height: auto;
  min-height: 0;
  max-height: none;

  margin: 0;
  padding: 0.65em 0.85em;
  overflow: visible;

  border: 0;

  font-size: 1.2em;
  font-weight: 400;
  line-height: 1.5;

  text-align: left;
  text-indent: 0;

  white-space: normal;
  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;

  orphans: 1;
  widows: 1;

  page-break-inside: auto;
  break-inside: auto;

  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

.igdm-left .igdm-bubble {
  background: #efefef;
  color: #262626;

  border-radius: 0.35em 1.15em 1.15em 1.15em;
}

.igdm-right .igdm-bubble {
  background: #833ab4;
  background:
    -webkit-linear-gradient(
      135deg,
      #833ab4,
      #c13584 55%,
      #e1306c
    );
  background:
    linear-gradient(
      135deg,
      #833ab4,
      #c13584 55%,
      #e1306c
    );

  color: #ffffff;

  border-radius: 1.15em 0.35em 1.15em 1.15em;
}

/* DM 메시지 반응 */

.igdm-reaction {
  display: inline-block;

  margin: 0.2em 0 0 0.7em;
  padding: 0.12em 0.45em;

  background: #ffffff;
  color: #262626;

  border: 1px solid #dbdbdb;
  border-radius: 1em;

  font-size: 1em;
  line-height: 1.2;

  text-align: center;
  text-indent: 0;

  page-break-before: avoid;
  break-before: avoid;
}

/* 읽음 */

.igdm-seen {
  display: block;

  margin: 0.3em 0.4em 0 0;

  color: #8e8e8e;

  font-size: 1em;
  line-height: 1.3;

  text-align: right;
  text-indent: 0;

  page-break-before: avoid;
  break-before: avoid;
}

/* DM 하단 입력창 */

.igdm-compose {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;

  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;

  width: 100%;

  height: auto;
  min-height: 0;
  max-height: none;

  padding: 0.65em 0.35em 0.25em;
  overflow: visible;

  border-top: 1px solid #d8bee9;

  page-break-inside: avoid;
  break-inside: avoid;
}

.igdm-camera {
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;

  -webkit-box-align: center;
  -webkit-align-items: center;
  align-items: center;

  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;

  width: 2.45em;
  height: 2.45em;

  -webkit-box-flex: 0;
  -webkit-flex: 0 0 2.45em;
  flex: 0 0 2.45em;

  margin-right: 0.55em;

  border-radius: 50%;

  background: #833ab4;
  background:
    -webkit-linear-gradient(
      135deg,
      #833ab4,
      #c13584 55%,
      #e1306c
    );
  background:
    linear-gradient(
      135deg,
      #833ab4,
      #c13584 55%,
      #e1306c
    );

  color: #ffffff;

  font-size: 1em;
  font-weight: 700;
  line-height: 1;

  text-align: center;
  text-indent: 0;
}

.igdm-placeholder {
  display: block;

  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  flex: 1 1 auto;

  min-width: 4em;
  min-height: 2.45em;

  padding: 0.48em 0.75em;

  background: #ffffff;
  color: #8e8e8e;

  border: 1px solid #dbdbdb;
  border-radius: 1.4em;

  font-size: 1em;
  line-height: 1.35;

  text-align: left;
  text-indent: 0;
}

.igdm-heart {
  display: block;

  margin-left: 0.55em;

  color: #262626;

  font-size: 1.65em;
  font-weight: 400;
  line-height: 1;

  text-align: center;
  text-indent: 0;
}`;
