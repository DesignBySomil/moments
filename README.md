# moments

Thirty animated tonal ASCII scenes - dense character fields with ramp shading on saturated color fields, in the spirit of modern ASCII poster art. No image filters, dependencies, build step, external fonts, tracking, or paid services.

Open `index.html` or the hosted page. Swipe left/right or use arrow keys. Labels fade after a moment. Add `?clean` for a recording view without labels, and `#/<scene-id>` to start on a specific scene. Browser fullscreen and your device's screen recorder are optional; this page does not request recording or microphone access.

Scenes: bloom, sail, bird, wave, cycle, rain, candle, campfire, moonsea, meteors, dandelion, leaves, snow, lighthouse, lantern, balloon, kite, paperplane, waves, jellyfish, butterfly, sunrise, train, windmill, pendulum, fireflies, aurora, umbrella, swing, sprout.

Each scene is an animated scalar field authored in `scenes-*.js` over the shared toolkit in `scenes-core.js` (SDFs, directional shading, noise, glow, particle drift). `engine.js` evaluates the field per character cell and draws literal glyphs from a prerendered atlas through a 10-level ramp. Frame rate adapts to the device; grid density adapts to screen size.
