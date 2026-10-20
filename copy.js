(function() {
  const style = document.createElement('style');
  style.textContent = `
    .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #333;
      color: #fff;
      border: none;
      padding: 4px 10px;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.85;
      z-index: 10;
    }
    .copy-btn:hover { opacity: 1; background: #555; }
    .copy-btn.copied { background: #28a745; color: white; }
    pre { position: relative; }
  `;
  document.head.appendChild(style);

  function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (successful) {
            resolve();
          } else {
            reject(new Error('execCommand fallback failed'));
          }
        } catch (err) {
          document.body.removeChild(textarea);
          reject(err);
        }
      });
    }
  }

  function addCopyButtonToPre(pre) {
    if (pre.querySelector('.copy-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'コピー';

    btn.onclick = () => {
      const code = pre.querySelector('code') || pre;
      const text = code.textContent.trim();

      copyTextToClipboard(text).then(() => {
        const original = btn.textContent;
        btn.textContent = 'コピー済み';
        btn.classList.add('copied');

        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1800);
      }).catch(err => {
        console.error('コピー失敗', err);
        btn.textContent = '失敗';
        setTimeout(() => btn.textContent = 'コピー', 1500);
      });
    };

    pre.appendChild(btn);
  }

  function processAllPreElements() {
    document.querySelectorAll('pre').forEach(addCopyButtonToPre);
  }

  // MutationObserverによる動的要素の監視
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'PRE') {
            addCopyButtonToPre(node);
          }
          node.querySelectorAll('pre').forEach(addCopyButtonToPre);
        }
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      processAllPreElements();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    processAllPreElements();
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
