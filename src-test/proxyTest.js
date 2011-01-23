var gvsFnc = function () {
	var values = arguments,
		pxyArgs = arguments.callee.caller.arguments,
		key = pxyArgs[1],
		phase = pxyArgs[2],
		proxy = pxyArgs[0];
	assertSame('arguments count', 3, pxyArgs.length);
	assertString('key is string', key);
	assertString('phase is string', phase);
	if (phase === '') {
		assertSame('phase is an empty string',phase,'');
	} else {
		assertSame('phase is lowercased', phase.toLowerCase(), phase);
		assertTrue('phase is valid', /^[gvs]$/.test(phase));
		assertInstanceOf('proxy is instance', Proxy, proxy);
		assertFunction('proxy._gset is valid', proxy._gset);
		if (phase === 'g') {
			assertTrue('values is empty',!values.length);
		} else {
			assertTrue('values is populated',!!values.length);
		}
	}
	return 1;
};

ProxyTest = TestCase('ProxyTest');

ProxyTest.prototype = {
	testPresence: function () {
		assertNotNull('Proxy is available', Proxy);
	},
	testExceptions: function () {
		assertException('No new', function () {
			var x = Proxy();
		});
		assertException('No source', function () {
			var x = new Proxy();
		});
		assertException('Null source', function () {
			var x = new Proxy(null);
		});
		assertException('Undefined source', function () {
			var x = new Proxy(undefined);
		});
	},
	testImpliedMaps: function () {
		var src = {c:10},
			i = 14,
			pxy = new Proxy(src, {
				a: 123,
				b: [[1,2,3]],
				c: [],
				d: [],
				n1: [0],
				n2: [1],
				n3: [0,0],
				n4: [1,0],
				n5: [1,1],
				n6: [0,1],
				n7: [0,0,0],
				n8: [1,0,0],
				n9: [1,1,0],
				n10: [1,1,1],
				n11: [0,1,0],
				n12: [0,1,1],
				n13: [0,0,1],
				n14: [1,0,1]
			}),
			chrt = pxy._gset();
		assertTrue('charter a gets', chrt.a === 1);
		assertTrue('charter b gets', chrt.b === 1);
		assertTrue('charter c get & sets', chrt.c === 0);
		assertTrue('charter d get & sets', chrt.d === 0);
		for (; i; i--) {
			assertTrue('charter is missing n' + i, chrt['n' + i] == null);
		}
		assertSame('static number',123,pxy.a());
		assertArray('returns array',pxy.b());
		assertNotSame('array is static',function () {
			var x = pxy.b();
			x.pop();
			return x.length
		},pxy.b().length);
		assertNotNull('full gets',pxy.c());
		assertTrue('full sets',pxy.c(10));
		assertSame('full gets',10, pxy.c());
		assertFalse('full is fake',src.hasOwnProperty('d'));
		assertTrue('fake full sets',pxy.d(10));
		assertSame('fake full gets',10, pxy.d());
		src.d = 20;
		assertSame('fake connected to src', 20, pxy.d());
	},
	testGetters: function () {
		var src = {foo: 'bar'},
			pxy = new Proxy(src,
				{
					a: [
						function () {
							return this.foo;
						}
					],
					b: ['foo'],
					c: [1],
					d: [function () {}],
					e: [gvsFnc],
					f: [function () {
						var pxyArgs = arguments.callee.caller.arguments,
							k = pxyArgs[1],
							p = pxyArgs[2];
						assertSame('phase is "g"',p,'g');
						assertSame('key is "f"',k,'f');
						return 1;
					}]
				}),
			chrt = pxy._gset();
		assertTrue('charter a gets',chrt.a === 1);
		assertTrue('charter b gets',chrt.b === 1);
		assertTrue('charter e gets',chrt.e === 1);
		assertTrue('charter f gets',chrt.f === 1);
		assertTrue('charter c missing',chrt.c == null);
		assertTrue('charter d missing',chrt.d == null);
		assertSame('a gets',src.foo,pxy.a());
		assertSame('b gets',src.foo,pxy.b());
		pxy.e();
		pxy.f();
		assertException('setting fails',function () {
			pxy.a(1);
		});
	},
	testVetters: function () {
		var src = {},
			str = 'value',
			fnc = function () {},
			obj = {},
			num = 2,
			pxy = new Proxy(src, {
				a: ['a','string'],
				b: ['a',['object','number','function']],
				c: ['a',gvsFnc],
				d: ['a',function (v,k,p) {
					assertSame('phase is "v"',p,'v');
					assertSame('key is "d"',k,'d');
					return 1;
				}],
				e0: [fnc,gvsFnc],
				e1: [0,gvsFnc]
			}),
			chrt = pxy._gset();

		assertTrue('a, b, and c set', chrt.a === 0 && chrt.b === 0);
		assertTrue('e0 and e1 are missing', !chrt.e0 && !chrt.e1);
		assertTrue('a is function',typeof pxy.a === 'function');
		assertTrue('takes string', pxy.a(str));
		assertTrue('takes object', pxy.b(obj));
		assertTrue('takes number', pxy.b(num));
		assertTrue('takes function', pxy.b(fnc));
		assertTrue('takes number and function', pxy.b(num, fnc));

	},
	testSetters: function () {
		var src = {foo:'bar'},
		  fnc = function (v) {
				this.foo = v;
			},
			i = 0,
			key = 'foo',
			pxy = new Proxy(src, {
				a0: [0,0,fnc],
				a1: [0,1,fnc],
				a2: [1,0,fnc],
				a3: [1,1,fnc],
				a4: [0,0,key],
				a5: [0,1,key],
				a6: [1,0,key],
				a7: [1,1,key],
				b: [0,0,gvsFnc],
				c: [0,0,function () {
					var v = arguments,
						pxyArgs = arguments.callee.caller.arguments,
						k = pxyArgs[1],
						p = pxyArgs[2];
					assertSame('phase is "s"',p,'s');
					assertSame('key is "c"',k,'c');
					assertSame('2 values present',2,v.length);
				}]
			}),
			chrt = pxy._gset();
		for (; i < 7; i++) {
			assertTrue('charter for a' + i + ' sets', chrt['a' + i] === -1);
			assertTrue('a' + i + ' set returns true',pxy['a' + i](i));
			assertSame('a' + i + ' set worked', src.foo, i);
		}
		assertTrue('charter b sets',chrt.b === -1);
		assertTrue('charter c sets',chrt.b === -1);
		pxy.b('setting via B');
		pxy.c('var1','var2');
		assertException('getting fails',function () {
			pxy.b();
		});
	},
	testCustomMethods: function () {
		var src = {},
			pxy = new Proxy(src,
				{
					a: gvsFnc,
					b: function (y,z) {
						var args = arguments,
							pxyArgs = args.callee.caller.arguments,
							key = pxyArgs[1];
						assertSame('key of custom is "b"',key,'b');
						if (args.length) {
							assertSame('param y is 5',y,5);
							assertSame('param z is 10',z,10);
						} else {
							assertUndefined('param y is null',y);
							assertUndefined('param z is null',z);
						}
					}
				});
		pxy.a();
		pxy.a(1);
		pxy.b();
		pxy.b(5,10);
	},
	testFeatures: function () {
		var src1 = {foo:'bar'},
			src2 = {foo:'world'},
			sig1 = {},
			sig2 = {},
			pxy1 = new Proxy(src1,
			{
					foo: [],
					a: ['a'],
					b: [0,0,'b']
			},sig1),
			chrt1 = pxy1._gset(),
			pxy2, chrt2;
		assertTrue('removed "a" from charter 1',delete chrt1.a);
		assertTrue('charter is cloned',pxy1._gset().a != null);
		chrt1 = pxy1._gset();
		assertNoException('proxy used as scheme', function () {
			pxy2 = new Proxy(src2,pxy1,sig2);
			chrt2 = pxy2._gset();
		});
		assertSame('sig1 unlocks pxy1',pxy1._gset(sig1),src1);
		assertSame('sig2 unlocks pxy2',pxy2._gset(sig2),src2);
		assertSame('scheme is cloned',chrt1.foo === 0 && chrt1.a === 1 && chrt1.b === -1, chrt2.foo === 0 && chrt2.a === 1 && chrt2.b === -1)
		assertNotSame('pxy1 and pxy2 have different foo values',pxy1.foo(), pxy2.foo());
	}
};