(function () {
  'use strict';

  Vue.component('painting-palettes', {
    template: '#paintings-template',
    data: () => {
      return {
        paintings: []
      };
    },
    ready: function() {
      fetch('data/paintings.json')
        .then((resp) => {
          return resp.json();
        })
        .then((json) => {
          // 'http://www.colourlovers.com/api/palettes/top?format=json',
          this.paintings = json;
          // select the first one
          this.select(this.paintings[0]);
        });
    },
    methods: {
      select: function(painting){
        this.$dispatch('palette-selected', painting.palette);
        selectPalette(painting.palette);
      }
    }
  });


  /* global sketch */
  var width = 300,
      height = 200;
  var svg = d3.select('#paintings').append('svg');
  var circles = svg
        .append('g');

  svg
    .attr('width', width)
    .attr('height', height);
  var x = d3.scale.linear()
        .range([0, width])
        .domain([-0.1, 1.1]).nice();

  var y = d3.scale.linear()
        .range([height, 0])
        .domain([-0.1, 1.1]).nice();


  function updateColors(){
    // Select all colors
    var colors = [];
    d3.selectAll('circle.active').each(function(d){
      var color = d3.rgb(d.rgb[0] * 255, d.rgb[1] * 255, d.rgb[2] * 255);
      colors.push(color);
    });
    sketch.palette = colors;
  }


  d3.select('#paintingsclear')
    .on('click', function(){
      d3.selectAll('circle.active').classed('active', false);
      updateColors();
    });

  d3.select('#paintingsall')
    .on('click', function(){
      d3.selectAll('circle').classed('active', true);
      updateColors();
    });



  function selectPalette(palette) {
    // use palette
    circles
      .selectAll('circle')
      .remove();
    circles
      .selectAll('circle')
      .data(palette)
      .enter()
      .append('circle')
      .attr('cx', function(d){return x(d.x); })
      .attr('cy', function(d){return y(d.y); })
      .attr('r', 10)
      .style('fill', function(d) {
        return d3.rgb(d.rgb[0] * 255, d.rgb[1] * 255, d.rgb[2] * 255);
      })
      .on('click', function(d){
        // toggle active
        d3.select(this)
          .classed('active', !d3.select(this).classed('active'));
        updateColors();
      });
    // by default select all circles
    circles
      .selectAll('circle')
      .classed('active', true);
    updateColors();


  }


  // select palette if model is loaded
  document.addEventListener('model-loaded', function(evt){
    var model = evt.detail;
    updateColors();
  });

}());
