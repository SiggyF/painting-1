function Particles(model, canvas, container) {
  'use strict';
  console.log('creating particle system');
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.canvasIcon = $('#canvas-icon')[0];
  this.drawIcon();
  this.model = model;
  this.icon = 'images/bar.png';
  this.particleAlpha = 0.6;
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

Particles.prototype.drawIcon = function(){
  var ctx = this.canvasIcon.getContext('2d');
  ctx.clearRect(0,0, 10, 10);
  ctx.strokeStyle = d3.hsl(Math.random()*360, 0.5, Math.random());
  ctx.strokeWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.lineTo(10, 5);
  ctx.moveTo(5,5);
  ctx.lineTo(5, 10);
  ctx.stroke();
  if (this.iconTexture) {
    this.iconTexture.update();
  }
};

Particles.prototype.create = function() {
  'use strict';
  // replace it
  // var newParticle = PIXI.Sprite.fromImage(this.icon);
  this.iconTexture = new PIXI.Texture.fromCanvas(this.canvasIcon);
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
  'use strict';
  // clear particles
  this.particles = [];
  this.sprites.removeChildren();
};

Particles.prototype.culling = function (n) {
  'use strict';
  // make sure we have n particles by breeding or culling
  // also update the sprites

  var nCurrent = this.particles.length;
  var nNew = n;

  // culling
  for (var i = nCurrent - 1; i > nNew; i--) {
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
  'use strict';
  var uv = $('#uv')[0];
  if (uv.paused || uv.ended) {
    return;
  }


  var drawing = $('#drawing')[0];
  var drawingctx = drawing.getContext('2d');
  drawingctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  var uvhidden = $('#uvhidden')[0];
  var uvctx = uvhidden.getContext('2d');
  var width = uvhidden.width,
      height = uvhidden.height;
  uvctx.drawImage(uv, 0, 0, width, height);
  var frame = uvctx.getImageData(0, 0, width, height);

  _.each(this.particles, function(particle){
    var idx = (
      Math.round(height - particle.position.y) * width +
        Math.round(particle.position.x)
    ) * 4;
    var u = (frame.data[idx + 0] / 255.0) - 0.5;
    var v = (frame.data[idx + 1] / 255.0) - 0.5;
    v = v * (this.model.flipv ? -1 : 1);
    var mask = (frame.data[idx + 2] / 255.0) > 0.5;
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
      };

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