# Proxy
Share and use objects with ease.

1/23/11
version 2.0.0
by Bemi Faison (bemson@gmail.com)

## DESCRIPTION

The Proxy instance represents a limited version (or "view") of another object, protecting that object and it's members from unwanted access and manipulation. The Proxy constructor features a unique API, to quickly define getter/setter-style methods.

## INSTALLATION

Use Proxy within a web browser. Load the `src/proxy.js` file like any other external JavaScript library file.

## USAGE

Instantiate a Proxy using the `new` operator and the required arguments, _source_ and _scheme_. Functions within the scheme execute within the scope of the source object.

    var myProxy = new Proxy(anyObject, {
        doA: function () {
            var thatObject = this;
        },
        doB: somePreDefinedFunction
    });

Invoke Proxy methods like those of any other object.

    myProxy.doA();

More information about Proxy is available in the [Proxy wiki](http://github.com/bemson/Proxy/wiki/).

## LICENSE

Proxy is available under the terms of the [MIT-License](http://en.wikipedia.org/wiki/MIT_License#License_terms).

Copyright 2010, Bemi Faison