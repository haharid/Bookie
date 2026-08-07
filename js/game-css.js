/* EPUB 내부 game.css 자동 삽입용. css/game.css와 같은 기본 내용입니다. */
const GAME_CSS = `/* Bookie game chat styles — EPUB에서는 style.css와 분리된 game.css로 포함됩니다. */

.chat,
.chat_wc,
.chat_p,
.chat_y,
.chat_b,
.chat_g,
.chat_bb,
.chat_gg,
.chat_or,
.chat_pp,
[class^="chat_custom_"] {
  font-size: 0.95em;
  line-height: 1.5em;
  text-indent: 0;
  margin: 0.6em 0.2em;
}

.chat {
  color: #ffffff;
}

.chat_wc {
  color: #ffffff;
  font-weight: bold;
  text-align: center;
}

.chat_p {
  color: #ff90af;
}

.chat_y {
  color: #ffde00;
}

.chat_b {
  color: #83d8ff;
}

.chat_g {
  color: #93ec5d;
}

.chat_bb {
  color: #6f82d8;
}

.chat_gg {
  color: #91ff66;
}

.chat_or {
  color: #ff8c00;
}

.chat_pp {
  color: #f252fa;
}

.pre1 {
  padding: 14px 8px;
  border: solid 3px #feaad1;
  border-radius: 0.7em;
  background-color: #404040;
}

.chat_w {
  margin: 0.25em 0.5em 0.25em 1em;
  border-left: 0.2em solid #cacaca;
}`;
