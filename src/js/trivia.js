
var GLOBAL_ACTIONS = { // eslint-disable-line
  play: function() {
    window.wavesurfer.playPause();
  },

  back: function() {
    window.wavesurfer.skipBackward();
  },

  forth: function() {
    window.wavesurfer.skipForward();
  },

  'toggle-mute': function() {
    window.wavesurfer.toggleMute();
  }
};

// Bind actions to buttons and keypresses
document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('keydown', function(e) {
    let map = {
      32: 'play', // space
      37: 'back', // left
      39: 'forth' // right
    };
    let action = map[e.keyCode];
    if (action in GLOBAL_ACTIONS) {
      if (document == e.target || document.body == e.target || e.target.attributes['data-action']) {
        e.preventDefault();
      }
      GLOBAL_ACTIONS[action](e);
    }
  });

  [].forEach.call(document.querySelectorAll('[data-action]'), function(el) {
    el.addEventListener('click', function(e) {
      let action = e.currentTarget.dataset.action;
      if (action in GLOBAL_ACTIONS) {
        e.preventDefault();
        GLOBAL_ACTIONS[action](e);
      }
    });
  });
});

