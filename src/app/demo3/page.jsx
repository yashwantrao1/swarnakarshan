'use client';

import Head from 'next/head';
import Script from 'next/script';

export default function Page() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pixel Distortion with Three.js | Demo 3 | Codrops</title>
        <meta
          name="description"
          content="An interactive pixel distortion effect made with Three.js "
        />
        <meta
          name="keywords"
          content="webgl, three.js, pixel, distortion, pixelated, javascript"
        />
        <meta name="author" content="Codrops" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://use.typekit.net/oxr3hup.css" />
        <link rel="stylesheet" href="/css/base.css" />
      </Head>

      {/* Add a 'js' class to <html> equivalent (since we can't edit <html> here) */}
      <Script id="set-js-class" strategy="afterInteractive">
        {`document.documentElement.classList.add('js');`}
      </Script>

      {/* CSS var support check */}
      <Script id="css-var-check" strategy="afterInteractive">
        {`
          (function() {
            var supportsCssVars = function () {
              var e, t = document.createElement("style");
              t.innerHTML = "root: { --tmp-var: bold; }";
              document.head.appendChild(t);
              e = !!(window.CSS && window.CSS.supports && window.CSS.supports("font-weight","var(--tmp-var)"));
              t.parentNode.removeChild(t);
              return e;
            };
            if (!supportsCssVars()) alert("Please view this demo in a modern browser that supports CSS Variables.");
          })();
        `}
      </Script>

      {/* Optional analytics/adpacks — keep or remove */}
      <Script src="//tympanus.net/codrops/adpacks/analytics.js" strategy="afterInteractive" />

      <main className="demo-3">
        <div className="frame">
          <div className="frame__title-wrap">
            <h1 className="frame__title">Pixel Distortion</h1>
            <p className="frame__tagline">with Three.js</p>
          </div>

          <nav className="frame__links">
            <a href="https://tympanus.net/Development/ColumnScroll/">Previous demo</a>
            <a href="https://tympanus.net/codrops/?p=58318">Article</a>
            <a href="https://github.com/akella/DistortedPixels">GitHub</a>
          </nav>

          <nav className="frame__demos">
            <a href="index.html" className="frame__demo">
              demo 1
            </a>
            <a href="index2.html" className="frame__demo">
              demo 2
            </a>
            <a href="index3.html" className="frame__demo frame__demo--current">
              demo 3
            </a>
            <a href="index4.html" className="frame__demo">
              demo 4
            </a>
          </nav>
        </div>

        <div
          id="canvasContainer"
          data-grid="15"
          data-mouse="0.13"
          data-strength="0.15"
        >
          <img src="/img/3.jpg" alt="Pixel distortion source" />
        </div>

        <div className="content">
          <h2 className="content__title content__title--centered content__title--style-2">
            Cold Storage
          </h2>
        </div>
      </main>

      {/* Optional adpacks */}
      <Script src="https://tympanus.net/codrops/adpacks/cda.js" strategy="afterInteractive" />

      {/* Your module script that sets up Three.js app logic */}
      <Script type="module" src="/js/app.js" strategy="afterInteractive" />
    </>
  );
}
