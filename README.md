# GSet
Share and use objects with ease.

3/28/11
version 1.0.1
by Bemi Faison (bemson@gmail.com)

## DESCRIPTION

Formerly named Proxy, the GSet instance protects an object from unwanted access and manipulation, while providing a collection of scoped methods. The GSet constructor introduces the [GVS pattern](http://learnings-bemson.blogspot.com/2010/09/learning-to-open-source-via-proxy.html), which offers a simple syntax for defining getter/setter methods.

## FILES

* gset-min.js - GSet library (minified with the [YUI Compressor](http://developer.yahoo.com/yui/compressor/) version 2.4.2)
* src/ - Directory containing the GSet source code
* src-test/ - Test suite for GSet
* LICENSE - The legal terms and conditions under which GSet may be used
* README.md - This readme file


## INSTALLATION

Use GSet within a web browser. Load the `src/GSet.js` file like any other external JavaScript library file.

## USAGE

Instantiate a GSet using the `new` operator and the required arguments, _source_ and _scheme_. Functions within the scheme execute within the scope of the source object.

    var pxy = new GSet(anyObject, {
      myMethod: function () {
        var thatObject = this;
        thatObject.privateMethod();
      },
      gvsMethod: [
        function getter() {
          return this.someThing;
        },
        function vetter(param1, param2, ...) {
          return validateBeforeSetting(arguments);
        },
        function setter(param1, param2, ...) {
          this.someThing = param1 ? param2 : param3;
          return param4 ? true : false;
        }
      ]
    });

Invoke GSet methods like any other object.

    var getResult = pxy.gvsMethod();
    var setResult = pxy.gvsMethod(arg1, arg2, ...);

More usage information is available in the [GSet wiki](http://github.com/bemson/GSet/wiki/).

## LICENSE

GSet is available under the terms of the [MIT-License](http://en.wikipedia.org/wiki/MIT_License#License_terms).

Copyright 2010, Bemi Faison