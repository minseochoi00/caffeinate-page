console.log('script.js loaded');

document.addEventListener('DOMContentLoaded', function() {
  new Vue({
    el: '#app',
    data: {
      isActive: false,
      wakeLock: null,
      // The status message may include HTML (e.g. line breaks, emphasis)
      statusMessage: 'Wake Lock is inactive.',
      maxRedirects: 5
    },
    methods: {
      async requestWakeLock() {
        // Attempt to use the native Wake Lock API first
        if ('wakeLock' in navigator) {
          try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log("Wake Lock activated (native).");
            // When the native wake lock is auto-released, update the status message with a friendly explanation.
            this.wakeLock.addEventListener('release', () => {
              let reason = '';
              if (document.visibilityState !== 'visible') {
                reason = "This site can only keep your device awake if it’s in a foreground tab.";
              } else if (window.scrollY > 0) {
                reason = "Please scroll to the top of the page to keep your device awake.";
              }
              console.log("Wake Lock auto-deactivated.", reason);
              this.isActive = false;
              this.statusMessage = `Wake Lock Deactivated: ${reason}`;
            });
            this.isActive = true;
            this.statusMessage = "Wake Lock Activated: <br><br>Your device will remain awake as long as this tab is in the foreground and scrolled to the top.";
          } catch (err) {
            console.log("Error activating native Wake Lock:", err);
            this.statusMessage = `Failed to obtain native Wake Lock: ${err.message}`;
          }
        }
        // Fallback to sleep.js if the native API is unavailable.
        else if (typeof sleepManager !== 'undefined') {
          try {
            sleepManager.enable();
            console.log("Wake Lock activated (fallback).");
            this.isActive = true;
            this.statusMessage = "Fallback Activated: <br><br>Your device will remain awake as long as this tab is in the foreground and scrolled to the top.";
          } catch (err) {
            console.log("Error activating fallback:", err);
            this.statusMessage = `Failed to activate sleep.js fallback: ${err.message}`;
          }
        }
        else {
          this.statusMessage = 'Wake Lock is not available on this device.';
        }
      },
      // Accepts an optional reason parameter to explain why the wake lock was released.
      async releaseWakeLock(reason = '') {
        if (this.wakeLock) {
          await this.wakeLock.release();
          this.wakeLock = null;
          console.log("Wake Lock deactivated (native).");
        }
        else if (typeof sleepManager !== 'undefined') {
          sleepManager.disable();
          console.log("Wake Lock deactivated (fallback).");
        }
        this.isActive = false;
        // If no custom reason is provided, use a default message.
        this.statusMessage = reason 
          ? `Wake Lock Deactivated: ${reason}` 
          : "Wake Lock is deactivated.";
      },
      toggleWakeLock() {
        // Only the user-activated button toggles the wake lock.
        if (this.isActive) {
          this.releaseWakeLock("You manually deactivated the wake lock.");
        } else {
          this.requestWakeLock();
        }
      },
      handleVisibilityChange() {
        // Re-request the wake lock when the tab becomes visible if it was active before.
        if (document.visibilityState === 'visible' && this.isActive) {
          this.requestWakeLock();
        }
      },
      // This method checks if the page is scrolled away from the top.
      // If so, it releases the wake lock with an explanation.
      checkScrollPosition() {
        if (this.isActive && window.scrollY > 0) {
          this.releaseWakeLock("Please scroll to the top of the page to keep your device awake.");
        }
      },
      checkRedirectCount() {
        let count = Number(sessionStorage.getItem('redirectCount')) || 0;
        count++;
        sessionStorage.setItem('redirectCount', count);
      }
    },
    mounted() {
      this.checkRedirectCount();
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('scroll', this.checkScrollPosition);
    },
    beforeDestroy() {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('scroll', this.checkScrollPosition);
      if (this.wakeLock) {
        this.wakeLock.release();
      }
      if (typeof sleepManager !== 'undefined') {
        sleepManager.disable();
      }
    }
  });
});
