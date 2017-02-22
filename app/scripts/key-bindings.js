/* global bus */
(function () {
  'use strict';

  Vue.component('key-bindings', {
    template: '#key-bindings-template',
    data: function() {
      var app = this.$root;
      return {
        keyBindings: [
          {
            key: 'p',
            description: 'Particles',
            method: () => {
              if (_.has(app, '$refs.particleComponent.add')) {
                app.$refs.particleComponent.add();
              }
            },
            arguments: {}
          },
          {
            key: 'c',
            method: () => {
              this.clear();
            },
            description: 'Clear canvas',
            arguments: {}
          },
          {
            key: 'q',
            description: 'Quiver like plot',
            method: () => {
              app.$refs.drawingCanvas.quiver();

            }
          },
          {
            key: 'g',
            description: 'Grid plot',
            method: (evt, drawing) => {
              app.$refs.drawingCanvas.grid();
            }
          }
        ]
      };
    },
    mounted: function() {
      window.addEventListener('keyup', this.keyUp);
      bus.$on('drawing-keydown', this.drawingKey);
    },
    methods: {
      drawingKey: function(evt, drawing) {
        var keyBinding = _.first(
          _.filter(this.keyBindings, ['key', evt.key])
        );
        if (!_.isNil(keyBinding)) {
          keyBinding.method(evt, drawing);
        }
      },
      keyUp: function(evt) {
        var keyBinding = _.first(
          _.filter(this.keyBindings, ['key', evt.key])
        );
        if (!_.isNil(keyBinding)) {
          keyBinding.method(keyBinding.arguments);
        }
      },
      clear: function() {
        var app = this.$root;
        // TODO: first make a button to add particles
        // app.$refs.particleComponent.removeParticles();
        if (_.has(app.$refs, 'drawingCanvas')) {
          app.$refs.drawingCanvas.clear();
        } else {
          console.warn('Expected drawingCanvas on', app.$refs);
        }
        if (_.has(app.$refs, 'modelCanvas')) {
          app.$refs.modelCanvas.clear();
        } else {
          console.warn('Expected modelCanvas on', app.$refs);
        }
        if (_.has(app.$refs, 'particleComponent')) {
          app.$refs.particleComponent.clear();
        } else {
          console.warn('Expected particleCanvas on', app.$refs);
        }

      }
    }
  });

}());
