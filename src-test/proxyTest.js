ProxyTest = TestCase('ProxyTest');

ProxyTest.prototype = {
	testAvailable: function () {
		assertNotNull('Proxy is available', Proxy);
	}
};