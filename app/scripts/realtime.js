(function () {

  Vue.component('realtime-layer', {
    template: '#realtime-layer-template',
    props: {
      model: {
        type: Object
      }
    },
    data: function() {
      return {
        points: [],
        layerGroup: null
      };
    },
    watch: {
      points: function(points) {
        this.clearMarkers();
        this.createMarkers();
      }
    },
    mounted: function() {
      var url = 'http://127.0.0.1:5000/api/points';
      fetch(url)
        .then((resp) => {
          return resp.json();
        })
        .then((json) => {
          Vue.set(this, 'points', json);
        });

    },
    computed: {
    },
    methods: {
      deferredMountedTo(parent) {
        this.layerGroup = L.layerGroup([]);
        this.layerGroup.addTo(parent);
      },
      createMarkers() {
        _.each(this.points['features'], (feature) => {
          var latlng = new L.latLng(feature.properties.lat, feature.properties.lon);

          var circle = L.circle(latlng, {
            radius: 1000,
            color: 'white',
            stroke: true,
            weight: 2,
            opacity: 0.3,
            fillOpacity: 0.5,
            fill: true,
            fillColor: feature.properties.locationColor,
            feature: feature
          });
          circle.on('click', (evt) => {
            var feature = evt.target.options.feature;
            this.setChart(feature);
          });
          this.layerGroup.addLayer(circle);

        });
      },
      clearMarkers() {
        if (this.layerGroup) {
          this.layerGroup.clearLayers();
        }
      },
      setChart(feature) {
        bus.$emit('feature-selected', feature);
      }
    }
  });

}());
