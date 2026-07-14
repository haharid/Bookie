/* EPUB 내부 CSS 자동 삽입용. css/epub.css와 같은 내용입니다. */
const EPUB_CSS = `/*기본 스타일시트*/
p {
  font-size: 1em;
  line-height: 180%;
  text-indent: 0.9em;
  display: block;
  margin-bottom: 0.6em;
  margin-left: 0.1em;
  margin-right: 0.1em;
  margin-top: 0.6em;
}
h1 {
  font-size: 1.2em;
  text-indent: 0;
  text-align: center;
}
h2 {
  font-size: 1em;
  text-indent: 0;
  text-align: center;
}
a {
  text-decoration: none;
  color: #000;
}

.fb {
  font-size: 1em;
  color: #7f7f7f;
  font-style: italic;
  text-align: justify;
  line-height: 1.7em;
  text-indent: 0.8em;
  margin-bottom: 0.7em;
}
.f {
  font-size: 1em;
  color: #7f7f7f;
  line-height: 180%;
  text-indent: 0.9em;
  display: block;
  margin-bottom: 0.6em;
  margin-left: 0.1em;
  margin-right: 0.1em;
  margin-top: 0.6em;
}
.b {
  font-size: 1em;
  font-weight:bold;
  line-height: 180%;
  text-indent: 0.9em;
  display: block;
  margin-bottom: 0.6em;
  margin-left: 0.1em;
  margin-right: 0.1em;
  margin-top: 0.6em;
}  

.i {
  font-size: 1em;
  font-style: italic;
  line-height: 180%;
  text-indent: 0.9em;
  display: block;
  margin-bottom: 0.6em;
  margin-left: 0.1em;
  margin-right: 0.1em;
  margin-top: 0.6em;
}  

.ib {
  font-size: 1em;
  font-style: italic;
  font-weight:bold;
  line-height: 180%;
  text-indent: 0.9em;
  display: block;
  margin-bottom: 0.6em;
  margin-left: 0.1em;
  margin-right: 0.1em;
  margin-top: 0.6em;
}



/* sns */


.box_insta {
  border: 2px solid #67457D;
  background-color: #F5F5F5;
  padding: 0.5em;
  border-radius: 10px;
}

.box_tweet {
  border: 2px solid #1ea1f1;
  background-color: #F5F5F5;
  padding: 0.5em;
  border-radius: 10px;
}



.sns_in {
  font-size: 1em;
  padding: 0.1em 0.3em 0.1em 0.3em;
  margin: 0;
  margin-top: 0.3em;
  text-indent: 0;
  background-color: #fff;
  border: 1px solid #fff;
  border-radius: 10px;
}
.sns_in1 {
  font-size: 1em;
  padding: 0.1em 0.3em 0.1em 0.3em;
  margin: 0.5em 1em 0.15em;
  margin-top: 0.3em;
  text-indent: 0;
  background-color: #fff;
  border: 1px solid #fff;
  border-radius: 10px;
}


/* --- 메시지 단위 --- */
.message {
  display: flex;
  align-items: flex-end;
  margin-bottom: 0.5em;
  font-size: 0.9em;
}

/* --- 기본 프로필 --- */
.profile {
  width: 1.8em;
  height: 1.8em;
  border-radius: 50%;
  background: #ddd;
  margin-right: 0.4em;
  flex-shrink: 0;
  border: 1px solid #ccc;
}

/* --- 말풍선 --- */
.bubble1 {
  border-radius: 14px;
  padding: 0.5em 0.9em;
  font-size: 1em;
  line-height: 1.4;
  max-width: 70%;
  word-wrap: break-word;
}

.from-me {
  justify-content: flex-end;
}

.from-me .bubble1 {
  background: #8634e8;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.from-them .bubble1 {
  background: #e8e8e8;
  color: #000;
  border-bottom-left-radius: 4px;
}



/* --- 본문 연결 자연스럽게 --- */
.caption {
  font-size: 1em;
  color: #444;
  margin-bottom: 1.5em;
}



/* 문자 */


.chat-box {
  width: 100%;
  background: #fff !important;
  padding: 12px;
  box-sizing: border-box;
  margin: 0.2em 0;
  border-radius: 0.5em 0.5em 0.5em 0.5em;
  font-size: 0.9em;
  border-radius: 0.5em;
  border: 0.5px solid #DDD;
}


.sms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  font-size: 1.2em;
  font-weight: bold;

  margin: 0 0 1em 0;
  padding-bottom: 0.8em;

  border-bottom: 0.05em solid #ddd;

  text-indent: 0;
}

.contact-name {
  flex: 1;
  text-align: center;
}

.left,
.right {
  width: 1em;
  text-align: center;
}


/* 상대방 이름 */
.name {
  font-size: 0.7em;
  text-indent: 0;
  padding: 0.3em 0 0 0;
}
.name1 {
  font-size: 0.7em;
  text-indent: 0;
  padding: 0.3em 0 0 0;
    margin: 0.5em 1em 0.15em;
}

/* 채팅 말풍선 */
.bubble {
  padding: 0.6em 0.8em;
  border-radius: 20px;
  display: inline-block;
  word-wrap: break-word;
  line-height: 1.5;
  font-size: 1em;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
}

.chat-you { display: flex; flex-direction: column; align-items: flex-start; margin: 0.15em 0; }
.chat-you .bubble { background-color: #e5e5ea; color: #000; max-width: 80%; }

.chat-me { display: flex; flex-direction: column; align-items: flex-end; margin: 0.15em 0; }
.chat-me .bubble { background-color: #007aff; color: #fff; max-width: 80%; }

.chat-system { display: flex; justify-content: center; margin: 1em; }

.chat-system .bubble { background: none; color: #888; font-size: 0.7em; padding: 0; }

/* 입력창 */
.input-chat {
  display: flex;
  margin-top: 1.5em;
  justify-content: flex-end;
}

.input-chat .input-box {
  width: 80%;
  background-color: #f1f1f1;
  border-radius: 18px;
  padding: 0.6em 0.8em;
  display: flex;
  align-items: center;
  font-size: 0.9em;
  color: #000;
  box-sizing: border-box;
  border: none;
}

/* 커서 */
.cursor {
  width: 1px;
  height: 1.2em;
  background-color: #000;
  margin-left: 2px;
  animation: blink 1s infinite;
}
@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}

/* === 말풍선 옆 시간 === */
.bubble-wrap {
  display: flex;
  align-items: flex-end;
  gap: 0.4em;
}

.chat-you .bubble-wrap { justify-content: flex-start; }
.chat-me .bubble-wrap { justify-content: flex-end; }

.time {
  font-size: 11px;
  color: #888;
  white-space: nowrap;
  align-self: flex-end;
  margin: 0.1em;
}


   /* 카톡 */

.kchat {
  width: 100%;
  background: #b2dffc;
  padding: 12px;
  box-sizing: border-box;
  margin: 0.2em 0;
  border-radius: 0.5em 0.5em 0.5em 0.5em;
  font-size: 0.9em;
}

.kchat1 {
  width: 100%;
  background: #ffd6fa;
  padding: 12px;
  box-sizing: border-box;
  margin: 0.2em 0;
  border-radius: 0.5em 0.5em 0.5em 0.5em;
  font-size: 0.9em;
}

.box_k2 {
  background-color: #99bbd1;
  padding: 0em;
}

/* 좌우 공통 */
.kleft, .kright {
  display: flex;
  align-items: flex-end;
  margin: 8px 0;
}
.kleft { justify-content: flex-start; }
.kright { justify-content: flex-end; }

.kbubble {
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 80%;
  font-size: 1em;
  line-height: 1.5;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

.kbubble1 {
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 80%;
  font-size: 1em;
  line-height: 1.5;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

.kleft .kbubble { background: #fff; border-radius: 0 12px 12px 12px; }

.kright .kbubble { background: #ffeb33; border-radius: 12px 0 12px 12px; }

.kright .kbubble1 { background: #fc5ee9; border-radius: 12px 0 12px 12px; }

.kcursor {
  display: inline-block;
  width: 1px;
  height: 1em;
  background-color: #000;
  margin-left: 2px;
  animation: blink 1.2s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.ksystem {
  text-align: center;
  color: #999;
  font-size: 13px;
  margin: 2em;
  
}

.kinput {
  background: #fff;
  border-radius: 6px;
  padding: 6px 10px;
  margin-top: 10px;
  font-size: 0.9em;
  color: #333;
}

/* 게시판 */

.box_out {
  border: 2px solid #DCDCDC;
  background-color: #F5F5F5;
  padding: 0.5em;
}
.box_in {
  background-color: #fff;
  padding: 0.5em;
  
}

.fan_title {
  font-size: 1em;
  font-weight: bold;
  border-bottom: 1px solid #A9A9A9;
}
.fan_title1 {
  font-size: 0.8em;
  font-weight: bold;
  border-bottom: 1px solid #A9A9A9;
}
.re_border {
  border-bottom: 1px dotted #A9A9A9;
  padding-left: 1em;
}

.green {
  border-radius: 0;
  border: solid 3px #a2f2bd;
  background-color: #FFF;
  border-radius: 0;
  padding: 12px;
  margin: 0.8em 0.2em 0.8em 0.2em;
  position: syayic;
}


.kakao {
  font-size: 0.9em;
  line-height: 1.4em;
  text-indent: 0;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}
.box1111 {
  border-radius: 0.3em;
  border: solid 1px #404040;
  background-color: #404040;
  padding: 20px 8px 20px 8px;
  margin: 0.8em 0.2em 0.8em 0.2em;
}
.box3333 {
  border-radius: 1em;
  border: solid 1px #bbb;
  background-color: #d4d4d4;
  margin-left: auto;
  padding: 5px 12px 5px 12px;
}

.search3 {
  width: 85%;
}
.search4 {
  width: 90%;
  margin: 0 auto;
  padding: 0.5em;
  border: 1px solid;
  border-radius: 5px;
  border-color: rgb(128, 128, 128);
}
.search5 {
  width: 90%;
  margin: 0 auto;
  padding: 0.5em;
  border: 1px solid;
  border-radius: 5px;
  border-color: rgb(128, 128, 128);
}
 /* 📜 고급 양피지 스타일 */
  .letterbox {
background: #f4e9c8 center/cover no-repeat;
border: 1px solid rgba(100, 80, 40, 0.4);
padding: 0.5em;
margin: 0.5em;
color: #2c1c08;
font-size: 1em;
line-height: 1.8;
border-radius: 0;

/* 은은한 깊이감 */
box-shadow: inset 0 0 15px rgba(0,0,0,0.15);
background-blend-mode: multiply;
filter: contrast(1.05) brightness(0.97);

/* 💌 손편지 느낌 */
font-family: "Great Vibes", "Nanum Pen Script", "Noto Serif KR", cursive;
font-style: italic;
letter-spacing: 0.03em;
transform: rotate(-0.3deg);
  }

  .letterbox p {
text-indent: 1em;
margin: 0.7em 0;
font-size: 1em;
  }

  .seal {
text-align: center;
margin: 1.5em 0;
  }

  .seal::after {
content: "🕯";
font-size: 1.4em;
color: #6a1a0a;
opacity: 0.7;
  }
  
.boxcall {
    width: 50%;
    margin: 1.5em auto;
    padding: 1em;
    text-align: center;
    background: linear-gradient(to bottom, #79A1B8 0%, #8CB8AF 50%);
    border: 2px solid #6d6d6d;
    border-radius: .5em;
    box-shadow: 2px 2px 4px #d3d3d3;
}

.boxcall p {
    color: #fff;
    font-weight: bold;
}

.call_status {
    font-size: .7em;
}

.call_name {
    font-size: 1.2em;
    text-align: center;
    text-indent: 0;
}

.call_space {
    font-size: 2em;
}

.call_icon {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3.5em;
    margin-bottom: .5em;
}

.call_icon .icon1,
.call_icon .icon2 {
    width: 45px;
    height: 45px;
    background-repeat: no-repeat;
    background-size: contain;
}

.call_icon .icon1 {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="%23FFFFFF"/><g><rect x="331.753" y="288.52" transform="matrix(0.7879 -0.6158 0.6158 0.7879 -131.5202 286.6909)" fill="%2340ca70" width="37.344" height="91.504"/><path fill="%2340ca70" d="M348.696,393.736L292.344,321.6c-51.16-14.248-87.064-60.168-88.544-113.256l-56.352-72.096c0,0-53.392,76.488,30.4,183.64S348.696,393.736,348.696,393.736z"/><rect x="186.814" y="103.169" transform="matrix(0.7879 -0.6158 0.6158 0.7879 -48.1226 158.1244)" fill="%2340ca70" width="37.344" height="91.504"/></g></svg>');
}

.call_icon .icon2 {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="%23FFFFFF"/><g transform="rotate(128,256,256)"><rect x="331.753" y="288.52" transform="matrix(0.7879 -0.6158 0.6158 0.7879 -131.5202 286.6909)" fill="%23E63946" width="37.344" height="91.504"/><path fill="%23E63946" d="M348.696,393.736L292.344,321.6c-51.16-14.248-87.064-60.168-88.544-113.256l-56.352-72.096c0,0-53.392,76.488,30.4,183.64S348.696,393.736,348.696,393.736z"/><rect x="186.814" y="103.169" transform="matrix(0.7879 -0.6158 0.6158 0.7879 -48.1226 158.1244)" fill="%23E63946" width="37.344" height="91.504"/></g></svg>');
}

@keyframes softVibrate {
    0%,90%,100% { transform: translate(0,0); }
    10%,50% { transform: translate(-.5px,.5px); }
    20%,60% { transform: translate(.5px,-.5px); }
    30% { transform: translate(-.3px,.3px); }
    40% { transform: translate(.3px,-.3px); }
    70% { transform: translate(-.2px,.2px); }
    80% { transform: translate(.2px,-.2px); }
}

.boxcall.vibrate {
    animation: softVibrate .3s infinite;
}
/* =======================
   2️⃣ 작은 카드형 수신 블록 (그림자 있음)
   ======================= */
.call-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 20px;
  border: 1px solid #ddd;
  padding: 0.8em 1em;
  width: 85%;
  max-width: 420px;
  margin: 2em auto;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
}

.call-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.call-name {
  font-weight: 700;
  font-size: 1.1em;
  color: #111;
}

.call-status {
  font-size: 0.9em;
  color: #666;
}

.call-buttons-small {
  display: flex;
  align-items: center;
  gap: 1.2em;
}

.btn-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1em;
  font-weight: bold;
  line-height: 1;
}

.btn-small.accept {
  background: #34b648;
}

.btn-small.decline {
  background: #e23b3b;
}

.arrow {
  font-size: 0.8em;
  color: #999;
  margin-left: 0.3em;
}

/* 상태창 */

.sw {
  page-break-inside: avoid;
  break-inside: avoid;
  width: 92%;
  max-width: 500px;
  margin: 1.5em auto;
  box-sizing: border-box;
}


.st {
  position: relative;
  background: rgba(255, 255, 255, 0.45);   
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 14px;
  padding: 1em 0.5em;
  color: #002b44;
  text-align: left;
  box-shadow: 0 3px 10px rgba(0, 100, 255, 0.25);
  background-clip: padding-box;
  font-family: "Noto Sans KR", sans-serif;
  font-size: 0.96em;
  overflow: visible;                        
  box-sizing: border-box;
}

/* 제목 */
.tt {
  font-weight: 700;
  font-size: 1.1em;
  color: #0090ff;
  text-align: center;
  margin-bottom: 0.6em;
  letter-spacing: 0.02em;
  text-shadow: 0 0 4px rgba(0, 120, 255, 0.35);
}

/* 내용 */
.ct p {
  margin: 0.4em 0;
  padding-left: 0.4em;
  text-indent: 0;
  font-size: 0.95em;
  color: #003355;
  line-height: 1.7;
}

  
  /* 공책 */
  
.note {
  width: 90%;
  max-width: 700px;
  font-style: italic;
  margin: 0.5em auto;
  border: 1px solid #dcdcdc;
  border-radius: 6px;
  box-shadow: 0 0 6px rgba(0,0,0,0.05);
  padding: 1em 0.5em;
  box-sizing: border-box;

  /* 줄 간격 정확히 28px */
  background: repeating-linear-gradient(
to bottom,
#ffffff 0px,
#ffffff 27px,
#c8d9ff 28px
  );

  font-size: 1em;
  line-height: 28px; /* ← 줄 간격과 완벽히 일치 */
}

/* 제목 줄 */
.title-line {
  font-size: 1.1em;
  font-weight: bold;
  border-bottom: 2px solid #99bbff;
  margin-bottom: 8px;
  padding-bottom: 4px;
}


/* 메일 */

.mail-box {
  background-color: #ffffff;
  border: 1px solid #ccd6e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  max-width: 600px;
  margin: 0.5em ;
  padding: 1.2em 1.5em;
  box-sizing: border-box;
}

/* 헤더 영역 */
.mail-header {
  border-bottom: 1px solid #dde3eb;
  padding-bottom: 0.8em;
  margin-bottom: 1em;
}

.mail-from {
  font-weight: bold;
  color: #003366;
  font-size: 1em;
}

.mail-subject {
  font-size: 1.1em;
  font-weight: 600;
  color: #1a2a3a;
  margin-top: 0.3em;
}

.mail-date {
  font-size: 0.85em;
  color: #667788;
  margin-top: 0.2em;
}

/* 본문 */
.mail-body {
  font-size: 0.95em;
  color: #333;
  white-space: pre-line; /* 줄바꿈 유지 */
}

/* 회신 구분선 */
.mail-divider {
  border-top: 1px dashed #cdd9e3;
  margin: 1.2em 0;
}


/* ✳️ 명함 블록 플랫 & 미니멀 스타일 */
.card-inline {
  display: block;
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.8em 1em;
  margin: 1.4em auto;
  text-align: center;
  width: 65%;
  max-width: 400px;
}

.company {
  font-size: 1em;
  color: #666;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 0.4em;
}

.namem {
  font-weight: 600;
  font-size: 1.4em;
  color: #111;
  margin-bottom: 0.15em;
}

.position {
  font-size: 0.95em;
  color: #555;
  font-style: italic;
}

  /* 📱 잠금화면 박스 (소형 버전) */
  .glockscreen {
    background: #1b1b1f;
    color: white;
    border-radius: 14px;
    padding: 1em 0.6em;       /* ✅ 여백 줄임 */
    margin: 0.8em auto;
    max-width: 240px;         /* ✅ 훨씬 작게 */
    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
    font-family: "Noto Sans KR", sans-serif;
  }

  .gstatus-bar {
    display: flex;
    justify-content: space-between;
    font-size: 0.7em;         /* ✅ 작게 */
    opacity: 0.8;
  }

  .glock {
    text-align: center;
    font-size: 1em;           /* ✅ 작게 */
    margin-top: 0.8em;
    opacity: 0.85;
  }

  .gclock {
    text-align: center;
    margin: 1em 0;
  }

  .gtime {
    font-size: 2em;           /* ✅ 시계 줄임 */
    font-weight: 300;
    margin-bottom: 0.1em;
  }

  .gdate {
    font-size: 0.8em;
    color: rgba(255,255,255,0.8);
  }

  .gbottom {
    display: flex;
    justify-content: space-between;
    opacity: 0.9;
    font-size: 1em;
    margin-top: 1em;
  }

  .gbottom span {
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
    width: 30px;              /* ✅ 버튼 크기 축소 */
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* 📺 TV 전체 프레임 (스톤그레이, 여백 전면 조정) */
  .tv-frame {
    background: #6e665c;
    border-radius: 8px;
    width: calc(100% - 1.6em);    /* ✅ 좌우 총합 1em → 각 0.5em씩 남김 */
    margin: 1.5em auto;         /* ✅ 위아래 0.5em, 중앙 정렬 */
    padding: 0.5em;
    box-shadow: 0 3px 8px rgba(0,0,0,0.25);
    position: relative;
  }

  /* 🖥️ TV 화면 */
  .tv-screen {
    background: #fff;
    border-radius: 4px;
    border: 1px solid #444;
    overflow: hidden;
    display: block;
  }

  /* 화면 내용 */
  .tv-content {
    color: #222;
    font-family: "Noto Sans KR", sans-serif;
    font-size: 0.95em;
    line-height: 1.6;
    text-align: left;
    padding: 0.8em;
  }

  /* 받침대 */
  .tv-base {
    background: #8d8578;
    height: 8px;
    width: 80px;
    margin: 0.6em auto 0;
    border-radius: 2px;
  }
  


  /* 📱 핸드폰 프레임 */
  .qp {
    background: #3b3b3d;
    border-radius: 12px;
    padding: 0.08em;
    width: calc(100% - 1em);   /* 좌우 0.5em 여백 */
    margin: 1.5em auto;        /* 위아래 1.5em */
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  /* 📺 화면 */
  .qs {
    background: #fdfcf7;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,0.25);
    overflow: hidden;
    font-family: "Noto Sans KR", sans-serif;
  }

  /* 🗒️ 메모 앱 */
  .qa {
    background: #fffbe6;
    border-radius: 6px;
    margin: 0.25em;
    box-shadow: inset 0 0 2px rgba(0,0,0,0.05);
  }

  .qh {
    background: #ffe97a;
    border-bottom: 1px solid #f0d560;
    text-align: center;
    font-weight: 600;
    padding: 0.3em;
    border-radius: 6px 6px 0 0;
    font-size: 0.9em;   /* 살짝 작게 */
    color: #333;
  }

  .qb {
    padding: 0.45em;
    font-size: 0.85em;    /* 글자 줄임 */
    line-height: 1.5;
    color: #222;
  }

  .qb ul {
    margin: 0.3em 0 0.7em 1.2em;
  }

  .qb li {
    list-style-type: "🟡 ";
    margin-bottom: 0.15em;
  }

.uy {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    width: calc(100% - 1em);   /* 좌우 0.5em 여백 */
    margin: 0.5em auto;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    font-family: "Noto Sans KR", sans-serif;
  }

  /* ▶ 아이콘 + 제목 */
  .un {
    display: flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.6em 0.8em;
    font-size: 1em;             /* ✅ 글자 크기 1em */
    font-weight: 600;
    color: #111;
  }

  /* 🎨 아이콘 */
  .ui {
    width: 1.5em;                 /* ✅ 이미지 크기 1em */
    height: 1.2em;
    object-fit: contain;
    vertical-align: middle;     /* ✅ 글자 기준 정렬 */
  }
  
  
   /* 📱 유튜브 전체 박스 */
.wy{
  background:#000;
  border-radius:.6em;
  width:calc(100% - 1em);
  margin:1.5em auto;
  overflow:hidden;
  font-family:sans-serif;
}

.wt{
  background:linear-gradient(to bottom,#222,#111);
  color:rgba(255,255,255,.9);
  font-size:2em;
  text-align:center;
  line-height:3em;
  height:3em;
  border-radius:.6em .6em 0 0;
}


.wch{
  display:flex;
  align-items:center;
  background:#fff;
  padding:.7em;
}

.wcp{
  width:2.2em;
  height:2.2em;
  border-radius:50%;
  background:#ddd;
  margin-right:.7em;
  flex-shrink:0;
}

.wcnm{
  font-size:.9em;
  font-weight:600;
  color:#111;
}

.wcs{
  font-size:.75em;
  color:#777;
  margin-top:.15em;
}

.wi{
  background:#fff;
  padding:0 .7em .7em;
}

.wn{
  font-size:1em;
  font-weight:600;
  color:#111;
  margin-bottom:.3em;
}

.wm{
  font-size:.75em;
  color:#666;
}

.wc{
  background:#f8f8f8;
  border-top:1px solid #e5e5e5;
}

.cmt{
  padding:.75em;
}

.cmt + .cmt{
  border-top:1px solid #e5e5e5;
}

.wca{
  margin-bottom:.35em;
}

.wcname{
  font-size:.85em;
  font-weight:600;
  color:#111;
}

.wct{
  font-size:.85em;
  color:#888;
  margin-left:.5em;
}

.wcc{
  font-size:.95em;
  color:#222;
  line-height:1.5;
}`;
