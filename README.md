# Proxy
Share and use objects with ease.

2/11/11
version 2.2.5
by Bemi Faison (bemson@gmail.com)

## DESCRIPTION

The Proxy instance represents a limited version (or "view") of another object, protecting that object and it's members from unwanted access and manipulation. The Proxy constructor introduces the [GVS pattern](http://learnings-bemson.blogspot.com/2010/09/learning-to-open-source-via-proxy.html), which offers a simple syntax for defining getter/setter-style methods.

## FILES

* src/ - Directory containing the Proxy source code
* src-test/ - Test suite for Proxy
* LICENSE - The legal terms and conditions by which Proxy may be used
* README.md - This readme file


## INSTALLATION

Use Proxy within a web browser. Load the `src/proxy.js` file like any other external JavaScript library file.

## USAGE

Instantiate a Proxy using the `new` operator and the required arguments, _source_ and _scheme_. Functions within the scheme execute within the scope of the source object.

    var pxy = new Proxy(anyObject, {
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

Invoke Proxy methods like those of any other object.

    var getResult = pxy.gvsMethod();
    var setResult = pxy.gvsMethod(arg1, arg2, ...);

More usage information is available in the [Proxy wiki](http://github.com/bemson/Proxy/wiki/).

## LICENSE

Proxy is available under the terms of the [MIT-License](http://en.wikipedia.org/wiki/MIT_License#License_terms).

Copyright 2010, Bemi Faison