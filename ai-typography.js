async function applyAITypography() {
  const words = [...document.querySelectorAll('.ai-word')];
  const faces = [...new Set(words.map(word => word.dataset.font))];
  const loaded = await Promise.allSettled(faces.map(face => document.fonts.load(`10px "${face}"`)));
  document.documentElement.dataset.fontFailures = faces.filter((_, index) => loaded[index].status === 'rejected').join(',');
  await document.fonts.ready;

  // Original 10-point text blocks, identified by their Illustrator baselines.
  const bodyBlocks = [
    [2828, 2902], [3089, 3103], [3182, 3196], [3837, 4042],
    [6170, 6479], [6780, 6889], [8177, 8199], [8305, 8448],
    [9779, 9829], [10144, 10158], [10484, 10497], [10781, 10806],
    [11077, 11102]
  ];
  const lineOffsets = new Map();
  for (const [top, bottom] of bodyBlocks) {
    const baselines = [...new Set(words
      .filter(word => Number(word.dataset.size) === 10)
      .map(word => Math.round(parseFloat(word.style.top) * 10) / 10)
      .filter(y => y >= top && y <= bottom))].sort((a, b) => a - b);
    baselines.forEach((y, index) => lineOffsets.set(y, index));
  }
  const context = document.createElement('canvas').getContext('2d');
  const baselines = new Map();
  let previous = null;
  let addedWidth = 0;

  for (const word of words) {
    const face = word.dataset.font;
    const originalSize = Number(word.dataset.size);
    // One Illustrator point is one map unit at the existing artwork scale.
    const size = originalSize <= 10 ? originalSize + 1 : originalSize;
    const x = parseFloat(word.style.left);
    const y = parseFloat(word.style.top);
    if (!previous || Math.abs(y - previous.y) > 0.15 || x <= previous.x) addedWidth = 0;

    word.style.left = `${x + addedWidth}px`;
    if (originalSize === 10) {
      const extraLeading = lineOffsets.get(Math.round(y * 10) / 10) ?? 0;
      word.style.top = (y + extraLeading) + 'px';
    }
    word.style.fontSize = `${size}px`;
    context.font = `${size}px "${face}"`;
    const key = context.font;
    if (!baselines.has(key)) {
      const metrics = context.measureText('Hg');
      baselines.set(key, (size + metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2);
    }
    word.style.setProperty('--baseline-offset', baselines.get(key));

    if (size !== originalSize) {
      const enlargedWidth = context.measureText(word.textContent).width;
      context.font = `${originalSize}px "${face}"`;
      addedWidth += enlargedWidth - context.measureText(word.textContent).width;
    }
    previous = { x, y };
  }
  document.documentElement.dataset.typographyReady = 'true';
}

