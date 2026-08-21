(function () {
  // رقم الإصدار: غيّره (زوّد الرقم) كل ما تعدّل أي كود في مجلد vitwar وترفعه،
  // عشان أجهزة العملاء تاخد النسخة الجديدة فورًا من غير ما تتعلق بكاش المتصفح القديم
  var VERSION = "2";
  var b = "vitwar/";
  var f = [
    "a7x_92kdoq1le.js",
    "f0_qpxle839kdr.js",
    "k3o9_fpqxleta2.js",
    "q83_lkxpe09fdz.js",
    "z9ox_83kfpqled1.js",
    "d19_fkoxpqle83z.js",
    "x02_9fdklqpe83r.js",
    "m4v_720xzqklpwe.js",
    "992~+_diwe442ox.js",
    "p6t_31yforzxqkl.js"
  ];

  function load(i) {
    if (i >= f.length) return;
    fetch(b + f[i] + "?v=" + VERSION, { cache: "force-cache" })
      .then(function (r) { return r.text(); })
      .then(function (code) {
        var s = document.createElement("script");
        s.text = code;
        document.head.appendChild(s);
        load(i + 1);
      })
      .catch(function (e) { console.error(e); load(i + 1); });
  }

  load(0);
})();
