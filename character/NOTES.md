# character / 自律エージェント — 実装メモ・推奨事項

## 現状
- `autonomous-agent.svg` … 見た目の器
- README: WebLLM（0.5B〜1.5B）でサイト内を「住民」として自律操作させる構想

## 必要事項（最低限）
1. **知識ソース**  
   - サイト内の静的要約 JSON（例: `src/data/site-knowledge.json`）  
   - 内容: 開催日時、16ゼミの会場・担当、主要発表タイトル、メニュー操作方法  
   - sources の生 Excel は重すぎるので、既に作っている `SEMINAR_DATA` / `SCHEDULE_ALL` を要約して渡す

2. **行動 API（DOM 側）**  
   - `window.ReitansaiGuide.navigate(path)`  
   - `window.ReitansaiGuide.highlight(selector)`  
   - `window.ReitansaiGuide.speak(text)`（任意・音声合成）  
   - エージェントは「クリック相当」をこれらに限定すると安全

3. **出現 UI**  
   - 画面端に小さな SVG キャラ  
   - タップで吹き出し（案内・雑談）  
   - オフボタン必須（来場者の邪魔にならないように）

4. **モデル**  
   - WebLLM は端末負荷大。まずは **ルールベース案内 + 定型文** で十分機能する  
   - 本格 LLM は「実験モード」として約ページや dev フラグでのみ有効化を推奨

## 補足事項
- 来場者向けなので、エージェントが **takimura_t や管理系に誘導しない** こと
- 時間連動カラーとトーンを合わせたセリフ（夜は落ち着いた口調など）は世界観に合う
- スケジュール検索結果を読み上げるのは実用的

## おすすめ実装順
1. site-knowledge.json + 固定セリフの案内キャラ（LLMなし）
2. ハイライト・ページ遷移のガイド
3. WebLLM を optional で接続
4. sources 更新時に knowledge を再生成するスクリプト

## 非推奨
- 全ページで常時 LLM 推論（バッテリー・通信・体感速度）
- ユーザー入力の自由対話を無制限にする（誤案内・負荷）
