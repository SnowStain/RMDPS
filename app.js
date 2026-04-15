// 模拟微信小程序环境
const wx = {
  getWindowInfo() {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      statusBarHeight: 24,
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };
  },
  getSystemInfoSync() {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      statusBarHeight: 24,
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };
  },
  getMenuButtonBoundingClientRect() {
    return {
      bottom: 50,
      height: 32,
      left: window.innerWidth - 100,
      right: window.innerWidth - 20,
      top: 18,
      width: 80
    };
  },
  createSelectorQuery() {
    return {
      in() {
        return this;
      },
      select(selector) {
        return {
          boundingClientRect(callback) {
            const element = document.querySelector(selector);
            if (element) {
              const rect = element.getBoundingClientRect();
              callback(rect);
            } else {
              callback(null);
            }
            return this;
          },
          exec() {}
        };
      }
    };
  },
  nextTick(callback) {
    setTimeout(callback, 0);
  },
  onThemeChange(callback) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      callback({ theme: e.matches ? 'dark' : 'light' });
    });
  },
  offThemeChange(callback) {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', callback);
  },
  navigateTo(options) {
    console.log('navigateTo:', options);
  },
  setClipboardData(options) {
    console.log('setClipboardData:', options);
  }
};

// 模拟App函数
function App(options) {
  if (options.onShow) {
    options.onShow();
  }
}

// 模拟Page函数
function Page(options) {
  // 初始化页面
  if (options.onLoad) {
    options.onLoad();
  }
  
  // 模拟页面就绪
  setTimeout(() => {
    if (options.onReady) {
      options.onReady();
    }
  }, 100);
  
  // 模拟页面卸载
  window.addEventListener('beforeunload', () => {
    if (options.onUnload) {
      options.onUnload();
    }
  });
  
  // 模拟页面滚动
  window.addEventListener('scroll', (event) => {
    if (options.onPageScroll) {
      options.onPageScroll({ scrollTop: window.scrollY });
    }
  });
  
  // 暴露页面实例
  window.pageInstance = options;
}

// 全局变量
globalThis.wx = wx;
globalThis.App = App;
globalThis.Page = Page;
