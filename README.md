# moments

Thirty animated ASCII scenes, designed directly with characters. No image filter, dependencies, build step, external fonts, tracking, or paid services.

Open `index.html` or the hosted page. Swipe left/right or use arrow keys. Labels fade after a moment. Add `?clean` for a recording view without labels, and `#/<scene-id>` to start on a specific scene. Browser fullscreen and your device's screen recorder are optional; this page does not request recording or microphone access.

Scenes: bloom, sail, bird, wave, cycle, rain, candle, campfire, moonsea, meteors, dandelion, leaves, snow, lighthouse, lantern, balloon, kite, paperplane, waves, jellyfish, butterfly, sunrise, train, windmill, pendulum, fireflies, aurora, umbrella, swing, sprout.

Each scene is authored in `ascii.js`. `engine.js` draws literal characters on a responsive canvas. Motion follows a repeating phase; the carousel is in `app.js`. Frame rate depends on the device and browser.
