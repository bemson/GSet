# Proxy Test Suite
[Proxy](http://github.com/bemson/Proxy/) uses JsTestDriver as a test suite.

## FILES

* JsTestDriver.jar - Java application
* jsTestDriver.conf - Test configuration file
* proxyTest.js - Test script to use with JsTestDriver
* README.md - This readme file

## INSTALLATION

JsTestDriver requires a java console.

See the [JsTestDriver](http://code.google.com/p/js-test-driver/) page for complete installation instructions.

The file "jsTestDriver.conf" requires the [Proxy](http://github.com/bemson/Proxy/) source code be available in a "src" folder, within the parent directory.

## USAGE

Start the JsTestDriver server in your java console (use any port you like).

    java -jar JsTestDriver.jar --port 4224

Point any number of browsers to your JsTestDriver server and port number.

    localhost:4224
    myIpAddress:4224

Click any link from the resulting page, to include that browser in the test.

Run the test script (use the flag ` --verbose` for verbose output).

    java -jar JsTestDriver.jar --tests all

See the [JsTestDriver](http://code.google.com/p/js-test-driver/) page for complete usage instructions.