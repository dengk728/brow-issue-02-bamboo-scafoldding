async function setupMaterialsPopup() {
  const response = await fetch('assets/popup-copy.json');
  if (!response.ok) throw new Error('Popup text could not load');
  const popupCopy = await response.json();
  const world = document.querySelector('#world');
  const content = document.querySelector('#content');
  const copy = document.querySelector('.html-copy');
  const layer = document.createElement('div');
  layer.className = 'layer popup-layer';
  world.insertBefore(layer, content);

  // Positions match the supplied popup art and portrait image transforms.
  const definitions = [
    ['Other materials than bamboo?', [3392.45, 2934.1748, 189.1, 189.1], null],
    ['Ho Ping-tak', [5067.98, 10145.7508, 426.49, 204.49], [4774.67, 10161.7508, 275.52, 251.79]],
    ['Lai Chi-ming', [4637.01, 10541.1208, 268.66, 172.55], [4337.19, 10489.5208, 301.76, 275.77]],
    ['Kim Chiu-ping', [5178.67, 10836.6308, 268.66, 172.55], [4854.21, 10765.2608, 301.76, 275.77]],
    ['Wu Sei-yim', [4637.01, 11179.3608, 356.84, 172.55], [4318.34, 11110.3208, 301.76, 275.77]],
    ['Tony Ip', [5152.41, 11473.8708, 302.32, 172.55], [4767.98, 11442.4008, 353.28, 235.52]]
  ];
  const entries = definitions.map(([name, bubble, portrait], index) => {
    const panel = document.createElement('div');
    panel.id = 'map-popup-' + index;
    panel.className = 'map-popup-panel' + (portrait ? ' portrait-popup-panel' : '');
    panel.hidden = true;

    const artwork = document.createElement('img');
    artwork.className = 'materials-popup-art';
    artwork.alt = '';
    artwork.style.translate = '0 ' + [84.2248, 447.9508, 447.9508, 447.9508, 447.9508, 447.9508][index] + 'px';
    artwork.src = 'assets/popup-' + index + '.svg';
    const text = document.createElement('div');
    text.className = 'map-popup-copy' + (index === 0 ? ' materials-popup-copy' : '');
    if (index === 0) {
      const [intro, ...items] = popupCopy[index].split(/\n•/);
      const paragraph = document.createElement('p');
      paragraph.textContent = intro;
      const list = document.createElement('ul');
      for (const item of items) {
        const bullet = document.createElement('li');
        bullet.textContent = item.trim();
        list.append(bullet);
      }
      text.append(paragraph, list);
    } else {
      text.textContent = popupCopy[index];
    }
    const [x, y, width, height] = bubble;
    Object.assign(text.style, {
      left: x + 'px', top: y + 'px', width: width + 'px', minHeight: height + 'px'
    });
    panel.append(artwork, text);
    layer.append(panel);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = portrait ? 'portrait-popup-trigger' : 'materials-popup-trigger';
    trigger.setAttribute('aria-label', portrait ? 'Quote from ' + name : name);
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', 'false');
    if (!portrait) trigger.textContent = 'other materials than bamboo?';
    if (portrait) {
      const [left, top, w, h] = portrait;
      Object.assign(trigger.style, {
        left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px'
      });
    }
    copy.append(trigger);
    if (portrait) {
      panel.style.zIndex = '4';
      panel.style.pointerEvents = 'none';
      copy.append(panel);
    }
    return { panel, trigger, text, bubble, portrait };
  });

  const narrowScreen = matchMedia('(max-width: 650px)');
  function positionBubble({ text, bubble, portrait }) {
    if (!portrait) {
      const [x, y, width, height] = bubble;
      const bounds = world.getBoundingClientRect();
      const scale = bounds.width / world.offsetWidth;
      if (!scale) return;
      const mobile = innerWidth <= 650;
      const screenWidth = mobile ? Math.min(180, innerWidth * .44) : width * 1.2;
      const boxWidth = Math.min(screenWidth, innerWidth - 24) / scale;
      const minX = (12 - bounds.left) / scale;
      const maxX = (innerWidth - 12 - bounds.left) / scale - boxWidth;
      const boxLeft = mobile ? minX : Math.max(minX, Math.min(maxX, x - 60));
      const boxTop = mobile ? y - 170 : y - 24;
      Object.assign(text.style, {
        left: boxLeft + 'px',
        top: boxTop + 'px',
        width: boxWidth + 'px',
        minHeight: mobile ? '0' : (height * 1.2 / scale) + 'px',
        maxHeight: mobile ? (190 / scale) + 'px' : 'none',
        overflow: mobile ? 'auto' : 'visible'
      });
      // Continue the original diagonal supports to the relocated box edge.
      // Their scaffold ends stay in the original artwork coordinates.
      text.parentElement.querySelector('.materials-popup-art').style.display = 'none';
      let supports = text.parentElement.querySelector('.materials-supports');
      if (!supports) {
        supports = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        supports.setAttribute('class', 'materials-supports');
        supports.setAttribute('viewBox', '0 0 9585.61 13695.5708');
        supports.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none';
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'white');
        path.setAttribute('stroke-width', '13.3');
        path.setAttribute('stroke-linecap', 'square');
        supports.append(path);
        text.parentElement.insertBefore(supports, text);
      }
      const edge = boxLeft + boxWidth - 5;
      supports.firstElementChild.setAttribute('d', [[3716.07,3078.25],[3618.93,3169.33]].map(([endX,endY]) =>
        `M ${edge} ${endY-(endX-edge)} L ${endX} ${endY}`
      ).join(' '));
      return;
    }
    const [, y] = bubble;
    const bounds = world.getBoundingClientRect();
    const scale = bounds.width / world.offsetWidth;
    if (!scale) return;
    const [left, , portraitWidth] = portrait;
    const towardRight = left + portraitWidth / 2 < 4875;
    const gap = 16 / scale;
    const page = window.issuePages[window.issuePages.length - 1];
    const caption = [...document.querySelectorAll('.portrait-caption')].find(e =>
      Math.abs(parseFloat(e.style.top) - y) < 160);
    const captionRight = caption ? Number(caption.dataset.anchorX) + caption.offsetWidth : left + portraitWidth;
    // These anchors are map coordinates. Panning never chooses a new side,
    // changes the original baseline, or moves dialogue to another character.
    const anchor = towardRight ? Math.max(left + portraitWidth, captionRight) + gap : left - gap;
    const available = towardRight ? page.x + page.w - anchor - gap : anchor - page.x - gap;
    const width = Math.max(72 / scale, Math.min(360 / scale, available));
    const x = towardRight ? anchor : anchor - width;
    text.dataset.direction = towardRight ? 'right' : 'left';
    Object.assign(text.style, {
      visibility:'visible', left:x+'px', top:y+'px',
      width:width+'px', minHeight:'0',
      maxHeight:'none', height:'auto', overflow:'visible'
    });
  }

  let hovered = null;
  let opened = null;
  function update() {
    const active = hovered ?? opened;
    entries.forEach(({ panel, trigger }, index) => {
      panel.hidden = index !== active;
      trigger.setAttribute('aria-expanded', String(index === active));
    });
    if (active !== null) positionBubble(entries[active]);
    copy.classList.toggle('materials-popup-visible', active === 0);
  }
  function close() {
    hovered = opened = null;
    update();
  }
  entries.forEach(({ trigger }, index) => {
    trigger.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hovered = index;
      update();
    });
    trigger.addEventListener('pointerleave', () => {
      if (hovered === index) hovered = null;
      update();
    });
    trigger.addEventListener('click', event => {
      if (index !== 0 && event.pointerType === 'mouse') return;
      opened = opened === index ? null : index;
      update();
    });
  });
  document.addEventListener('pointerdown', event => {
    if (!entries.some(({ trigger }) => trigger.contains(event.target))) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });
  new MutationObserver(close).observe(world, {
    attributes: true,
    attributeFilter: ['data-settled-section']
  });
  window.addEventListener('resize', update);
  new MutationObserver(() => {
    const active = hovered ?? opened;
    if (active !== null) positionBubble(entries[active]);
  }).observe(world, { attributes: true, attributeFilter: ['style'] });
}

