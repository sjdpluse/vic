# Hero scroll smoothing

The runtime manifest already preserves all 240 original timeline positions. Exact consecutive duplicate source frames intentionally reuse the same physical AVIF/WebP object; storing duplicate files would increase requests and bytes without adding a new visual state.

The remaining smoothness problem is input/render coupling: discrete mouse-wheel scroll events can move the requested timeline position by many frames at once, and direct drawing makes that jump visible. Mobile momentum scrolling can expose the same issue when decoding/loading lags behind scroll progress.

The production fix is to decouple scroll input from canvas rendering:

- ScrollTrigger updates a target timeline position only.
- A requestAnimationFrame loop eases the rendered position toward that target at a bounded frame velocity.
- Rendering uses the nearest real timeline frame (no structural cross-fade/ghosting).
- Priority preloading covers the corridor between current and target positions plus the normal preload radius.
- Duplicate timeline positions continue to preserve the original 240-frame timing while sharing the same decoded image object.
- Background preloading still fills the rest of the optimized AVIF/WebP sequence after the critical path.

This keeps the original timing, avoids fake duplicate network assets, and smooths both wheel and touch/momentum scrolling.
