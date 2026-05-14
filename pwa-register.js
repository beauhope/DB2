(() => {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  function createInstallPrompt() {
    if (document.getElementById("pwaInstallPrompt")) return null;

    const box = document.createElement("div");
    box.id = "pwaInstallPrompt";
    box.className = "pwa-install-prompt";
    box.innerHTML = `
      <div>
        <strong>ثبّت التطبيق</strong>
        <p>احفظ منصة DB2 على جهازك واستعمل الصفحات الأساسية دون إنترنت بعد أول زيارة.</p>
      </div>
      <div class="pwa-install-actions">
        <button type="button" class="pwa-install-main">تثبيت</button>
        <button type="button" class="pwa-install-close" aria-label="إغلاق">×</button>
      </div>
    `;
    document.body.appendChild(box);
    return box;
  }

  let deferredPrompt = null;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // لا نعرض خطأ للطالب؛ الموقع يبقى قابلًا للتصفح حتى إن تعذر التسجيل.
      });
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    if (isStandalone || localStorage.getItem("db2-install-dismissed") === "1") return;

    event.preventDefault();
    deferredPrompt = event;

    const box = createInstallPrompt();
    if (!box) return;

    box.querySelector(".pwa-install-main").addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      box.remove();
    });

    box.querySelector(".pwa-install-close").addEventListener("click", () => {
      localStorage.setItem("db2-install-dismissed", "1");
      box.remove();
    });
  });

  // إرشاد خفيف لمستخدمي iPhone لأن Safari لا يدعم beforeinstallprompt بنفس طريقة Chrome.
  window.addEventListener("load", () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const alreadyDismissed = localStorage.getItem("db2-ios-install-dismissed") === "1";

    if (isIOS && !isStandalone && !alreadyDismissed) {
      setTimeout(() => {
        if (document.getElementById("pwaInstallPrompt")) return;
        const box = document.createElement("div");
        box.id = "pwaInstallPrompt";
        box.className = "pwa-install-prompt";
        box.innerHTML = `
          <div>
            <strong>إضافة إلى الشاشة الرئيسية</strong>
            <p>في iPhone: اضغط زر المشاركة ثم اختر “Add to Home Screen”.</p>
          </div>
          <div class="pwa-install-actions">
            <button type="button" class="pwa-install-close" aria-label="إغلاق">×</button>
          </div>
        `;
        document.body.appendChild(box);
        box.querySelector(".pwa-install-close").addEventListener("click", () => {
          localStorage.setItem("db2-ios-install-dismissed", "1");
          box.remove();
        });
      }, 2200);
    }
  });
})();
