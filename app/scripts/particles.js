/* global bus */
(function () {
  'use strict';

  function Particles(model, canvas, container, uv) {
    this.model = model;
    this.canvas = canvas;
    this.uv = uv;
    this.width = canvas.width;
    this.height = canvas.height;
    this.canvasIcon = $('#canvas-icon')[0];
    this.drawDot();
    this.icon = 'images/bar.png';
    this.particleAlpha = 0.8;
    this.tailLength = 0;
    this.replace = true;
    this.particles = [];
    this.sprites = new PIXI.ParticleContainer(0, {
      scale: true,
      position: true,
      rotation: true,
      uvs: true,
      alpha: true
    });
    container.addChild(this.sprites);
    this.counter = 0;
    this.iconTexture = null;
  }


  Particles.prototype.drawElipse = function(){
    var ctx = this.canvasIcon.getContext('2d');
    ctx.clearRect(0, 0, 10, 10);
    ctx.fillStyle = 'rgba(200, 220, 240, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeWidth = 'rgba(255, 255, 255)';
    ctx.beginPath();
    ctx.ellipse(5, 5, 2, 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    if (this.iconTexture) {
      this.iconTexture.update();
    }
  };
  Particles.prototype.drawDot = function(){
    var ctx = this.canvasIcon.getContext('2d');
    ctx.clearRect(0, 0, 10, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.beginPath();
    ctx.arc(5, 5, 1, 0, 2 * Math.PI);
    ctx.fill();
    if (this.iconTexture) {
      this.iconTexture.update();
    }
  };

  Particles.prototype.create = function() {
    // replace it
    // var newParticle = PIXI.Sprite.fromImage(this.icon);
    this.iconTexture = PIXI.Texture.fromCanvas(this.canvasIcon);
    var newParticle = new PIXI.Sprite(this.iconTexture);
    // set anchor to center
    newParticle.anchor.set(0.5);
    newParticle.alpha = this.particleAlpha;
    newParticle.x = Math.random() * this.width;
    newParticle.y = Math.random() * this.height;
    // keep track of a tail
    newParticle.tail = [];
    return newParticle;
  };

  Particles.prototype.clear = function () {
    // clear particles
    this.particles = [];
    this.sprites.removeChildren();
  };

  Particles.prototype.culling = function (n) {
    // make sure we have n particles by breeding or culling
    // also update the sprites

    var nCurrent = this.particles.length;
    var nNew = n;

    // culling
    for (var i = nCurrent - 1; i >= nNew; i--) {
      _.pullAt(this.particles, i);
      this.sprites.removeChildAt(i);
    }

    // add extra particles
    for(var j = 0; j < nNew - nCurrent; j++) {
      var newParticle = this.create();
      // add to array and to particle container
      this.particles.push(newParticle);
      this.sprites.addChild(newParticle);
    }
  };

  Particles.prototype.step = function () {
    if (!this.particles.length) {
      return;
    }
    if (this.uv.paused || this.uv.ended) {
      return;
    }


    var drawing = $('#drawing')[0];
    var drawingctx = drawing.getContext('2d');
    drawingctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    var uvhidden = $('#uvhidden')[0];
    var uvctx = uvhidden.getContext('2d');
    var width = uvhidden.width,
        height = uvhidden.height;

    // TODO: this is expensive
    uvctx.drawImage(this.uv, 0, 0, width, height);
    var frame = uvctx.getImageData(0, 0, width, height);
    // TODO: use this instead of frame.data
    // var frameBuffer = new Uint32Array(frame.data.buffer);

    _.each(this.particles, (particle) => {
      var idx = (
        Math.round(height - particle.position.y) * width +
          Math.round(particle.position.x)
      ) * 4;
      var u = (frame.data[idx + 0] / 255.0) - 0.5;
      var v = (frame.data[idx + 1] / 255.0) - 0.5;
      v = v * (this.model.flipv ? -1 : 1);
      // is blue
      var mask = (frame.data[idx + 2] / 255.0) > 0.5;
      // velocity is zero
      mask = mask || (Math.abs(u) + Math.abs(v) === 0.0);
      // update the position
      particle.position.x = particle.position.x + u * this.model.scale;
      particle.position.y = particle.position.y + v * this.model.scale;
      mask = mask || particle.position.x > width;
      mask = mask || particle.position.x < 0;
      mask = mask || particle.position.y > height;
      mask = mask || particle.position.y < 0;
      // how do we get nans here....
      mask = mask || isNaN(particle.position.x);
      mask = mask || isNaN(particle.position.y);

      // var newRotation = Math.atan2(u, v * (this.model.flipv ? -1 : 1)) - (0.5 * Math.PI);
      var newRotation = Math.atan2(v, u ) - (0.5 * Math.PI);
      // TODO: fix circles (mod something...)
      var rotationDiff = newRotation - particle.rotation;
      var maxRotation = 0.1;
      if (Math.abs(rotationDiff) > maxRotation) {
        // limit
        rotationDiff = rotationDiff > 0.0 ? maxRotation : -maxRotation;
      }
      particle.rotation += rotationDiff;

      // replace dead particles
      if (mask) {
        _.pull(this.particles, particle);
        this.sprites.removeChild(particle);

        // // replace it
        if (this.replace) {
          var newParticle = this.create();
          // add to array and to particle container
          this.particles.push(newParticle);
          this.sprites.addChild(newParticle);
        }

      }
      if (this.particles.length < 300 ) {
        // if we don't have too many particles, keep track of the tail
        // but only every 10 timesteps

        if ((this.counter % 10) === 0) {
          // add the current position to the tail (at the right)
          particle.tail.push(_.clone(particle.position));
          while (particle.tail.length > this.tailLength) {
            // remove from the left
            particle.tail.shift();
          }

        }
        if (particle.tail.length > 0) {
          drawingctx.beginPath();
          drawingctx.moveTo(particle.tail[0].x, particle.tail[0].y);
          for(var j = 1; j < particle.tail.length; j++) {
            drawingctx.lineTo(particle.tail[j].x, particle.tail[j].y);
          }
          drawingctx.stroke();
        }
      }
    }, this);
    this.counter++;
  };



  Vue.component('particle-component', {
    template: '#particle-component-template',
    props: ['model', 'sketch', 'pipeline'],
    data: function() {
      return {
      };
    },
    mounted: function() {
      // find the first video in this container
      bus.$on('model-selected', this.resetParticles);
    },
    watch: {
      'model.uv': 'resetParticles',
      'sketch': 'resetParticles',
      'pipeline': 'resetParticles'
    },
    methods: {
      resetParticles: function(){
        if (_.isNil(this.model)) {
          console.warn('no model, no particles', this.model);
          return;
        }
        if (_.isNil(this.sketch)){
          console.warn('no canvas, no particles', this.sketch);
          return;
        }
        if (_.isNil(this.pipeline)) {
          console.warn('no pipeline, no particles', this.pipeline);
          return;
        }
        var uv = $('#uv-' + this.model.uv.tag)[0];

        this.model.particles = new Particles(this.model, this.sketch.element, this.pipeline, uv);
      },
      addParticles: function() {
        console.log('adding particles');
        if (!_.isNil(this.model.particles)) {
          var particles = this.model.particles;
          particles.culling(particles.particles.length + 50);
        }
      },
      removeParticles: function() {
        this.model.particles.culling(0);
      }
    }
  });




}());
