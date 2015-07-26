'use strict';

$(function(){
    fetch('/models/models.json')
        .then(function(response) {
            return response.json()
        }).then(function(json) {
            var source   = $("#model-template").html();
            var template = Handlebars.compile(source);
            var html = template(json);
            $('#models').html(html);
            _.map(json.models, function(model){
                // find the model and add a click event to the cog link
                $('#' + model.id).find('a.load-model').click(
                    function(evt){
                        console.log(model);
                        var event = new CustomEvent('model-selected', {'detail': model})
                        document.dispatchEvent(event);
                    }
                );
            });

        }).catch(function(ex) {
            console.log('parsing failed', ex)
        })

});

