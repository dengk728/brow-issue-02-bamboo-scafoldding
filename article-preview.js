function setupArticlePreview() {
  const world = document.querySelector('#world');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'article-trigger';
  trigger.setAttribute('aria-label', 'Read Becoming Urban in China');
  trigger.setAttribute('aria-controls', 'urban-article');
  trigger.setAttribute('aria-expanded', 'false');
  document.querySelector('.html-copy').append(trigger);

  const overlay = document.createElement('div');
  overlay.className = 'article-overlay';
  overlay.hidden = true;
  const image = new Image();
  image.alt = '';
  image.src = "assets/images/China's_Urban_Transition_----_(Intro).jpeg";
  const reader = document.createElement('article');
  reader.id = 'urban-article';
  reader.className = 'article-reader body-copy';
  reader.tabIndex = 0;
  reader.setAttribute('aria-label', 'Becoming Urban in China');
  overlay.append(image, reader);
  document.body.append(overlay);

  let pinned = false;
  let closeTimer;
  let articleRequest;

  function position() {
    const box = trigger.getBoundingClientRect();
    const margin = 16;
    const stacked = innerWidth < 700;
    const width = stacked ? innerWidth - 2 * margin : Math.min(420, innerWidth * .34);
    const right = stacked ? margin : Math.min(box.right, innerWidth - width - margin);
    const top = Math.max(12, Math.min(box.top, innerHeight - 230));
    const readerTop = stacked ? Math.round(innerHeight * .38) : top;
    const imageHeight = stacked ? Math.min(box.height, Math.max(0, readerTop - 28)) : box.height;
    const imageWidth = imageHeight * box.width / box.height;
    Object.assign(image.style, {
      left: (stacked ? (innerWidth - imageWidth) / 2 : box.left) + 'px',
      top: (stacked ? readerTop - imageHeight - 12 : box.top) + 'px',
      width: imageWidth + 'px', height: imageHeight + 'px'
    });
    Object.assign(reader.style, {
      left: right + 'px', top: readerTop + 'px',
      width: width + 'px', maxHeight: innerHeight - readerTop - margin + 'px'
    });
  }

  function open() {
    clearTimeout(closeTimer);
    if (!world.dataset.settledSection || world.dataset.settledSection === 'overview') return;
    position();
    overlay.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (articleRequest) return;
    reader.textContent = 'Loading article…';
    articleRequest = fetch('assets/urban-article.html')
      .then(response => {
        if (!response.ok) throw new Error('Article could not load');
        return response.text();
      })
      .then(html => { reader.innerHTML = html; })
      .catch(() => {
        articleRequest = null;
        reader.textContent = 'Article could not load. Reopen the box to try again.';
      });
  }

  function close() {
    clearTimeout(closeTimer);
    pinned = false;
    overlay.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!pinned && !reader.contains(document.activeElement)) close();
    }, 220);
  }

  trigger.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') open();
  });
  trigger.addEventListener('pointerleave', scheduleClose);
  reader.addEventListener('pointerenter', () => clearTimeout(closeTimer));
  reader.addEventListener('pointerleave', scheduleClose);
  trigger.addEventListener('click', event => {
    if (pinned) {
      close();
      return;
    }
    pinned = true;
    open();
    if (!event.detail) reader.focus();
  });
  document.addEventListener('pointerdown', event => {
    if (!trigger.contains(event.target) && !reader.contains(event.target)) close();
  });
  reader.addEventListener('focusout', event => {
    if (!reader.contains(event.relatedTarget) && event.relatedTarget !== trigger) close();
  });
  window.addEventListener('keydown', event => {
    if (overlay.hidden || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (reader.contains(document.activeElement)) trigger.focus();
    close();
  }, true);
  new MutationObserver(() => {
    if (overlay.hidden) return;
    if (!world.dataset.settledSection || world.dataset.settledSection === 'overview') close();
    else position();
  }).observe(world, { attributes: true, attributeFilter: ['data-settled-section', 'style'] });
}
