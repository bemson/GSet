/**
* Proxy v2.2.2
* http://github.com/bemson/Proxy/
*
* Copyright 2010, Bemi Faison
* Licensed under terms of the MIT License
**/

(function () {
	// init vars
	var sys = {
			// invokes given function with second-class arguments
			gvsCall: function (fnc, scope, scopeArgs, pxy, pxyArgs) {
				return (function prepEnv() {
					return fnc.apply(scope, scopeArgs)
				}).apply(pxy, pxyArgs);
			},
			gsetCall: function (pxy, prop) { // calls gset via a curried function
				return function () {
					// send target property and any arguments as the value(s)
					return pxy._gset.apply(pxy, [prop].concat(arguments.length ? [].slice.call(arguments) : []));
				}
			},
			customCall: function (source, scheme, alias, pxy, gateCheck) { // function to call custom method
				var gvsArgs = [pxy, alias, ''];
				return function () {
					var srcArgs = arguments;
					// if gateCheck returns false, return false
					if (!gateCheck(srcArgs,gvsArgs)) return !1;
					return sys.gvsCall(scheme[alias], source, srcArgs, pxy, gvsArgs);
				}
			},
			typeMap: { // collection of allowed types
				'string': 's',
				'[object Array]': 'a',
				'function' : 'f',
				'[object Function]' : 'f'
			},
			rxp: {
				rtnFnc: /\breturn\b/, // regex ensures a function returns something
				fsType: /[fs]/, // output from getType is f or s
				afsType: /[afs]/ // out from getType is a, f, or s
			},
			getType: function (o) { // resolve object type
				var t = sys.typeMap[typeof o] || sys.typeMap[Object.prototype.toString.call(o)];
				return t && (t !== 's' || t.length) ? t : 0;
			},
			testValueTypes: function (types, values) {
				var i = 0, j = values.length, q, z = types.length,t,r = 1;
				for (; i < j; i++) {
					t = typeof values[i];
					r = 0;
					for (q = 0; q < z; q++) {
						if (types[q] === t) {
							r = 1;
							break
						}
					}
					if (!r) break;
				}
				return r;
			}
		};

	/**
	* Creates an instance with methods scoped to another object.
	*
	* @param {Object} source The object to use as a scope for mapped methods.
	* @param {Object} scheme Collection of methods and property-maps, or a Proxy instance.
	*				When a Proxy instance, it's scheme is used scheme.
	*				Functions become methods of the instance.
	*				Property-maps are structured arrays that compile into GVS methods, managed by the _gset() method.
	* @param {Object} [signature]	A unique object reference, which can be used to retrieve the source from this instance.
	*								If this parameter is not given and the scheme is a Proxy instance, it's signature is used.
	* @param {Function} [gate]	A function that can deny access to custom or GVS method, by returning false.
	*							Gate functions receive false return values, when invoking other instance methods of the same instance - excluding retrieval of the charter.
	*							If this parameter is not given and the scheme is a Proxy instance, it's gate is used.
	**/
	Proxy = function (source, scheme) {
		// init vars
		var pxy = this, // alias self
			args = arguments, // alias arguments
			cfgs, // information about configurable properties
			members, // capture member names and code
			sig = sys.rxp.rtnFnc, // default signature - to retrieve the source from this Proxy instance
			gate = sys.getType, // default gate function
			locks = {}, // lock flags for each alias
			gateCheck = function (scopeArgs, gvsArgs) { // manages access to proxy methods
				// init vars
				var alias = gvsArgs[1], // get alias being check
					access = !locks[alias]; // use last access value
				// if access is allowed and there is a gate function...
				if (access && gate) {
					// lock gate - prevents Proxy calls to this alias from within the gate
					locks[alias] = 1;
					// if the gate declines access, deny access
					if (sys.gvsCall(gate, source, scopeArgs, pxy, gvsArgs) === !1) access = 0;
					// unlock gate
					locks[alias] = 0;
				}
				// allow access
				return access;
			},
			pm, kind, key, cfg; // loop vars
		// if not invoked with new, throw error
		if (!(pxy.hasOwnProperty && pxy instanceof Proxy)) throw new Error('Proxy: missing new operator');
		// if no source is given, throw error
		if (source == null) throw new Error('Proxy: invalid source');
		// if extra args exist...
		if (args.length > 2) {
			// if four args exist...
			if (args.length > 3) {
				// capture arg types and test value (temporarily)
				gate = [typeof args[2], typeof args[3], 'function'];
				// if none or two functions are given, throw error
				if ((gate[0] === gate[2]) === (gate[1] === gate[2])) throw new Error('Proxy: too many or too few gate functions');
				// set sig to the argument that is not a function
				sig = args[gate[0] === gate[2] ? 3 : 2];
				// set gate to the argument that is a function
				gate = args[gate[0] === gate[2] ? 2 : 3];
			} else { // or, when 3 args were given...
				// if the extra argument is a function...
				if (typeof args[2] === 'function') {
					// set gate
					gate = args[2];
				} else {
					// set sig
					sig = args[2];
				}
			}
		}
		// if the scheme is a proxy...
		if (scheme instanceof Proxy) {
			// get cfgs and members of existing proxy
			scheme = scheme._gset(sys);
			// get cfgs
			cfgs = scheme[0];
			// get members
			members = scheme[1];
			// if the default, override sig
			if (sig === sys.rxp.rtnFnc) sig = scheme[2];
			// if the default, override sig
			if (gate === sys.getType) gate = scheme[3];
			// get scheme
			scheme = scheme[4];
			// with each member...
			for (key in members) {
				// if not inherited...
				if (members.hasOwnProperty(key)) {
					// init lock flag for this alias
					locks[key] = 0;
					// if the code is 2...
					if (members[key] === 2) {
						// add scoped method to instance
						pxy[key] = sys.customCall(source, scheme, key, pxy, gateCheck);
					} else { // otherwise, when a gset definition...
						// create getter/setter call to gset for this key
						pxy[key] = sys.gsetCall(pxy, key);
					}
				}
			}
		} else { // otherwise, when the scheme is not a proxy...
			// init cfg and member object collections
			cfgs = {};
			members = {};
			// with each mapping...
			for (key in scheme) {
				// skip inherited properties
				if (!scheme.hasOwnProperty(key)) continue;
				// init lock flag for this alias
				locks[key] = 0;
				// capture property-map
				pm = scheme[key];
				// capture type of map
				kind = sys.getType(pm);
				// if this is a function...
				if (kind === 'f') {
					// add scoped method to instance
					pxy[key] = sys.customCall(source, scheme, key, pxy, gateCheck);
					// add member name and use custom code
					members[key] = 2;
				} else { // otherwise, when not a function...
					// define a configuration information object for this mapping
					cfg = {
						get: 0,
						set: 0
					};
					// if not an array or this is a nested array...
					if (kind !== 'a' || (pm.length === 1 && (kind = sys.getType(pm[0])) === 'a')) {
						// if this was a nested array...
						if (kind === 'a') {
							// change value in scheme to it's nested value
							scheme[key] = pm[0];
							// flag that this config will have an array for a fixed value
							cfg.isAry = 1;
						}
						// flag that this mapping gets
						cfg.get = 1;
						// flag that this is a fixed configuration
						cfg.fixed = 1;
						// capture fixed value
						cfg.fixedValue = scheme[key];
					} else { // otherwise, when this is a gvs map...
						// if this array has no length, redefine as full-access property map
						if (!pm.length) pm = scheme[key] = [key,1];
						// capture types for get, vet and set indexes (if functions, get and vet must have return statements)
						kind = [sys.getType(pm[0]), sys.getType(pm[1]), sys.getType(pm[2])];
						// if get is truthy, not a function or this a function that returns a value...
						if (pm[0] && kind[0] !== 'f' || sys.rxp.rtnFnc.test(pm[0] + '')) {
							// flag that this mapping gets
							cfg.get = 1;
							// if a function or string, define getter function or property based on kind
							if (sys.rxp.fsType.test(kind[0])) cfg[kind[0] === 'f' ? 'getter' : 'getProperty'] = pm[0];
						}
						// if vet type is valid...
						if (sys.rxp.afsType.test(kind[1]) && (kind[1] !== 'f' || sys.rxp.rtnFnc.test(pm[1] + ''))) {
							// define validator as an array of types or a function, based on kind
							cfg[kind[1] === 'f' ? 'validator' : 'types'] = kind[1] === 's' ? [pm[1]] : pm[1];
						} else if (pm[1] && kind[1] !== 'f') { // or, when truthy and not a function...
							// flag that any value is valid
							cfg.validAny = 1;
						}
						// if set is truthy...
						if (pm[2]) {
							// flag that this map gets
							cfg.set = 1;
							// if set is a function or string...
							if (sys.rxp.fsType.test(kind[2])) {
								// define setter function or setProperty based on kind
								cfg[kind[2] === 'f' ? 'setter' : 'setProperty'] = pm[2];
							} else if (cfg.getter || cfg.getProperty) { // or, when there is a getter function or property...
								// use getter function or property for setting
								cfg[cfg.getter ? 'setter' : 'setProperty'] = cfg.getter || cfg.getProperty;
							}
							// if there is no validator or types, set validany to 1
							if (!cfg.validator || !cfg.types) cfg.validAny = 1;
						} else if (pm.length < 3 && (cfg.validator || cfg.types || cfg.validAny)) { // or, when vetting is enabled..
							// flag that this map gets
							cfg.set = 1;
						}
					}
					// if this mapping gets or sets...
					if (cfg.get || cfg.set) {
						// capture code for this config, based on get/set states
						members[key] = cfg.get - cfg.set;
						// add to cfgs
						cfgs[key] = cfg;
						// create getter/setter call to gset for this key
						pxy[key] = sys.gsetCall(pxy, key);
					}
				}
			}
		}
		// if default gate, clear reference
		if (gate === sys.getType) gate = 0;
		/**
		* Get or set a property.
		*
		* @param {String} alias The proxy alias to set or get.
		* @param {Object} [value]	One or more values to use when setting.
		*							GVS methods with custom vetter and/or setter functions, receive all values.
		*							GVS methods with implied setters, only use the first value.
		*							When omitted, this method returns the value of the given alias.
		* @returns {Boolean|Object|Array}	When setting, it returns true when successful and false otherwise.
		*									When getting, it returns the property value or false when the value is not found.
		*									When no arguments are given, an object of available properties and accessor codes is returned.
		*									When alias references this instance, an array of method names.
		**/
		pxy._gset = function (alias) {
			// init vars
			var args = arguments, // alias arguments
				values = [].slice.call(arguments,1), // capture values (if any)
				isSet = values.length, // flag when attempting to set a property
				action = isSet ? 'set' : 'get', // indicates when setting the target property
				gvsArgs = [pxy, alias, isSet ? 'vet' : action], // args to send functions
				cfg = cfgs[alias], // alias the config for the requested property
				codeConst = function () {}; // constructor to clone codes

			// if no arguments were given...
			if (!args.length) {
				// prototype members to constructor
				codeConst.prototype = members;
				// return copy of members
				return new codeConst();
			}

			// if the alias is this proxy's signature, return the source object
			if (alias === sig) return source;
			// if the alias is Proxy's key, return parts for cloning
			if (alias === sys) return [cfgs, members, sig, gate, scheme];

			// if the gateCheck fails, exit function
			if (!gateCheck(values, gvsArgs)) return !1;

			// if a config exist for the target property...
			if (cfg) {
				// if the target action is available...
				if (cfg[action]) {
					// if fixed, return fixed value (clone arrays for protection)
					if (cfg.fixed) return cfg.isAry ? cfg.fixedValue.concat() : cfg.fixedValue;
					// if setting...
					if (isSet) {
						// if no validation is needed or the value validates...
						if (cfg.validAny || (cfg.validator && sys.gvsCall(cfg.validator, source, values, pxy, gvsArgs)) || (cfg.types && sys.testValueTypes(cfg.types, values))) {
							// if there is a setter, or no setProperty and a getter function (setter has precedence)...
							if ((cfg.setter || (!cfg.setProperty && cfg.getter)) && gvsArgs.splice(2,1,'set')) {
								// capture result of setter/getter function
								action = sys.gvsCall(cfg.setter || cfg.getter, source, values, pxy, gvsArgs);
								// return true by default, otherwise return the return value, or it's boolean equivalent when setting
								return (action === undefined) ? !0 : (isSet ? !!action : action);
							}
							// (otherwise) set the target property or given alias in the source object
							source[(action = cfg.setProperty || alias)] = values[0];
							// flag success if value is now the same
							return source[action] === values[0];
						}
					} else { // otherwise, when getting...
						// if a function, return result of executing getter
						if (cfg.getter) return sys.gvsCall(cfg.getter, source, values, pxy, gvsArgs);
						// (otherwise) return value of property (or given alias) in source object
						return source[cfg.getProperty || alias];
					}
				} else { // otherwise, when the action is not available...
					// throw error for illegal action
					throw new Error('Proxy: "' + alias + '" has no ' + action + 'ter');
				}
			} else { // otherwise, when no config exist...
				// throw error for unmapped alias
				throw new Error('Proxy: "' + alias + '" is unmapped');
			}
			// return false if any valid action fails (this would occur when a validation routine fails)
			return !1;
		};
	}

	/**
	* Returns the invocation context for a Proxy managed function.
	*
	* @static
	* @param {Object} arg The argument object from the executing function
	*
	* @returns {Object} An object with three keys: proxy, phase, and key. 
	**/
	Proxy.getContext = function (args) {
		var ctx = {
				proxy: !1,
				phase: !1,
				alias: !1
			},
			isType = function (obj,oStr) {
				return typeof obj === (oStr ? 'object' : 'function');
			};
		if (isType(args,1) && isType((args = args.callee)) && isType((args = args.caller)) && isType((args = args.arguments),1) && args.length === 3) {
			ctx.proxy = args[0];
			ctx.alias = args[1];
			ctx.phase = args[2];
		}
		return ctx;
	};
})();