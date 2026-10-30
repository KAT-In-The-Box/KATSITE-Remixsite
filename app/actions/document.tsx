import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'
import { ImportMap } from 'remix/component/server'

import { scriptEntry } from '../assets.ts'

export interface DocumentProps {
  children?: RemixNode
  head?: RemixNode
  title?: string
}

const DEFAULT_TITLE = readAppDisplayName('KaTBox Interactives')

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let { children, head, title = DEFAULT_TITLE } = handle.props
    let { href, importMap, preloads } = scriptEntry

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <link rel="icon" type="image/png" href="/favicon.png" />
          <title>{title}</title>
          {head}
          <ImportMap value={importMap} />
          {preloads.map((preloadHref) => (
            <link key={preloadHref} rel="modulepreload" href={preloadHref} />
          ))}
          <script>
            {`(() => {
                const init = () => {
                  const pill = document.querySelector('[data-katbox-follow-pill]');
                  if (!pill || pill.dataset.followReady) return;
                  pill.dataset.followReady = 'true';
                  let frame = 0;
                  const onMove = (event) => {
                    const rect = pill.getBoundingClientRect();
                    const x = (event.clientX - rect.left) / rect.width;
                    const y = (event.clientY - rect.top) / rect.height;
                    const moveX = (x - 0.5) * 44;
                    const moveY = (y - 0.5) * 24;
                    cancelAnimationFrame(frame);
                    frame = requestAnimationFrame(() => {
                      pill.style.animation = 'none';
                      pill.style.animationPlayState = 'paused';
                      pill.style.transform = 'translate3d(' + moveX.toFixed(1) + 'px, ' + moveY.toFixed(1) + 'px, 0)';
                      pill.style.setProperty('--glow-x', (x * 100).toFixed(1) + '%');
                      pill.style.setProperty('--glow-y', (y * 100).toFixed(1) + '%');
                    });
                  };
                  const onLeave = () => {
                    cancelAnimationFrame(frame);
                    pill.style.transform = 'translate3d(0, 0, 0)';
                    pill.style.setProperty('--glow-x', '50%');
                    pill.style.setProperty('--glow-y', '50%');
                    pill.style.animation = 'katbox-pill-float 6s ease-in-out infinite';
                    pill.style.animationPlayState = '';
                  };
                  pill.addEventListener('pointermove', onMove);
                  pill.addEventListener('pointerleave', onLeave);
                };
                if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
                else init();
              })();`}
          </script>
          <script type="module" src={href}></script>
        </head>
        <body mix={css({ margin: 0 })}>{children}</body>
      </html>
    )
  }
}

function readAppDisplayName(value: string): string {
  return value.startsWith('%%') ? 'Remix App' : decodeURIComponent(value)
}
