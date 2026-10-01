# すぐ効く改善の実装メモ（スタンプラリー・おすすめルート以外）

対象リポジトリ: `r25347sh/reitansai`  
方針: 既存の IndexedDB Myスケジュール・衝突検出・時間連動テーマ・MENU を壊さない。

## 変更ファイル一覧

| パス | 内容 |
|------|------|
| `pages/schedule.html` | 「進行状況」フィルタ、LIVE ステータス表示、manifest / SW 登録、会場ナビリンク |
| `src/js/pages/schedule.js` | いま見られる / まもなく / 終了フィルタ、行ハイライト、30秒更新、衝突確認メッセージ改善、schedule.json フォールバック |
| `src/css/pages/schedule.css` | LIVE/まもなく/終了バッジ・行色、印刷用スタイル、ツールバー |
| `pages/my/my_schedule.html` | 次の発表カード、衝突警告、テキスト/CSV/印刷、通しNo.列整合 |
| `src/js/pages/my-schedule.js` | カウントダウン、エクスポート、重なり検出表示、LIVE行ハイライト |
| `pages/venue.html` | 会場カード一覧 → `schedule.html?venue=…` へジャンプ |
| `manifest.webmanifest` | **新規** PWA マニフェスト |
| `sw.js` | **新規** オフライン用 Service Worker |
| `src/json/schedule.json` | 実データ（104件）を配置。main が PLACEHOLDER の場合はこれをコミット推奨 |

## 機能詳細

### 1. スケジュール「いま見られる」
- フィルタ `#f-live`:
  - 進行中（start ≤ 現在 < end）
  - まもなく＋進行中（開始まで30分以内）
  - これから（未終了）
  - 終了済み
- 行クラス `row-live` / `row-soon` / `row-past` とバッジ
- JST 現在時刻表示＋進行中件数（30秒ごとに再描画）
- URL: `?venue=` `?seminar=` `?live=live|soon|upcoming|past`

### 2. Myスケジュール強化
- **次の発表 / いま発表中** カード（残り分数）
- 保存同士の時間重なり警告（保存時の衝突検出は従来どおり）
- **テキストコピー** / **CSVダウンロード**（BOM付き） / **印刷**
- テーブルに通しNo.列を復元（thead と一致）

### 3. 会場マップ
- 画像はそのまま
- 下に会場カード（ゼミ名付き）→ スケジュールを会場フィルタで開く

### 4. PWA（軽量）
- `manifest.webmanifest` + `sw.js`
- schedule.json は network-first、静的ファイルは cache 優先
- ホーム画面追加・オフライン閲覧の土台

## 壊していないもの
- Myスケジュール IndexedDB スキーマ・API（`ReitansaiMySchedule`）
- 保存時の衝突検出・置換確認
- 時間連動テーマ / MENU（長押し・トリプルタップ・FAB）
- 各ゼミ個別ページ
