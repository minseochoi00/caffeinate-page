/*
 * sleep.js - A minimal fallback to prevent device sleep on unsupported platforms.
 * Inspired by NoSleep.js, this script creates a hidden video element that loops a blank video.
 * 
 * Lazy Activation: Nothing in this file is executed automatically on load.
 * The hidden video element is only created when sleepManager.enable() is explicitly called,
 * and removed when sleepManager.disable() is invoked.
 */

var sleepManager = (function() {
  var noSleepVideo = null;
  var enabled = false;

  function enable() {
    if (enabled) return;
    noSleepVideo = document.createElement('video');
    noSleepVideo.setAttribute('playsinline', '');
    noSleepVideo.muted = true;
    noSleepVideo.loop = true;
    // A small blank video encoded as a data URL
    noSleepVideo.src = "data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDFpc28yAAAAAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAA==";
    noSleepVideo.style.display = 'none';
    document.body.appendChild(noSleepVideo);
    noSleepVideo.play().catch(function(err) {
      throw new Error("Playback failed: " + err.message);
    });
    enabled = true;
    console.log('sleep.js fallback enabled.');
  }

  function disable() {
    if (!enabled) return;
    if (noSleepVideo) {
      noSleepVideo.pause();
      noSleepVideo.src = "";
      document.body.removeChild(noSleepVideo);
      noSleepVideo = null;
    }
    enabled = false;
    console.log('sleep.js fallback disabled.');
  }

  return {
    enable: enable,
    disable: disable
  };
})();
