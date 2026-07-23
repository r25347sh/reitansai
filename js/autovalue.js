document.addEventListener('DOMContentLoaded', function() {
    // autovalue.json を読み込む
    fetch('autovalue.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('autovalue.json の読み込みに失敗しました');
            }
            return response.json();
        })
        .then(data => {
            // 現在のページのURLからベース名を取得（index.html → index, second.html → second など）
            let currentPath = window.location.pathname;
            let currentFile = currentPath.split('/').pop() || 'index';
            
            // .html を除去
            let baseName = currentFile.replace(/\.html$/i, '');
            
            // ルートや空の場合を index 扱い
            if (baseName === '' || baseName === '/' || currentPath.endsWith('/')) {
                baseName = 'index';
            }
            
            console.log('現在のページ:', baseName);

            // 該当するURLのデータを探す（柔軟にマッチング）
            const pageData = data.find(item => {
                if (!item.url) return false;
                const itemBase = item.url.replace(/\.html$/i, '');
                return (
                    itemBase === baseName ||
                    item.url === currentFile ||
                    item.url === currentPath ||
                    item.url === baseName + '.html'
                );
            });

            if (!pageData || !pageData.value) {
                console.warn(`「${baseName}」に対応するデータが見つかりませんでした`);
                return;
            }

            const values = pageData.value;

            // data-value 属性を持つ全要素を更新
            Object.keys(values).forEach(key => {
                const elements = document.querySelectorAll(`[data-value="${key}"]`);
                elements.forEach(element => {
                    if (element) {
                        // 改行（\n）を <br> に変換して反映
                        const content = values[key].replace(/\n/g, '<br>');
                        element.innerHTML = content;
                    }
                });
            });

            console.log(`✅ ${baseName} の内容を自動反映しました`);
        })
        .catch(error => {
            console.error('autovalue.js エラー:', error);
        });
});
