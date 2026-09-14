(function (global) {
  "use strict";
  var BLOCKS = [
    { id: 'h2', label: '見出し', html: '<h2>新しい見出し</h2>' },
    { id: 'h3', label: '小見出し', html: '<h3>小見出し</h3>' },
    { id: 'p', label: '段落', html: '<p>ここに本文を入力します。</p>' },
    { id: 'lead', label: 'リード文', html: '<p class="page-sub">リード文・説明をここに。</p>' },
    { id: 'card', label: 'カード', html: '<div class="card" data-editable="true"><h3>カードタイトル</h3><p>カードの説明文です。</p></div>' },
    { id: 'section', label: 'セクション', html: '<section class="article_by_teacher" data-editable="true"><h2>セクションタイトル</h2><p>このセクションは編集できます。</p></section>' },
    { id: 'ul', label: '箇条書き', html: '<ul><li>項目1</li><li>項目2</li><li>項目3</li></ul>' },
    { id: 'ol', label: '番号リスト', html: '<ol><li>手順1</li><li>手順2</li><li>手順3</li></ol>' },
    { id: 'btn', label: 'ボタンリンク', html: '<p style="text-align:center;margin-top:1rem"><a class="btn-play" href="#">リンク先へ →</a></p>' },
    { id: 'img', label: '画像枠', html: '<p style="text-align:center"><img src="https://placehold.co/600x300/png?text=Image" alt="画像" style="max-width:100%;height:auto;border-radius:12px"></p>' },
    { id: 'quote', label: '引用', html: '<blockquote style="border-left:4px solid #ff6b6b;padding:.75rem 1rem;margin:1rem 0;background:rgba(255,107,107,.08)">引用文をここに。</blockquote>' },
    { id: 'hr', label: '区切り線', html: '<hr style="border:0;border-top:2px dashed rgba(43,33,64,.15);margin:1.5rem 0">' },
    { id: 'two-col', label: '2カラム', html: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" data-editable="true"><div><h3>左</h3><p>内容</p></div><div><h3>右</h3><p>内容</p></div></div>' },
    { id: 'notice', label: 'お知らせ枠', html: '<div style="padding:1rem 1.25rem;border-radius:12px;background:rgba(46,196,182,.12);border:1px solid rgba(46,196,182,.35)" data-editable="true"><strong>お知らせ</strong><p style="margin:.4rem 0 0">メッセージをここに。</p></div>' }
  ];

  var DESIGN_SETS = [
    { id: 'soft-card', label: 'やわらかカード', styles: { background: '#ffffff', color: '#2b2140', borderRadius: '16px', boxShadow: '0 8px 28px rgba(43,33,64,.10)', padding: '1.25rem', border: '1px solid rgba(43,33,64,.08)' } },
    { id: 'mint-panel', label: 'ミントパネル', styles: { background: '#e8faf7', color: '#163a36', borderRadius: '16px', padding: '1.25rem', border: '1px solid #9ad9cf' } },
    { id: 'lavender', label: 'ラベンダー', styles: { background: '#f3eefc', color: '#2b2140', borderRadius: '16px', padding: '1.25rem', border: '1px solid #cbb8f0' } },
    { id: 'grad-warm', label: '暖色グラデ', styles: { background: 'linear-gradient(135deg,#ffe8cc 0%,#ffc9a8 100%)', color: '#3b2416', borderRadius: '16px', padding: '1.25rem' } },
    { id: 'grad-cool', label: '寒色グラデ', styles: { background: 'linear-gradient(135deg,#d7e6ff 0%,#c8f0ff 100%)', color: '#15263d', borderRadius: '16px', padding: '1.25rem' } },
    { id: 'night', label: 'ナイト（高コントラスト）', styles: { background: '#1a1428', color: '#ffffff', borderRadius: '14px', padding: '1.2rem', border: '2px solid #ff8e8e', boxShadow: '0 0 20px rgba(255,107,107,.25)' } },
    { id: 'minimal', label: 'ミニマル線', styles: { background: '#ffffff', color: '#2b2140', borderTop: '3px solid #2b2140', borderBottom: '3px solid #2b2140', borderLeft: '0', borderRight: '0', borderRadius: '0', padding: '1rem 0.25rem' } },
    { id: 'pill', label: 'ピル型バッジ', styles: { display: 'inline-block', borderRadius: '999px', padding: '.55rem 1.25rem', background: '#0f766e', color: '#ffffff', fontWeight: '700' } },
    { id: 'shadow-float', label: 'ふわっと影', styles: { boxShadow: '0 16px 40px rgba(43,33,64,.14)', borderRadius: '20px', background: '#ffffff', color: '#2b2140', padding: '1.5rem', border: '1px solid rgba(43,33,64,.06)' } }
  ];

  var ANIM_SETS = [
    { id: 'fade-up', label: 'ふわっと登場', animation: 'cmsFadeUp .7s ease both', keyframes: '@keyframes cmsFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' },
    { id: 'pop', label: 'ぽんっと出現', animation: 'cmsPop .45s cubic-bezier(.2,1.4,.4,1) both', keyframes: '@keyframes cmsPop{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}' },
    { id: 'slide-in', label: 'スライドイン', animation: 'cmsSlideIn .55s ease both', keyframes: '@keyframes cmsSlideIn{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}' },
    { id: 'pulse', label: 'やわらか点滅', animation: 'cmsPulse 2.2s ease-in-out infinite', keyframes: '@keyframes cmsPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}' },
    { id: 'floaty', label: 'ふわふわ', animation: 'cmsFloaty 3s ease-in-out infinite', keyframes: '@keyframes cmsFloaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' },
    { id: 'shine', label: 'きらり', animation: 'cmsShine 2.8s linear infinite', keyframes: '@keyframes cmsShine{0%{filter:brightness(1)}50%{filter:brightness(1.12)}100%{filter:brightness(1)}}' }
  ];

  global.CMS_BLOCKS = BLOCKS;
  global.CMS_DESIGN_SETS = DESIGN_SETS;
  global.CMS_ANIM_SETS = ANIM_SETS;
})(window);
