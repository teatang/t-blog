// 黑客帝国 代码雨特效
(function () {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvas_matrix"); // 设置ID
  // 直接在这里设置宽高，确保在添加到DOM前尺寸是正确的
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.setAttribute(
    "style",
    "position: fixed; left: 0; top: 0; pointer-events: none; display: block;"
  ); // 样式也可直接在JS中设置
  document.body.appendChild(canvas); // 将canvas添加到body

  const pen = canvas.getContext("2d");

  // 关键修复：设置字体大小
  const fontSize = 16; // 设置字体大小，可以根据需要调整
  pen.font = `${fontSize}px monospace`; // 设置字体和大小，monospace确保等宽

  // 计算列数，基于字体大小
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(0); // 初始所有雨滴都从顶部开始

  // 字符集
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:",./<>?~`';

  let random_char = () => {
    return characters[Math.floor(Math.random() * characters.length)];
  };

  // 使用 setInterval 模拟，但 `requestAnimationFrame` 更优
  // 每次更新的间隔，数字越小越快
  const animationInterval = 50; // 毫秒，每50ms更新一次，相当于20帧/秒
  // 您原来是 100ms，即 10 帧/秒

  let lastTime = 0; // 用于deltaTime
  let animationSpeed = 1; // 基础速度乘数，这里先固定为1

  function draw(timestamp) {
    // 如果使用 requestAnimationFrame，这里就不需要 setInterval
    // deltaTime 逻辑是为了确保动画速度一致性，但你原来的setInterval就没有用这个
    // 如果你坚持用 setInterval，这部分就不需要了

    // 如果用 requestAnimationFrame，这里需要 deltaTime
    // if (!lastTime) lastTime = timestamp;
    // const deltaTime = timestamp - lastTime;
    // lastTime = timestamp;

    // 绘制背景，带有透明度，形成拖影效果
    pen.fillStyle = "rgba(0,0,0,0.05)";
    pen.fillRect(0, 0, canvas.width, canvas.height);

    pen.fillStyle = "#0f0"; // 字符颜色

    drops.forEach((y, i) => {
      const text = random_char();
      // i * fontSize 是 X 坐标
      // y * fontSize 是 Y 坐标
      pen.fillText(text, i * fontSize, y * fontSize);

      // 更新下一个字符的 Y 坐标
      // 如果字符到达底部，或者随机几率重置（形成随机长度的雨滴）
      if (y * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0; // 重置到顶部
      } else {
        drops[i]++; // 下落一行
      }
    });

    // requestAnimationFrame(draw); // 如果你选择用 requestAnimationFrame

    // 如果使用 setInterval，这里就不需要 requestAnimationFrame
  }

  // --- 使用 setInterval 的版本 (与您原有代码更接近，但优化了) ---
  let intervalId = setInterval(() => {
    // 在 setInterval 中，没有 timestamp，所以不能用 requestAnimationFrame 的 deltaTime 概念。
    // 而是通过调整 intervalId 的时间间隔来控制速度。
    drawWithInterval();
  }, animationInterval);

  function drawWithInterval() {
    // 绘制背景，带有透明度，形成拖影效果
    pen.fillStyle = "rgba(0,0,0,0.05)";
    pen.fillRect(0, 0, canvas.width, canvas.height);

    pen.fillStyle = "#0f0"; // 字符颜色

    drops.forEach((y, i) => {
      const text = random_char();
      pen.fillText(text, i * fontSize, y * fontSize); // 绘制字符

      // 更新下一个字符的 Y 坐标
      // 如果字符到达底部，或者随机几率重置（形成随机长度的雨滴）
      if (y * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0; // 重置到顶部
      } else {
        drops[i]++; // 下落一行
      }
    });
  }

  // 响应窗口大小变化
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // 重新计算列数并初始化 drops 数组
    const newColumns = Math.floor(canvas.width / fontSize);
    drops.length = 0; // 清空
    for (let i = 0; i < newColumns; i++) {
      drops.push(0); // 从顶部开始
    }
    pen.font = `${fontSize}px monospace`; // 重新设置字体，因为canvas重置了
  });

  // 启动动画
  // 如果使用 requestAnimationFrame，就在这里调用 draw(0)
  // requestAnimationFrame(draw); // 首次启动，传递一个初始时间戳
})();
