// ==========================================
// ⚙️ GitHub設定（★ご自身のアカウント・リポジトリ名に書き換えてください！）
// ==========================================
const GITHUB_OWNER = "あなたのGitHubユーザー名"; 
const GITHUB_REPO = "あなたのリポジトリ名";     
const GITHUB_TOKEN = "github_pat_11BXRNCFA0EVBbGiXBnXgp_"+"rHoCChQCXXzyvyk2ox1l9RMI3xtQRwRmqUHVNAiAEsjWFWDH6TVCdEu2Pjo";

// ==========================================
// 🚀 システムの初期化処理
// ==========================================
let quill = null;
let loggedInUser = null; // ログインした先生の情報を保持する変数

// 1. リッチテキストエディタ Quill を起動
quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      ['image', 'video'], // 画像や動画の挿入ボタン
      ['clean']
    ]
  }
});

// ==========================================
// 🔑 認証（ログイン）処理
// ==========================================
document.getElementById('login-btn').addEventListener('click', async () => {
  const userId = document.getElementById('login-id').value.trim();
  const userPass = document.getElementById('login-pass').value.trim();
  const statusMsg = document.getElementById('status-msg');

  // トークンのチェックを削除し、IDとパスワードだけでチェック
  if (!userId || !userPass) {
    alert("ログインIDとパスワードを入力してください。");
    return;
  }

  statusMsg.innerText = "⏳ 認証中...";
  statusMsg.style.color = "orange";

  try {
    // 埋め込んだトークンを使って、src/users.json を安全に読み込む
    const usersUrl = `https://github.com{GITHUB_OWNER}/${GITHUB_REPO}/contents/src/users.json`;
    const response = await fetch(usersUrl, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
    });

    if (!response.ok) throw new Error("users.json の読み込みに失敗しました。リポジトリ名や設定を確認してください。");
    
    const fileData = await response.json();
    // Base64デコード（日本語の文字化け対策）
    const usersText = new TextDecoder().decode(Uint8Array.from(atob(fileData.content), c => c.charCodeAt(0)));
    const usersList = JSON.parse(usersText);

    // 入力されたIDのユーザーが存在するか確認
    const user = usersList[userId];

    if (user && user.password === userPass) {
      // ログイン成功！
      loggedInUser = user;

      statusMsg.innerText = `🎯 ログイン成功：${user.name}（${user.semi_name} 担当）`;
      statusMsg.style.color = "green";

      // 画面の切り替え
      document.getElementById('login-section').style.display = "none";
      document.getElementById('edit-section').style.display = "block";
      document.getElementById('editing-semi-name').innerText = user.semi_name;

      // 【修正ポイント】ログインが100%成功した「この瞬間」にだけ、既存のHTMLを読み込みに行く
      await loadExistingHtml(user.semi_id);

    } else {
      statusMsg.innerText = "❌ ログインIDまたはパスワードが間違っています。";
      statusMsg.style.color = "red";
    }

  } catch (error) {
    console.error(error);
    statusMsg.innerText = `❌ エラー: ${error.message}`;
    statusMsg.style.color = "red";
  }
});

// ==========================================
// 📄 既存のHTMLを読み込んでエディタに復元する処理
// ==========================================
async function loadExistingHtml(semiId) {
  const path = `pages/seminars/${semiId}.html`;
  const url = `https://github.com{GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  try {
    // 埋め込んだトークンで既存のHTMLをチェック
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` } });
    if (res.ok) {
      const fileData = await res.json();
      const fullHtml = new TextDecoder().decode(Uint8Array.from(atob(fileData.content), c => c.charCodeAt(0)));
      
      // 特有の <section id="main_section"> の内側だけを抜き出してエディタにセット
      const doc = new DOMParser().parseFromString(fullHtml, 'text/html');
      const mainSection = doc.getElementById('main_section');
      if (mainSection) {
        quill.root.innerHTML = mainSection.innerHTML;
      }
    }
  } catch (e) {
    console.log("既存ファイルの読み込みスキップ（新規作成となります）");
  }
}

// ==========================================
// 💾 保存（テンプレート合体 ＆ 自動プッシュ）処理
// ==========================================
document.getElementById('save-btn').addEventListener('click', async () => {
  if (!loggedInUser) return;

  const statusMsg = document.getElementById('status-msg');
  statusMsg.innerText = "⏳ データを保存中（GitHubへプッシュ中）...";
  statusMsg.style.color = "orange";

  // 1. 先生が書いたリッチテキストの生HTMLを回収
  const cmsContentHtml = quill.root.innerHTML;

  // 2. 🎯 あなたの美学：指定された id="main_section" を含む完全なプレーンHTMLを組み立てる
  const finalFullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${loggedInUser.semi_name}</title>
  <!-- 外側の pages/seminars/ 階層から、src/ 内部のCSSを正確に読み込む相対パス -->
  <link rel="stylesheet" href="../../src/css/common.css">
  <link rel="stylesheet" href="../../src/css/pages/seminars/${loggedInUser.semi_id}.css">
</head>
<body>
  <!-- あなたが狙った特定の id ボックスの中に綺麗にはめ込みます -->
  <section id="main_section">
    ${cmsContentHtml}
  </section>
</body>
</html>`;

  const path = `pages/seminars/${loggedInUser.semi_id}.html`;
  const logPath = "src/log.txt";
  const fileUrl = `https://github.com{GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  const logUrl = `https://github.com{GITHUB_OWNER}/${GITHUB_REPO}/contents/${logPath}`;

  try {
    // 3. 上書きするために、現在のHTMLファイルの最新バージョン（sha）を取得
    const fileRes = await fetch(fileUrl, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` } });
    let currentSha = null;
    if (fileRes.ok) {
      const fileData = await fileRes.json();
      currentSha = fileData.sha;
    }

    // 4. 文字化け対策をして Base64 変換
    const utf8Bytes = new TextEncoder().encode(finalFullHtml);
    const base64Content = btoa(String.fromCharCode(...utf8Bytes));

    // 5. 【後半の保存処理】埋め込みトークンで、プレーンHTMLを自動上書きプッシュ！
    const putRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `cms: ${loggedInUser.name} が ${loggedInUser.semi_name} ページを更新しました`,
        content: base64Content,
        sha: currentSha
      })
    });

    if (!putRes.ok) throw new Error("HTMLの保存に失敗しました。");

    // 6. 📄 編集履歴ログ（src/log.txt）の追記処理
    const logRes = await fetch(logUrl, { headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` } });
    let logSha = null;
    let currentLogText = "";
    if (logRes.ok) {
      const logData = await logRes.json();
      logSha = logData.sha;
      currentLogText = new TextDecoder().decode(Uint8Array.from(atob(logData.content), c => c.charCodeAt(0)));
    }

    // 新しいログを末尾に追加
    const now = new Date().toLocaleString('ja-JP');
    const newLogLine = `[${now}] ${loggedInUser.name} が ${loggedInUser.semi_name} ページ（${path}）を更新しました。\n`;
    const updatedLogText = currentLogText + newLogLine;

    const logBytes = new TextEncoder().encode(updatedLogText);
    const base64Log = btoa(String.fromCharCode(...logBytes));

    // 【後半の保存処理】ログファイルを埋め込みトークンでGitHubへプッシュ
    await fetch(logUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `cms: log を更新しました`,
        content: base64Log,
        sha: logSha
      })
    });

    statusMsg.innerText = `🎉 成功！${loggedInUser.semi_name} のHTML更新と履歴ログの記録が完了しました！1〜2分でLIFFアプリに反映されます。`;
    statusMsg.style.color = "green";

  } catch (error) {
    console.error(error);
    statusMsg.innerText = `❌ 保存エラー: ${error.message}`;
    statusMsg.style.color = "red";
  }
});
