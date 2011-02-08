var gvsFnc = function gvsFnc() {
	var values = arguments,
		env = Proxy.getContext(arguments);
	assertObject('getContext output', env);
	assertInstanceOf('proxy is instance', Proxy, env.proxy);
	assertString('alias is string', env.alias);
	assertString('phase is string', env.phase);
	assertSame('phase is lowercased', env.phase.toLowerCase(), env.phase);
	assertTrue('phase is valid', !env.phase.length || /^get|vet|set$/.test(env.phase));
	assertFunction('proxy._gset is valid', env.proxy._gset);
	if (env.phase === '') {
		assertSame('phase is an empty string',env.phase,'');
	} else {
		if (env.phase === 'get') {
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
		assertNotNull('Proxy', Proxy);
		assertFunction('getContext', Proxy.getContext);
	},
	testExceptions: function () {
		var a = function () {
				var p = this;
				if (p instanceof arguments.callee) {
					return !0;
				} else {
					return !1;
				}
			},
			b = function () {
				var p = this;
				if (p instanceof b) {
					return !0;
				} else {
					return !1;
				}
			},
			c = function () {
				var p = this;
				if (!(p instanceof arguments.callee)) throw new Error('new operator missing');
			};
		assertTrue('local with new', !!(new a()));
		assertFalse('local without new', !!(a()));
		assertTrue('local with new', !!(new b()));
		assertFalse('local without new', !!(b()));
		assertNoException('local new c', function () {
			new c();
		});
		assertException('local no new',function () {
			c();
		});
		assertException('Proxy without new', function () {
			Proxy();
		});
		assertException('Proxy without source', function () {
			new Proxy();
		});
		assertException('Proxy with Null', function () {
			new Proxy(null);
		});
		assertException('Proxy without undefined source', function () {
			new Proxy(undefined);
		});
		assertException('4 args and no gate functions', function () {
			new Proxy({},{},{},{});
		});
		assertException('4 args and 2 gate functions', function () {
			new Proxy({},{},function () {},function () {});
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
				g1:[1],
				v1:[0,1],
				v2:[1,1],
				s1: [0,0,1],
				s2: [1,0,1],
				s3: [0,1,1],
				s4: [1,1,1],
				n1: [0],
				n2: [0,0],
				n3: [0,0,0],
				n4: [0,1,0]
			}),
			chrt = pxy._gset();
		assertSame('charter a gets', 1, chrt.a);
		assertSame('charter b gets', 1, chrt.b);
		assertSame('charter c get & sets', 0, chrt.c);
		assertSame('charter d get & sets', 0, chrt.d);
		i = 1;
		for (; i; i--) {
			assertSame('charter gets g' + i, 1, chrt['g' + i]);
		}
		i = 2;
		for (; i; i--) {
			assertTrue('charter vets v' + i, chrt['v' + i] < 1);
		}
		i = 4;
		for (; i; i--) {
			assertTrue('charter sets s' + i, chrt['s' + i] < 1);
		}
		i = 4;
		for (; i; i--) {
			assertUndefined('charter is missing for n' + i, chrt['n' + i]);
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
					d: [function () {}],
					e: [gvsFnc],
					f: [function () {
						var pxyArgs = arguments.callee.caller.arguments,
							k = pxyArgs[1],
							p = pxyArgs[2];
						assertSame('phase is "get"',p,'get');
						assertSame('key is "f"',k,'f');
						return 1;
					}]
				}),
			chrt = pxy._gset();
		assertTrue('charter a gets',chrt.a === 1);
		assertTrue('charter b gets',chrt.b === 1);
		assertTrue('charter e gets',chrt.e === 1);
		assertTrue('charter f gets',chrt.f === 1);
		assertTrue('charter d missing because no return function',chrt.d == null);
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
				d: ['a',function () {
						assertTrue('at least one argument', arguments.length > 0);
						return 1;
					}
				],
				e: [fnc,fnc],
				f: ['a',function () {return 0}]
			}),
			chrt = pxy._gset();

		assertTrue('a, b, and c set', chrt.a === 0 && chrt.b === 0);
		assertTrue('e is missing because it uses non-returning functions', !chrt.e);
		assertTrue('a is function',typeof pxy.a === 'function');
		assertTrue('takes string', pxy.a(str));
		assertTrue('takes object', pxy.b(obj));
		assertTrue('takes number', pxy.b(num));
		assertTrue('takes function', pxy.b(fnc));
		assertTrue('takes number and function', pxy.b(num, fnc));
		assertTrue('accepts all',pxy.d(1));
		assertFalse('denies string',pxy.b(str));
		assertFalse('denies all', pxy.f(str));
	},
	testSetters: function () {
		var src = {foo:'bar'},
		  fnc = function (v) {
				assertSame('source is valid',src,this);
				this.foo = v;
			},
			i = 0,
			key = 'foo',
			pxy = new Proxy(src, {
				a0: [0,0,fnc],
				a1: [0,1,fnc],
				a2: [0,0,fnc],
				a3: [0,0,key],
				a4: [0,1,key],
				a5: [0,0,key],
				b: [0,0,gvsFnc],
				c: [0,0,function () {
					var v = arguments,
						pxyArgs = arguments.callee.caller.arguments,
						k = pxyArgs[1],
						p = pxyArgs[2];
					assertSame('phase is "set"',p,'set');
					assertSame('key is "c"',k,'c');
					assertSame('2 values present',2,v.length);
				}]
			}),
			chrt = pxy._gset();
		for (; i < 5; i++) {
			assertTrue('charter for a' + i + ' sets', chrt['a' + i] === -1);
			assertTrue('a' + i + ' set returns true',pxy['a' + i](i));
			assertSame('a' + i + ' set worked', src.foo, i);
		}
		assertTrue('charter b sets',chrt.b === -1);
		assertTrue('charter c sets',chrt.c === -1);
		pxy.b('setting via B');
		assertTrue('c returns true',pxy.c('var1','var2'));
		assertException('getting fails',function () {
			pxy.b();
		});
	},
	testExtraArgs: function () {
		var pxy,
			src = {foo:'bar'},
			sig = {},
			gateTests = function () {
				pxy.a();
				pxy.b();
				pxy._gset();
			},
			sigTests = function () {
				assertSame('sig gets src',src, pxy._gset(sig));
			};
		assertNoException('init gate', function () {
			pxy = new Proxy(src,
				{
					a: function () {},
					b: []
				},
				gvsFnc
			);
		});
		gateTests();
		assertNoException('init sig', function () {
			pxy = new Proxy(src,{},sig);
		});
		sigTests();
		assertNoException('init gate then sig', function () {
			pxy = new Proxy(src,
				{
					a: function () {},
					b: []
				},
				gvsFnc,
				sig
			);
		});
		gateTests();
		sigTests();
		assertNoException('init sig then gate', function () {
			pxy = new Proxy(src,
				{
					a: function () {},
					b: []
				},
				sig,
				gvsFnc
			);
		});
		gateTests();
		sigTests();
	},
	testGate: function () {
		var src = {a:'foo'},
			flag = 0,
			tally = 0,
			pxy = new Proxy(src,
				{
					a: [],
					b: function () {
						return 1;
					},
					c: [
						function () {
							return 1;
						},
						function () {
							return 1;
						},
						function (v) {
							assertSame('v parameter',v,20);
							return 1;
						}
					]
				},
				function () {
					var env = Proxy.getContext(arguments);
					assertObject('gate env',env);
					assertInstanceOf('proxy',Proxy,env.proxy);
					assertString('phase',env.phase);
					assertString('key',env.alias);
					if (tally++ > 3) {
						return !1;
					}
				}
			),
			pxy2 = new Proxy(src, pxy), // clones and gate
			pxy3 = new Proxy(src, // clones scheme, overrides gate
				pxy2,
				function () {
					var ctx = Proxy.getContext(arguments);
					assertObject('charter call', ctx.proxy._gset());
					assertFalse('gate can call own alias', ctx.proxy[ctx.alias]());
					if (ctx.alias !== 'b') {
						assertTrue('gate can call alias b', !!ctx.proxy.b());
					}
					tally = 0;
				}
			);
		assertString('gate open a',pxy.a());
		assertNumber('gate open b',pxy.b());
		assertNumber('gate open c',pxy.c());
		assertTrue('gate open c',pxy.c(20));
		assertSame('gate calls',4,tally);
		assertFalse('gate closed a',pxy.a());
		assertFalse('gate closed b',pxy.b());
		assertFalse('gate closed c',pxy.c());
		assertFalse('gate closed c',pxy.c(40));
		assertObject('closed gate allows charter', pxy._gset());
		assertFalse('pxy2 has same gate as pxy',pxy2.c());
		pxy3.a();
		pxy3.c();
		assertSame('tally reset by other gate',0,tally);
	},
	testSig: function () {
		var src = {},
			sig1 = {},
			sig2 = {},
			pxy1 = new Proxy(src,{},sig1),
			pxy2 = new Proxy(src,{},sig2),
			pxy3 = new Proxy(src,pxy1);
		assertNotSame('signatures',sig1,sig2);
		assertSame('src retrieved',pxy1._gset(sig1),pxy2._gset(sig2));
		assertSame('sig clones',pxy3._gset(sig1),pxy1._gset(sig1));
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
				},
				sig1
			),
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