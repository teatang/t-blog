/* ==========================================================
 * Butterfly Tags - Interactive ECharts Word Cloud
 * ========================================================== */

(() => {
  'use strict';

  const ECHARTS_URL =
    'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';

  const WORDCLOUD_URL =
    'https://cdn.jsdelivr.net/npm/echarts-wordcloud@2.1.0/dist/echarts-wordcloud.min.js';

  const CONTAINER_ID = 'tag-wordcloud-box';

  // 判断是否为标签云主页面
  const isTagPage = () => {
    const path = window.location.pathname;
    return (
      path === '/tags/' ||
      path === '/tags' ||
      path === '/tags/index.html' ||
      !!document.querySelector('#page .tag-cloud-list')
    );
  };

  // 防止重复绑定 resize
  let resizeHandler = null;

  // ==========================================================
  // 动态加载 JS
  // ==========================================================

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);

      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }

        existing.addEventListener('load', () => resolve(), {
          once: true
        });

        existing.addEventListener('error', reject, {
          once: true
        });

        return;
      }

      const script = document.createElement('script');

      script.src = src;
      script.async = true;

      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  };

  // ==========================================================
  // 获取标签
  // ==========================================================

  const getTagElements = () => {
    const selectors = [
      '.tag-cloud-list a',
      '.tag-cloud a',
      '.card-tag-all a'
    ];

    const elements = [];

    selectors.forEach(selector => {
      document
        .querySelectorAll(selector)
        .forEach(el => {
          if (!elements.includes(el)) {
            elements.push(el);
          }
        });
    });

    // 如果 Butterfly 结构发生变化，再使用通用选择器兜底
    if (elements.length === 0) {
      document
        .querySelectorAll('a[href^="/tags/"]')
        .forEach(el => {
          if (!elements.includes(el)) {
            elements.push(el);
          }
        });
    }

    return elements;
  };

  // ==========================================================
  // 获取文章数量
  // ==========================================================

  const getTagCount = (tagName) => {
    // 剔除年份标签如2025，2026
    if (window.__TAG_DATA__ && window.__TAG_DATA__[tagName] != null && !/^\d{4}$/.test(tagName)) {
      return window.__TAG_DATA__[tagName];
    }
    return 1;
  };

  // ==========================================================
  // 获取标签文字
  // ==========================================================

  const getTagName = (el) => {
    // 优先使用 title / aria-label
    const title = el.getAttribute('title');

    if (title && title.trim()) {
      return title.trim();
    }

    const ariaLabel = el.getAttribute('aria-label');

    if (ariaLabel && ariaLabel.trim()) {
      return ariaLabel.trim();
    }

    // 排除常见的文章数量元素
    const clone = el.cloneNode(true);

    clone
      .querySelectorAll(
        '.tag-count, .count, .tag-counts, .card-tag-count'
      )
      .forEach(node => node.remove());

    return clone.textContent
      .replace(/\s+/g, ' ')
      .trim();
  };

  // ==========================================================
  // 构造 WordCloud Data
  // ==========================================================

  const buildData = () => {
    const tagElements = getTagElements();

    if (!tagElements.length) {
      console.warn('[WordCloud] No tag elements found.');
      return {
        data: [],
        links: {}
      };
    }

    const data = [];
    const links = {};
    const exists = new Set();

    tagElements.forEach(el => {
      const href = el.getAttribute('href');

      if (
        !href ||
        href === '/tags/' ||
        href === '/tags'
      ) {
        return;
      }

      const text = getTagName(el);

      if (!text || exists.has(text)) {
        return;
      }

      const count = getTagCount(text);

      exists.add(text);

      data.push({
        name: text,

        // value 使用真实文章数量
        value: count,

        // 保留真实文章数量
        realCount: count,

        // 后面根据文章数量计算
        fontSize: 20
      });

      links[text] = href;
    });

    if (!data.length) {
      return {
        data: [],
        links: {}
      };
    }

    // ========================================================
    // 计算字号
    //
    // 使用 sqrt 而不是 log：
    //
    // 1 篇   -> 小
    // 4 篇   -> 较小
    // 10 篇  -> 中等
    // 40 篇  -> 较大
    // 197 篇 -> 最大
    //
    // 可以避免 197 篇把其它标签压得太小。
    // ========================================================

    const maxCount = Math.max(
      ...data.map(item => item.realCount)
    );

    const minFontSize = 20;
    const maxFontSize = 90;

    data.forEach(item => {
      if (maxCount <= 0) {
        item.fontSize = minFontSize;
        return;
      }

      const ratio = item.realCount / maxCount;

      item.fontSize = Math.round(
        minFontSize +
        Math.sqrt(ratio) *
          (maxFontSize - minFontSize)
      );
    });

    // 调试信息
    console.group('[WordCloud] Data');

    console.table(
      data.map(item => ({
        name: item.name,
        count: item.realCount,
        value: item.value,
        fontSize: item.fontSize
      }))
    );

    console.log(
      'Count Range:',
      Math.min(...data.map(item => item.realCount)),
      '-',
      maxCount
    );

    console.log(
      'Font Size Range:',
      Math.min(...data.map(item => item.fontSize)),
      '-',
      Math.max(...data.map(item => item.fontSize))
    );

    console.groupEnd();

    return {
      data,
      links
    };
  };

  // ==========================================================
  // 获取主题颜色
  // ==========================================================

  const getColors = () => {
    const isDark =
      document.documentElement.getAttribute(
        'data-theme'
      ) === 'dark';

    if (isDark) {
      return [
        '#818cf8',
        '#38bdf8',
        '#a78bfa',
        '#f472b6',
        '#34d399',
        '#fbbf24',
        '#60a5fa',
        '#e879f9',
        '#2dd4bf',
        '#fb7185'
      ];
    }

    return [
      '#6366f1',
      '#0ea5e9',
      '#8b5cf6',
      '#ec4899',
      '#10b981',
      '#f59e0b',
      '#3b82f6',
      '#d946ef',
      '#059669',
      '#e11d48'
    ];
  };

  // ==========================================================
  // 创建 / 获取容器
  // ==========================================================

  const getContainer = () => {
    let container =
      document.getElementById(CONTAINER_ID);

    if (container) {
      return container;
    }

    // 原始标签列表
    const originalList =
      document.querySelector(
        '#page .tag-cloud-list, .tag-cloud-list, .tag-cloud, .card-tag-all'
      );

    if (!originalList) {
      return null;
    }

    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = 'loading';

    if (originalList.parentNode) {
      originalList.parentNode.insertBefore(
        container,
        originalList
      );
    }

    return container;
  };

  // ==========================================================
  // 渲染词云
  // ==========================================================

  const renderWordCloud = () => {
    if (!window.echarts) {
      console.error(
        '[WordCloud] ECharts is not loaded.'
      );
      return;
    }

    if (
      typeof window.echarts.graphic === 'undefined'
    ) {
      console.error(
        '[WordCloud] ECharts initialization failed.'
      );
      return;
    }

    const {
      data,
      links
    } = buildData();

    if (!data.length) {
      return;
    }

    const container = getContainer();

    if (!container) {
      console.warn(
        '[WordCloud] Container not found.'
      );
      return;
    }

    // --------------------------------------------------------
    // 如果已经存在实例，先销毁
    // --------------------------------------------------------

    const oldChart =
      window.echarts.getInstanceByDom(
        container
      );

    if (oldChart) {
      oldChart.dispose();
    }

    const chart =
      window.echarts.init(container);

    const isDark =
      document.documentElement.getAttribute(
        'data-theme'
      ) === 'dark';

    const colors = getColors();

    // ========================================================
    // ECharts Option
    // ========================================================

    const option = {
      backgroundColor: 'transparent',

      tooltip: {
        show: true,

        backgroundColor: isDark
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',

        borderColor: isDark
          ? 'rgba(129, 140, 248, 0.4)'
          : 'rgba(99, 102, 241, 0.3)',

        borderWidth: 1,

        textStyle: {
          color: isDark
            ? '#e5e7eb'
            : '#374151'
        },

        formatter: function (params) {
          const count =
            params.data?.realCount ??
            params.value ??
            0;

          return `
            🏷️ 标签：${params.name}
            <br/>
            📚 文章数：${count}
          `;
        }
      },

      series: [
        {
          type: 'wordCloud',

          shape: 'circle',
          left: 'center',
          top: 'center',
          width: '100%',
          height: '100%',

          // --------------------------------------------------
          // 保留范围，但字号已经通过 fontSize 明确计算
          // --------------------------------------------------

          sizeRange: [20, 90],

          rotationRange: [-15, 15],

          rotationStep: 15,

          gridSize: 5,

          drawOutOfBound: false,

          layoutAnimation: true,

          // --------------------------------------------------
          // 词云文字样式
          // --------------------------------------------------

          textStyle: {
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

            fontWeight: 'bold',

            // 根据真实文章数量计算字号
            fontSize: function (params) {
              return params.data.fontSize;
            },

            color: function () {
              return colors[
                Math.floor(
                  Math.random() *
                    colors.length
                )
              ];
            }
          },

          emphasis: {
            focus: 'self',

            textStyle: {
              shadowBlur: 20,

              shadowColor: isDark
                ? 'rgba(129, 140, 248, 0.9)'
                : 'rgba(99, 102, 241, 0.7)'
            }
          },

          data
        }
      ]
    };

    chart.setOption(option);
    container.classList.remove('loading');

    // ========================================================
    // 隐藏原始标签列表
    // ========================================================

    const originalList =
      document.querySelector(
        '#page .tag-cloud-list, .tag-cloud-list, .tag-cloud, .card-tag-all'
      );

    if (originalList) {
      originalList.style.display = 'none';
    }

    // ========================================================
    // 点击标签
    // ========================================================

    chart.off('click');

    chart.on(
      'click',
      function (params) {
        if (
          params.name &&
          links[params.name]
        ) {
          window.location.href =
            links[params.name];
        }
      }
    );

    // ========================================================
    // Resize
    // ========================================================

    if (resizeHandler) {
      window.removeEventListener(
        'resize',
        resizeHandler
      );
    }

    resizeHandler = () => {
      const instance =
        window.echarts.getInstanceByDom(
          container
        );

      if (instance) {
        instance.resize();
      }
    };

    window.addEventListener(
      'resize',
      resizeHandler
    );

    // ========================================================
    // 暗色 / 亮色模式变化
    // ========================================================

    const observer =
      new MutationObserver(() => {
        const currentChart =
          window.echarts.getInstanceByDom(
            container
          );

        if (!currentChart) {
          return;
        }

        const newColors =
          getColors();

        currentChart.setOption({
          series: [
            {
              textStyle: {
                color: function () {
                  return newColors[
                    Math.floor(
                      Math.random() *
                        newColors.length
                    )
                  ];
                }
              }
            }
          ]
        });
      });

    observer.observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: ['data-theme']
      }
    );
  };

  // ==========================================================
  // 初始化
  // ==========================================================

  const init = async () => {
    try {
      const originalList = document.querySelector(
        '#page .tag-cloud-list, .tag-cloud-list, .tag-cloud, .card-tag-all'
      );
      if (originalList) {
        originalList.style.display = 'none';
      }

      // 优先创建容器以展示 loading
      getContainer();

      // ECharts
      if (!window.echarts) {
        await loadScript(ECHARTS_URL);
      }

      // WordCloud 插件
      if (
        !window.echartsWordCloud &&
        !window.echarts?.wordCloud
      ) {
        await loadScript(WORDCLOUD_URL);
      }

      renderWordCloud();
    } catch (error) {
      console.error(
        '[WordCloud] Initialization failed:',
        error
      );

      // 加载失败时降级恢复原生列表
      const originalList = document.querySelector(
        '#page .tag-cloud-list, .tag-cloud-list, .tag-cloud, .card-tag-all'
      );
      if (originalList) {
        originalList.style.display = '';
      }
      const container = document.getElementById(CONTAINER_ID);
      if (container) {
        container.remove();
      }
    }
  };

  // ==========================================================
  // PJAX
  // ==========================================================

  const run = () => {
    if (isTagPage()) {
      init();
    }
  };

  if (
    window.btf &&
    window.btf.addGlobalFn
  ) {
    window.btf.addGlobalFn(
      'pjaxComplete',
      run,
      'wordCloud'
    );
  }

  // ==========================================================
  // DOM Ready
  // ==========================================================

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      run,
      { once: true }
    );
  } else {
    run();
  }

})();