/*
 * Backbone.Spark v1.1
 * Works with Backbone.js 0.9.2
 * Copyright (c) 2012 Paul Heasley
 * www.phdesign.com.au
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Backbone.Spark is largely based off Backbone.Mutators, see the included
 * NOTICE file for Backbone.Mutators license detils.
 */

/*
Usage
-----

var Demo = Backbone.Spark.Model.extend({

    defaults: function() {
      return {
        filePath: null
      };
    },

    sparks: {

        extn: function(key, value, options, set) {
            if (arguments.length === 0) {
                var i = this.filePath.lastIndexOf('.');
                return i >= 0 ? this.filePath.substr(i) : '';
            } else {
                var filePath = this.get('filePath'),
                    i = filePath.lastIndexOf('.');

                if (i >= 0)
                    this.set('filePath', filePath.substr(0, i) + value);
            }
        }.dependsOn('filePath'),

        folderPath: function() {
            if (!this.filePath) return '';
            var i = this.filePath.lastIndexOf('/');
            return i >= 0 ? this.filePath.substring(0, i) : ''; 
        }.dependsOn('filePath'),

    }

});
*/
 
Backbone.Spark = (function (_, Backbone, undef){
    var Spark = {},
        _super = Backbone.Model.prototype;

    // Record the dependent properties so we can raise change events when the dependents change.
    // This code is largely a copy of the Ember property() code.
    Function.prototype.dependsOn = function() {
        this._dependentKeys = Array.prototype.slice.call(arguments);
        this.noCache = function() {
            this._noCache = true;
            return this;
        };
        return this;
    };

    function triggerChanges(model, options) {
        var spark, sparkFunc, key, dependent, changes = [];

        for (spark in this.sparks) {
            sparkFunc = this.sparks[spark];
            if (sparkFunc._dependentKeys !== undef) {
                if (_.any(sparkFunc._dependentKeys, this.hasChanged, this))
                    changes.push(spark);
            }
        }

        _.each(changes, function(spark) {
            // Invalidate cache
            delete this._cache[spark];
            // Trigger change
            this.trigger('change:' + spark, this, this.get(spark));
        }, this);
    }

    // Extend the backbone model so that we can override the constructor and provide
    // event listeners for the dependent properties.
    Spark.Model = Backbone.Model.extend({

        constructor: function Base(attributes, options) {
            // For caching spark values
            this._cache = {};

            _super.constructor.apply(this, arguments);

            // Monitor for change events to the dependents
            this.on('change', triggerChanges, this);
        },

        get: function (attr) {
            var val,
                hasSparks = this.sparks !== undef;

            // If the attribute is a spark return the result of the function
            if (hasSparks === true && _.isFunction(this.sparks[attr]) === true) {
                // Check for cached value
                if (this._cache.hasOwnProperty(attr))
                    return this._cache[attr]; 
                val = _.bind(this.sparks[attr], this)();
                // Update cache
                if (this.sparks[attr]._noCache !== true)
                    this._cache[attr] = val;
                return val;
            }

            // Otherwise just delegate to the standard backbone get function.
            return _super.get.call(this, attr);
        },

        set: function (key, value, options) {
            var hasSparks = this.sparks !== undef,
                ret = null,
                attrs = null,
                attr = null,
                all = null;

            // Handle both ('key', value) and ({key: value}) style arguments.
            if (_.isObject(key) || key === null) {
                attrs = key;
                options = value;
            } else {
                attrs = {};
                attrs[key] = value;
            }
            if (!attrs) return this;

            if (hasSparks === true) {
                // For each 'set' attribute, if it's a spark then set the spark value.
                for (attr in attrs) {
                    if (_.isFunction(this.sparks[attr]) === true) {
                        // Parameters are the spark name, spark function, options and the base set function.
                        _.bind(this.sparks[attr], this)(attr, attrs[attr], options, _.bind(_super.set, this));
                        // Update cache
                        if (this.sparks[attr]._noCache !== true)
                            this._cache[attr] = attrs[attr];
                        // Support setting combinations of real attributes and sparks in the same call.
                        delete attrs[attr];
                    }
                }
                // If we've processed all attributes then we're done.
                if (!attrs) return this;
            }

            // Call our base set function for any remaining attributes.
            return _super.set.call(this, attrs, options);
        },

        toJSON: function () {
            var val,
                obj = _super.toJSON.call(this);
            // Add all the sparks at the exported object.
            _.each(this.sparks, _.bind(function (property, name) {
                if (_.isFunction(this.sparks[name])) {
                    // Check for cached value
                    if (this._cache.hasOwnProperty(name)) {
                        obj[name] = this._cache[name];
                    } else {
                        val = _.bind(this.sparks[name], this)();
                        obj[name] = val;
                        // Update cache
                        if (this.sparks[name]._noCache !== true)
                            this._cache[name] = val;
                    }
                }
            }, this));

            return obj;
        }  
    });

    return Spark;

})(_, Backbone);