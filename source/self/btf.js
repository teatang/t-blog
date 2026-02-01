function disableAllSvgWheelEvents() {
  // 获取页面中所有svg元素
  const svgElements = document.getElementsByTagName("svg");
  console.log(svgElements, svgElements.length);

  // 遍历所有svg元素
  for (let i = 0; i < svgElements.length; i++) {
    const svg = svgElements[i];

    // 为svg元素移除wheel事件监听器
    svg.addEventListener("wheel", handleWheelEvent);

    // 为svg内部所有元素移除wheel事件监听器
    const allElements = svg.querySelectorAll("*");
    allElements.forEach((element) => {
      element.addEventListener("wheel", handleWheelEvent);
    });
  }
}

// 事件处理函数（可选，用于移除已存在的监听器）
function handleWheelEvent(event) {
  console.log("add event listen: " + event);
  // 阻止wheel事件的默认行为
  event.preventDefault();
  // 阻止事件冒泡
  event.stopPropagation();
}

(() => {
  const isIncludeEN = (item) => {
    const key = "/en/";
    return item.includes(key);
  };

  window.loadFullPage = (url) => {
    window.location.href = url;
  };

  const eventFn = (elements, includeEN) => {
    elements.forEach((item) => {
      if (!includeEN || !isIncludeEN(item.href)) {
        item.href = `javascript:loadFullPage('${item.href}');`;
      }
    });
  };

  const nowIncludeEN = isIncludeEN(window.location.href);
  const selector = nowIncludeEN
    ? document.querySelectorAll('a[href^="https://butterfly.js.org"]')
    : document.querySelectorAll('a[href^="/en/"]');

  eventFn(selector, nowIncludeEN);
})();

window.onload = function () {
  console.log("页面加载完成！");
  // disableAllSvgWheelEvents();
};
