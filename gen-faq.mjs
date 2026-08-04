#!/usr/bin/env node
/**
 * gen-faq.mjs — よくある問い（FAQ）ページを5言語で生成する
 *   dist/faq/ (ja), dist/en/faq/, dist/zh/faq/, dist/ko/faq/, dist/th/faq/
 * 内容はサイト本体・concept.md の確定情報のみ。推測で埋めない。
 * 使い方: node gen-faq.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 'https://rikyu-group.com';

const QA = {
  ja: [
    ['会員でなくても利用できますか？',
     'できます。ドロップインは一回500THB、どなたでも利用できます（要予約）。気に入ったら回数券（五回2,000THB・十回3,600THB）へ。月額会員（3,500THB・使い放題）もご用意しています。'],
    ['予約は必要ですか？',
     'はい、ご利用は予約制です。ご予約・お問い合わせは公式LINEからどうぞ。'],
    ['何がありますか？',
     'フィンランド式サウナ（4〜6名・二段）、アイスバス、ととのい・マッサージの間、コーヒーやスムージーと軽食のラウンジ、ビリヤードや将棋・ボードゲーム、畳のVIP和室、電源とWi-Fiの仕事場。延床約180㎡・5区画です。'],
    ['営業時間は決まっていますか？',
     '開業時に確定します。静の「休」と動の「利」が、同じ屋根の下に同時にある設計です。'],
    ['お酒は飲めますか？',
     'サウナとラウンジはノンアルコールです。整いも語らいも、澄んだ頭で。お酒は夜のVIP和室（予約制）でのみ、<span class="nowrap">お楽しみいただけます。</span>'],
    ['場所はどこですか？',
     'タイ・チェンマイ、ナイトバザールの三階を予定しています（最終調整中）。表通りに看板は出していません。「雑踏の上にある」ことが、この場所の価値だと考えています。'],
    ['オンラインコミュニティでは何をしますか？',
     '会員が参加できるオンラインの場です。朝活サウナ・合トレ・リトリート・食事会・仕事の縁結びなどの催しを、ここから<span class="nowrap">生み出していきます。</span>'],
    ['開業はいつですか？',
     '2027年上旬を予定しています。準備の様子は読みもの「利休ノウナイ」で発信しています。'],
  ],
  en: [
    ['Can I visit without a membership?',
     'Yes. Drop-in is 500 THB per visit and open to everyone (reservation required). If you like it, there are punch cards (5 visits 2,000 THB / 10 visits 3,600 THB) and a monthly membership (3,500 THB, unlimited use).'],
    ['Do I need a reservation?',
     'Yes, all visits are by reservation. Book and ask questions via our official LINE.'],
    ['What is inside?',
     'A Finnish sauna (4–6 people, two tiers), ice baths, a cool-down and massage room, a lounge with coffee, smoothies and light meals, billiards, shogi and board games, a tatami VIP room, and a workspace with power and Wi-Fi. About 180 sqm in five zones.'],
    ['Are the opening hours set?',
     'They will be fixed at opening. The still “Kyū” and the lively “Ri” coexist under one roof, at the same time.'],
    ['Can I drink alcohol?',
     'The sauna and lounge are alcohol-free — clear heads for both restoring and talking. Alcohol is served only in the VIP tatami room at night (reservation required).'],
    ['Where is it?',
     'Chiang Mai, Thailand — planned for the third floor of the Night Bazaar (final details being settled). There is no street sign. Being “above the bustle” is part of the value of this place.'],
    ['What happens in the online community?',
     'An online space for members. Morning sauna sessions, group training, retreats, dinners and business matchmaking all start here.'],
    ['When do you open?',
     'Early 2027. Follow the preparations on our journal “Rikyu Nounai” (Japanese).'],
  ],
  zh: [
    ['非会员也能使用吗？',
     '可以。单次体验一次500泰铢，任何人都可以使用（需预约）。喜欢的话可选次卡（5次2,000泰铢・10次3,600泰铢），也有月费会员（3,500泰铢・不限次数）。'],
    ['需要预约吗？',
     '需要，所有使用均为预约制。预约与咨询请通过官方LINE。'],
    ['有什么设施？',
     '芬兰式桑拿（4〜6人・两层座）、冰浴、休整与按摩间、提供咖啡・冰沙・轻食的休息区、台球与将棋・桌游、榻榻米VIP和室、带电源和Wi-Fi的工作区。总面积约180㎡、共5个区域。'],
    ['营业时间定了吗？',
     '将在开业时确定。静的「休」与动的「利」，在同一屋檐下同时存在。'],
    ['可以喝酒吗？',
     '桑拿与休息区不提供酒精饮品——放松与交流，都用清醒的头脑。酒只在夜晚的VIP和室<span class="nowrap">（预约制）提供。</span>'],
    ['地点在哪里？',
     '泰国清迈，计划位于夜市（Night Bazaar）三层（最终确认中）。临街不设招牌。「闹市之上的静谧」正是这里的价值。'],
    ['线上社区做什么？',
     '这是会员参与的线上空间。晨间桑拿、团体训练、静修营、聚餐、事业结缘等活动都从这里发起。'],
    ['什么时候开业？',
     '预计2027年上半年。筹备进展在博客「利休ノウナイ」（日语）发布。'],
  ],
  ko: [
    ['회원이 아니어도 이용할 수 있나요?',
     '네. 드롭인은 1회 500바트로 누구나 이용하실 수 있습니다(예약 필수). 마음에 드시면 회수권(5회 2,000바트・10회 3,600바트), 월 회원(3,500바트・무제한)도 준비되어 있습니다.'],
    ['예약이 필요한가요?',
     '네, 모든 이용은 예약제입니다. 예약・문의는 공식 LINE으로 부탁드립니다.'],
    ['어떤 시설이 있나요?',
     '핀란드식 사우나(4〜6명・2단), 아이스 바스, 휴식・마사지 공간, 커피와 스무디・간단한 식사가 있는 라운지, 당구와 쇼기・보드게임, 다다미 VIP 룸, 전원과 Wi-Fi가 있는 업무 공간. 약 180㎡・5개 구역입니다.'],
    ['영업시간은 정해져 있나요?',
     '오픈 시 확정합니다. 고요한 「休」와 활기찬 「利」가 같은 지붕 아래 동시에 있는 설계입니다.'],
    ['술을 마실 수 있나요?',
     '사우나와 라운지는 논알코올입니다. 회복도 대화도 맑은 머리로. 술은 밤의 VIP 룸(예약제)에서만 즐기실 수 있습니다.'],
    ['위치는 어디인가요?',
     '태국 치앙마이, 나이트 바자 3층을 예정하고 있습니다(최종 조정 중). 간판은 내걸지 않습니다. 「번잡함 위의 고요」가 이곳의 가치라고 생각합니다.'],
    ['온라인 커뮤니티에서는 무엇을 하나요?',
     '회원이 참여하는 온라인 공간입니다. 아침 사우나・함께 하는 트레이닝・리트리트・식사 모임・비즈니스 인연 맺기 등의 모임이 여기서 시작됩니다.'],
    ['오픈은 언제인가요?',
     '2027년 상반기 예정입니다. 준비 과정은 저널 「利休ノウナイ」(일본어)에서 전하고 있습니다.'],
  ],
  th: [
    ['ไม่ได้เป็นสมาชิกก็ใช้บริการได้ไหม?',
     'ได้ครับ Drop-in ครั้งละ 500 บาท เปิดให้ทุกคน (ต้องจองล่วงหน้า) ถ้าถูกใจ มีบัตรรายครั้ง (5 ครั้ง 2,000 บาท / 10 ครั้ง 3,600 บาท) และสมาชิกรายเดือน (3,500 บาท ใช้ได้ไม่จำกัด)'],
    ['ต้องจองล่วงหน้าไหม?',
     'ใช่ครับ ทุกการใช้บริการเป็นระบบจอง จองและสอบถามได้ทาง LINE ทางการ'],
    ['มีอะไรบ้าง?',
     'ซาวน่าแบบฟินแลนด์ (4–6 คน สองชั้น) อ่างน้ำแข็ง พื้นที่พักและนวด เลานจ์กาแฟ สมูทตี้และอาหารเบา ๆ บิลเลียด โชกิและบอร์ดเกม ห้องเสื่อทาทามิ VIP และพื้นที่ทำงานพร้อมปลั๊กไฟและ Wi-Fi รวมประมาณ 180 ตร.ม. 5 โซน'],
    ['กำหนดเวลาเปิดแล้วหรือยัง?',
     'จะสรุปตอนเปิดร้าน 「休」อันสงบ และ 「利」อันคึกคัก อยู่ใต้หลังคาเดียวกันพร้อมกัน'],
    ['ดื่มแอลกอฮอล์ได้ไหม?',
     'ซาวน่าและเลานจ์ปลอดแอลกอฮอล์ — ทั้งการพักและการพูดคุย ด้วยหัวที่ปลอดโปร่ง เครื่องดื่มแอลกอฮอล์มีเฉพาะห้องทาทามิ VIP ตอนกลางคืน (ระบบจอง)'],
    ['อยู่ที่ไหน?',
     'เชียงใหม่ ประเทศไทย มีแผนอยู่ชั้น 3 ของไนท์บาซาร์ (กำลังสรุปขั้นสุดท้าย) ไม่มีป้ายริมถนน “ความสงบเหนือความคึกคัก” คือคุณค่าของที่นี่'],
    ['คอมมูนิตี้ออนไลน์ทำอะไร?',
     'พื้นที่ออนไลน์สำหรับสมาชิก ซาวน่ายามเช้า เทรนด้วยกัน รีทรีต มื้ออาหาร และการจับคู่ทางธุรกิจ <span class="nowrap">เริ่มต้นจากที่นี่</span>'],
    ['เปิดเมื่อไหร่?',
     'ต้นปี 2027 ติดตามการเตรียมงานได้ที่บล็อก 「利休ノウナイ」 (ภาษาญี่ปุ่น)'],
  ],
};

const T = {
  ja: {
    htmlLang: 'ja', ogLocale: 'ja_JP', dir: 'faq', home: '/', line: '/line/', qm: '問',
    title: 'よくある問い｜利休 RIKYU — チェンマイ・ジャパニーズ ウェルネスラウンジ',
    desc: 'チェンマイ・ナイトバザール3Fの会員制ウェルネスラウンジ「利休」への、よくある問いと答え。料金・予約・場所・会員について。',
    ogTitle: 'よくある問い｜利休 RIKYU', ogDesc: '料金・予約・場所・会員について、よくある問いと答え。',
    navBlog: '読みもの', navFaq: 'よくある問い', hCta: '先行案内',
    meta: 'FAQ', h1: 'よくある問い',
    lead: 'はじめての方から、よくいただく問いをまとめました。ここにない問いは、開業までに読みもの「利休ノウナイ」でもお答えしていきます。',
    note: '※ 料金・内容・営業時間は開業時に確定します。',
    ctaT: '整う。遊ぶ。つながる。', ctaMain: '先行案内を受け取る', ctaGhost: '「利休ノウナイ」を読む',
  },
  en: {
    htmlLang: 'en', ogLocale: 'en_US', dir: 'en/faq', home: '/en/', line: '/en/line/', qm: 'Q',
    title: 'FAQ | RIKYU — Japanese Wellness Lounge, Chiang Mai',
    desc: 'RIKYU Chiang Mai FAQ — pricing, reservations, location and membership for our members wellness lounge at the Night Bazaar.',
    ogTitle: 'FAQ | RIKYU Chiang Mai', ogDesc: 'Pricing, reservations, location and membership — answered.',
    navBlog: 'Journal', navFaq: 'FAQ', hCta: 'Early updates',
    meta: 'FAQ', h1: 'Frequently asked questions',
    lead: 'Answers to the questions we hear most. Anything not covered here will be answered on our journal before opening.',
    note: '* Prices, contents and opening hours will be finalized at opening.',
    ctaT: 'Restore. Play. Belong.', ctaMain: 'Get early updates on LINE', ctaGhost: 'Read the journal (Japanese)',
  },
  zh: {
    htmlLang: 'zh', ogLocale: 'zh_CN', dir: 'zh/faq', home: '/zh/', line: '/zh/line/', qm: '问',
    title: '常见问题｜利休 RIKYU — 清迈日式养生休闲空间',
    desc: '关于清迈夜市3层会员制养生休闲空间「利休」的常见问题：价格、预约、位置、会员。',
    ogTitle: '常见问题｜利休 RIKYU', ogDesc: '价格、预约、位置、会员——常见问题解答。',
    navBlog: '博客', navFaq: '常见问题', hCta: '抢先资讯',
    meta: 'FAQ', h1: '常见问题',
    lead: '汇总了初次来访者最常问的问题。这里没有的问题，开业前也会在博客中陆续解答。',
    note: '※ 价格・内容・营业时间将在开业时确定。',
    ctaT: '放松。玩乐。结缘。', ctaMain: '抢先接收开业资讯', ctaGhost: '阅读博客（日语）',
  },
  ko: {
    htmlLang: 'ko', ogLocale: 'ko_KR', dir: 'ko/faq', home: '/ko/', line: '/ko/line/', qm: 'Q',
    title: '자주 묻는 질문｜利休 RIKYU — 치앙마이 재패니즈 웰니스 라운지',
    desc: '치앙마이 나이트 바자 3층의 회원제 웰니스 라운지 「利休」에 대한 자주 묻는 질문 — 요금・예약・위치・회원.',
    ogTitle: '자주 묻는 질문｜利休 RIKYU', ogDesc: '요금・예약・위치・회원 — 자주 묻는 질문과 답.',
    navBlog: '저널', navFaq: 'FAQ', hCta: '선행 안내',
    meta: 'FAQ', h1: '자주 묻는 질문',
    lead: '처음 오시는 분들께 자주 받는 질문을 모았습니다. 여기에 없는 질문은 오픈 전까지 저널에서도 답해 드리겠습니다.',
    note: '※ 요금・내용・영업시간은 오픈 시 확정됩니다.',
    ctaT: '회복. 놀이. 인연.', ctaMain: '선행 안내 받기', ctaGhost: '저널 읽기(일본어)',
  },
  th: {
    htmlLang: 'th', ogLocale: 'th_TH', dir: 'th/faq', home: '/th/', line: '/th/line/', qm: 'Q',
    title: 'คำถามที่พบบ่อย｜利休 RIKYU — เจแปนนีสเวลเนสเลานจ์ เชียงใหม่',
    desc: 'คำถามที่พบบ่อยเกี่ยวกับ 利休 เวลเนสเลานจ์ระบบสมาชิก ชั้น 3 ไนท์บาซาร์ เชียงใหม่ — ราคา การจอง สถานที่ สมาชิก',
    ogTitle: 'คำถามที่พบบ่อย｜利休 RIKYU', ogDesc: 'ราคา การจอง สถานที่ สมาชิก — ตอบไว้ครบ',
    navBlog: 'บล็อก', navFaq: 'FAQ', hCta: 'ข่าวก่อนใคร',
    meta: 'FAQ', h1: 'คำถามที่พบบ่อย',
    lead: 'รวมคำถามที่ได้รับบ่อยจากผู้มาครั้งแรก คำถามอื่น ๆ จะทยอยตอบในบล็อกก่อนเปิดร้าน',
    note: '* ราคา รายละเอียด และเวลาเปิด จะสรุปตอนเปิดร้าน',
    ctaT: 'ผ่อนคลาย สนุก ผูกพัน', ctaMain: 'รับข่าวสารก่อนใคร', ctaGhost: 'อ่านบล็อก (ภาษาญี่ปุ่น)',
  },
};

const LANG_LINKS = [
  ['ja', '/faq/', '日本語'], ['en', '/en/faq/', 'EN'], ['zh', '/zh/faq/', '中文'],
  ['ko', '/ko/faq/', '한국어'], ['th', '/th/faq/', 'ไทย'],
];

const CSS = `
:root{
  --sumi:#141210;--sumi-3:#0f0d0b;--paper:#f3eee3;
  --kin:#b08d57;--kin-bright:#cfa96e;--kin-paper:#7d6134;--rikyu:#5c6653;
  --shu:#a03e2d;--shu-deep:#8a3020;
  --ink:#26221d;--ink-soft:#5f584c;--wash:#efe9dc;--wash-soft:#cfc7b6;--wash-mute:#a89f8d;
  --serif:"Noto Serif JP","Hiragino Mincho ProN","Yu Mincho","YuMincho",serif;
  --sans:"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif;
  --line-d:rgba(176,141,87,.28);--line-p:rgba(38,34,29,.16);
  --grain:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--serif);font-size:15.5px;line-height:2.2;-webkit-font-smoothing:antialiased;position:relative}
body::before{content:"";position:fixed;inset:0;background:var(--grain);pointer-events:none;z-index:0}
a{color:inherit}
h1,h2{line-break:strict;overflow-wrap:anywhere}
.nowrap{display:inline-block}
header.site{position:relative;z-index:1;background:var(--sumi);color:var(--wash);padding:10px 24px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;border-bottom:1px solid var(--line-d)}
header.site .logo{font-size:17px;letter-spacing:.3em;font-weight:500;text-decoration:none;line-height:1.3;padding:6px 0}
header.site .logo small{display:block;font-family:var(--sans);font-size:9px;letter-spacing:.3em;color:var(--kin-bright);font-weight:400}
header.site .sub{margin-left:auto;display:flex;gap:2px}
header.site .sub a{display:inline-block;font-family:var(--sans);font-size:12px;letter-spacing:.14em;color:var(--wash-soft);text-decoration:none;padding:14px 10px}
header.site .sub a:hover{color:var(--kin-bright)}
.h-cta{display:inline-flex;align-items:center;min-height:44px;padding:8px 20px;background:var(--shu);color:#f6efe4;font-family:var(--serif);font-size:12.5px;letter-spacing:.18em;text-decoration:none}
.h-cta:hover{background:var(--shu-deep)}
.langbar{position:relative;z-index:1;background:var(--sumi-3);text-align:right;padding:2px 18px;font-family:var(--sans);font-size:11px;letter-spacing:.08em}
.langbar a{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;color:var(--wash-mute);text-decoration:none;padding:12px 8px}
.langbar a:hover{color:var(--kin-bright)}
.langbar a.on{color:var(--kin-bright)}
@media(max-width:560px){header.site{gap:10px;padding:10px 14px}header.site .sub{display:none}.h-cta{padding:8px 26px;font-size:11.5px}}
main{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:72px 24px 96px}
.meta{font-family:var(--sans);font-size:11.5px;letter-spacing:.16em;color:var(--kin-paper)}
h1{margin-top:14px;font-size:clamp(24px,4.6vw,32px);font-weight:600;letter-spacing:.1em;line-height:1.8}
.lead{margin-top:20px;color:var(--ink-soft);font-size:14.5px}
.qa{border-bottom:1px solid var(--line-p);padding:36px 0}
.qa:first-of-type{margin-top:28px;border-top:1px solid var(--line-p)}
.qa h2{display:flex;gap:14px;align-items:baseline;font-size:16.5px;font-weight:600;letter-spacing:.06em;line-height:2}
.qa h2 .m{flex:none;font-size:12px;color:var(--kin-paper);letter-spacing:.2em;border:1px solid rgba(125,97,52,.4);padding:2px 8px;transform:translateY(-2px)}
.qa p{margin-top:14px;padding-left:44px;font-size:14px;color:var(--ink-soft);line-height:2.2}
@media(max-width:480px){.qa p{padding-left:0}}
.note{margin-top:32px;font-family:var(--sans);font-size:11px;letter-spacing:.1em;color:var(--ink-soft)}
.cta{margin-top:72px;padding:48px 32px;background:var(--sumi);color:var(--wash);text-align:center;position:relative}
.cta::before,.cta::after{content:"";position:absolute;width:14px;height:14px}
.cta::before{top:-1px;left:-1px;border-top:2px solid var(--kin);border-left:2px solid var(--kin)}
.cta::after{bottom:-1px;right:-1px;border-bottom:2px solid var(--kin);border-right:2px solid var(--kin)}
.cta .t{font-size:16px;letter-spacing:.26em}
.cta .row{margin-top:24px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.cta a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 30px;font-size:13px;letter-spacing:.2em;text-decoration:none;border:1px solid transparent}
.cta a.main{background:var(--shu);color:#f6efe4}
.cta a.main:hover{background:var(--shu-deep)}
.cta a.ghost{border-color:var(--line-d);color:var(--wash)}
.cta a.ghost:hover{border-color:var(--kin-bright);color:var(--kin-bright)}
footer{position:relative;z-index:1;background:var(--sumi-3);color:var(--wash-mute);text-align:center;padding:36px 24px;font-family:var(--sans);font-size:10.5px;letter-spacing:.2em}
footer a{display:inline-block;color:var(--wash);text-decoration:none;padding:14px 10px}
footer a:hover{color:var(--kin-bright)}
`;
const EXTRA_STYLE = {
  ko: 'body{word-break:keep-all}h1,h2,.lead{overflow-wrap:break-word}',
  th: 'h1,h2,.lead{overflow-wrap:normal;line-break:auto}',
};
const ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23141210'/%3E%3Ccircle cx='32' cy='32' r='24' fill='none' stroke='%23b08d57' stroke-width='2' stroke-dasharray='132 19' stroke-linecap='round' transform='rotate(-80 32 32)'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-size='24' font-family='serif' fill='%23f3eee3'%3E利%3C/text%3E%3C/svg%3E`;

const ALT = LANG_LINKS.map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${BASE}${p}">`).join('\n') +
  `\n<link rel="alternate" hreflang="x-default" href="${BASE}/faq/">`;

for (const [lang, t] of Object.entries(T)) {
  const qa = QA[lang];
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: t.htmlLang,
    mainEntity: qa.map(([q, a]) => ({
      '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
    })),
  };
  const qaHtml = qa.map(([q, a]) => `  <div class="qa">
    <h2><span class="m">${t.qm}</span>${q}</h2>
    <p>${a}</p>
  </div>`).join('\n');
  const langbar = LANG_LINKS.map(([l, p, label]) =>
    `<a href="${p}"${l === lang ? ' class="on"' : ''}>${label}</a>`).join('');
  const url = `${BASE}/${t.dir}/`;
  const html = `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t.title}</title>
<meta name="description" content="${t.desc}">
<meta property="og:title" content="${t.ogTitle}">
<meta property="og:description" content="${t.ogDesc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE}/ogp.png">
<meta property="og:locale" content="${t.ogLocale}">
<link rel="canonical" href="${url}">
${ALT}
<link rel="icon" href="${ICON}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${EXTRA_STYLE[lang] || ''}</style>
</head>
<body>
<div class="langbar">${langbar}</div>
<header class="site">
  <a class="logo" href="${t.home}">利休<small>RIKYU · CHIANG MAI</small></a>
  <nav class="sub"><a href="/blog/">${t.navBlog}</a><a href="/${t.dir}/">${t.navFaq}</a></nav>
  <a class="h-cta" href="${t.line}">${t.hCta}</a>
</header>
<main>
  <div class="meta">${t.meta}</div>
  <h1>${t.h1}</h1>
  <p class="lead">${t.lead}</p>
${qaHtml}
  <div class="note">${t.note}</div>
  <div class="cta">
    <div class="t">${t.ctaT}</div>
    <div class="row"><a class="main" href="${t.line}">${t.ctaMain}</a><a class="ghost" href="/blog/">${t.ctaGhost}</a></div>
  </div>
</main>
<footer>
  <a href="${t.home}">利休 RIKYU</a> — © 2026 RIKYU, Chiang Mai
</footer>
</body>
</html>
`;
  mkdirSync(resolve(process.cwd(), `dist/${t.dir}`), { recursive: true });
  writeFileSync(resolve(process.cwd(), `dist/${t.dir}/index.html`), html);
  console.log(`✓ dist/${t.dir}/index.html`);
}
