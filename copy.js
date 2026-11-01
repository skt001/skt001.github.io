(function() {
  const style = document.createElement('style');
  style.textContent = `
    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 1;
    }
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
    btn.type = 'button';
    btn.textContent = '📋';
    btn.setAttribute('aria-label', 'コードをコピー');
    btn.title = 'コードをコピー';

    btn.onclick = () => {
      const content = pre.cloneNode(true);
      content.querySelectorAll('.copy-btn').forEach(button => button.remove());
      const code = content.querySelector('code') || content;
      const text = code.textContent;

      copyTextToClipboard(text).then(() => {
        btn.textContent = '✅';
        btn.setAttribute('aria-label', 'コピーしました');
        btn.title = 'コピーしました';

        setTimeout(() => {
          btn.textContent = '📋';
          btn.setAttribute('aria-label', 'コードをコピー');
          btn.title = 'コードをコピー';
        }, 1800);
      }).catch(err => {
        console.error('コピー失敗', err);
        btn.textContent = '⚠️';
        btn.setAttribute('aria-label', 'コピーに失敗しました');
        btn.title = 'コピーに失敗しました';
        setTimeout(() => {
          btn.textContent = '📋';
          btn.setAttribute('aria-label', 'コードをコピー');
          btn.title = 'コードをコピー';
        }, 1500);
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
