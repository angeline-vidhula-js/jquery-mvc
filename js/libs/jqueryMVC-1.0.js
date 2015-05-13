// File: jqueryMVC-1.0.js
// Version: 1.0
// Author: Angeline Vidhula Jeyachandra
// Created Date: 05/05/2015
// Description: A simple MVC module using JQuery
// JQuery Version: jquery-1.11.2.min.js
// Code Tested: 
(function ($) {
    function tryParseJSON (jsonString){
        try {
            var o = JSON.parse(jsonString);
            if (o && typeof o === "object" && o !== null) {
                return o;
            }
        }
        catch (e) {
            return false;
        }
        return false;
    };
    $.JQMVCComponent = {};
    $.extend({
        Model: function(params) {
            var me = this,
                $me = $(me),
                modelData = {
                    value: {
                        current: null,
                        existing: null
                    }
                };
            // ajax fetch data
            me.getAjax = function (ajaxObj) {
                $.ajax({                    
                    url: ajaxObj.url,
                    async: true,
                    beforeSend: function () {
                        // before trigger of ajax call
                        // callback
                        if ($.isFunction(ajaxObj.beforeSend)) {
                            ajaxObj.beforeSend();
                        }
                        $me.trigger('updateModel');
                    },
                    success: function(data, status, httpObj) {
                        // on success of ajax call
                        var dataObj;
                        modelData.value.existing = modelData.value.current;
                        dataObj = tryParseJSON(data);
                        if(dataObj) {
                            modelData.value.current = dataObj
                        } else {
                            modelData.value.current = data;
                        }
                        // callback
                        if ($.isFunction(ajaxObj.success)) {
                            ajaxObj.success(modelData.value.current, status);
                        }
                        $me.trigger('updateModel');
                    },
                    error: function (httpObj, status, error) {
                        // on failure of ajax call
                        // callback
                        if ($.isFunction(ajaxObj.error)) {
                            ajaxObj.error(status);
                        }
                    },
                    complete: function () {
                        // completion of ajax call
                        // callback
                        if ($.isFunction(ajaxObj.complete)) {
                            ajaxObj.complete();
                        }
                    }
                });
            };
            // get model data
            me.getData = function () {
                return modelData.value.current;
            };
            // set model data
            me.setData = function (newData) {
                modelData.value.existing = modelData.value.current;
                modelData.value.current = newData;
                $me.trigger('updateModel');
            };
            $me.on('updateModel', function () {
                // on any model update event
                // callback
                if ($.isFunction(params.onModelUpdate)) {
                    // on updating model, allow access to new and old values in model
                    params.onModelUpdate(modelData.value.current, modelData.value.existing);
                }
            });
        },
        View: function (params) {
            var me = this,
                view,
                template,
                rendered;
            // to fetch the model corresponing to the view
            me.getModel = function () {
                return params.model;
            };
            // fetching the data
            me.getData = function () {
                return params.model.getData();
            };
            // fetch the element
            me.getEl = function () {
                return params.el;
            };
            // update the view
            me.updateView = function () {
                var viewdata = params.model.getData();
                if($.isFunction(params.formatData)) {
                    // format data according to view
                    viewdata = params.formatData(viewdata);
                }
                view._render(viewdata);
            };
            // on model update
            $(params.model).on('updateModel', function () {
                // on any model update event, update the view
                me.updateView();
            });

            // internal functions
            view = {
                // init function
                _initialize: function() {
                    rendered = $('<div class="jquerymvc-tmpl" id="jquerymvc-tmpl-' + $('.jquerymvc-tmpl').length + '"></div>');
                    rendered.appendTo(params.el);
                },
                // fetch the template if not fetched
                _fetchTemplate: function (data) {
                    $.ajax({                    
                        url: params.templateUrl,
                        async: true,
                        success: function(htmlTpl, status, httpObj) {
                            var html,
                                components,
                                componentEl,
                                lp = 0;
                            template = $.template(null, htmlTpl);
                            html = $.tmpl(template, data)
                            rendered.html(html);
                            // component initialization
                            components = rendered.find('[data-component]');
                            // initialize the component
                            for(lp ; lp < components.length ; lp++) {
                                componentEl = $(components[lp]);
                                new $.Component(componentEl.attr('data-component'), componentEl);
                            }
                        }
                    });
                },
                // render function of view
                _render: function(data) {
                    if(template) {
                        // update the template with new data
                        var html = $.tmpl(template, data)
                        rendered.html(html); 
                        var components,
                            componentEl,
                            lp = 0;
                        // component initialization
                        components = rendered.find('[data-component]');
                        // initialize the component
                        for(lp ; lp < components.length ; lp++) {
                            componentEl = $(components[lp]);
                            new $.Component(componentEl.attr('data-component'), componentEl);
                        }
                    } else {
                        this._fetchTemplate(data);
                    }
                }
            };

            view._initialize();
        },
        Controller: function (params) {
            var me = this,
                model = params.view.getModel(),
                controller,
                el = params.view.getEl(),
                events = {};
            // to fetch the view corresponding to the controller
            me.getView = function () {
                return params.view;
            };
            // to fetch the model corresponding to the controller
            me.getModel = function () {
                return model;
            };
            // fetching the data
            me.getData = function () {
                return model.getData();
            };
            // fetch the element
            me.getEl = function () {
                return el;
            };
            // fetch the evtnts
            me.getEvents = function () {
                return events;
            };
            // remove events
            me.offEvent = function (evt, selector) {
                el.off(evt, selector);
                delete events[evt][selector];
            };

            // controller internal functions
            controller = {
                _initialize: function () {
                    if (params.events !== undefined) {
                        $.each(params.events, function(key, value) {
                            events[key] = value;
                            $.each(value, function(key1, value1) {
                                el.on(key, key1, function(e) {
                                    value1.call(this, e);
                                });
                            });
                        });
                    }
                }
            };

            controller._initialize();
        },
        Component: function (componentname, element) {
            var component = {};

            // private functions
            component = {
                _initialize: function () {
                    $.JQMVCComponent[componentname].apply(this, element);
                }
            };

            component._initialize();
        }
    });
})(window.jQuery);