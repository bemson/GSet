/**
* Proxy v1.0.1
* http://github.com/bemson/Proxy/
*
* Copyright 2010, Bemi Faison
* Licensed under terms of the MIT License
**/

/**
* Creates an instance with methods scoped to another object.
*
* @param {Object} source The object to use as a scope for mapped methods.
* @param {Object} [scheme] Collection of methods and property-maps.
*				Functions become methods of the instance.
*				Property-maps are structured arrays, compiled for use by the instance method, _gset().
* @param {Object}
**/
function Proxy(source, scheme, sig) {
	// init vars
	var pxy = this, // alias self
		cfgs = {}, // information about configurable properties
		typeMap = { // collection of allowed types
			'string': 's',
			'[object Array]': 'a',
			'function' : 'f',
			'[object Function]' : 'f'
		},
		getType = function (o,strict) { // resolve object type
			var t = typeMap[typeof o] || typeMap[Object.prototype.toString.call(o)];
			return (t !== 's' || t.length) && (!strict || t !== 'f' || o.toString().match(/\breturn\b/)) ? t : 0;
		},
		members = {}, // captue member names and code
		pm,kind,key,cfg, // loop vars
		gsetCall = function (prop) { // get function to call scheme key
			return function (value) {
				// init vars
				var vars = [prop]; // init arguments to send _gset
				// if any arguments are present, add value to assign
				if (arguments.length) vars.push(value);
				return pxy._gset.apply(pxy, vars);
			}
		};
	// if sig is not an object, create one
	if (typeof sig !== 'object') sig = {};
	// if not invoked with new, throw error
	if (!(pxy.hasOwnProperty && pxy instanceof arguments.callee)) throw new Error('Proxy: missing new operator');
	// if no source is given, throw error
	if (source == null) throw new Error('Proxy: invalid source');
	// with each mapping...
	for (key in scheme) {
		// skip inherited properties
		if (!scheme.hasOwnProperty(key)) continue;
		// capture property-map
		pm = scheme[key];
		// capture type of map
		kind = getType(pm);
		// if this is a function...
		if (kind === 'f') {
			// add scoped method to instance
			pxy[key] = function () {return pm.apply(source,arguments)};
			// add member name and use custom code
			members[key] = 2;
		} else { // otherwise, when not a function...
			// define a configuration information object for this mapping
			cfg = {
				get: 0,
				set: 0
			};
			// if not an array or this is a nested array...
			if (kind !== 'a' || (pm.length === 1 && (kind = getType(pm[0])) === 'a')) {
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
			} else { // otherwise, when this is a property-map...
				// if this array has no length, redefine as full-access property map
				if (!pm.length) pm = scheme[key] = [key,1];
				// capture types for get, vet and set indexes
				kind = [getType(pm[0],1),getType(pm[1],1),getType(pm[2],1)];
				// if get is truthy...
				if (pm[0]) {
					// flag that this mapping gets
					cfg.get = 1;
					// if get is a function or string, define getter function or property based on kind
					if (kind[0] === 'f' || kind[0] === 's') cfg[kind[0] === 'f' ? 'getter' : 'getProperty'] = pm[0];
				}
				// if vet or set is truthy, flag that this mapping sets
				if (pm[2] || pm[1]) cfg['set'] = 1;
				// if the validator is a function or string...
				if (kind[1] === 'f' || kind[1] === 's') {
					// define validator as type or function, based on kind
					cfg[kind[1] === 'f' ? 'validator' : 'type'] = pm[1];
				} else { // otherwise, when the validator is not recognized...
					// flag that any value is valid
					cfg.validAny = 1;
				}
				// if set is a function or string, define getter function or setProperty based on kind
				if (kind[2] === 'f' || kind[2] === 's') cfg[kind[2] === 'f' ? 'setter' : 'setProperty'] = pm[2];
			}
			// if this mapping gets or sets...
			if (cfg.get || cfg.set) {
				// capture code for this config, based on get/set states
				members[key] = cfg.get - cfg.set;
				// add to cfgs
				cfgs[key] = cfg;
				// create getter/setter call to gset for this key
				pxy[key] = gsetCall(key);
			}
		}
	}
	/**
	* Get or set a property.
	*
	* @param {String} alias The proxy alias to set or get.
	* @param {Object} [value]	The value to use when setting.
	*							When omitted, this method returns the value of the given alias.
	* @returns {Boolean|Object|Array}	When setting, it returns true when successful and false otherwise.
	*							When getting, it returns the property value or false when the value is not found.
	*							When no arguments are given, an object of available properties and accessor codes is returned.
	*							When alias references this instance, an array of method names.
	**/
	pxy._gset = function (alias) {
		// init vars
		var args = arguments, // alias arguments
			value = args[1], // capture value in arguments (if any)
			isSet = args.length > 1, // flag when attempting to set a property
			action = isSet ? 'set' : 'get', // indicates when setting the target property
			setArgs = [isSet ? value : null, alias, isSet ? 'v' : 'g', pxy], // args to send functions
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

		// if a config exist for the target property...
		if (cfg) {
			// if the target action is available...
			if (cfg[action]) {
				// if fixed, return fixed value (clone arrays for protection)
				if (cfg.fixed) return cfg.isAry ? cfg.fixedValue.concat() : cfg.fixedValue;
				// if setting...
				if (isSet) {
					// if no validation is needed or the value validates...
					if (cfg.validAny || ((!cfg.type || typeof value === cfg.type) && (!cfg.validator || cfg.validator.apply(source,setArgs)))) {
						// if there is a setter, or no setProperty and a getter function, return result of invoking either function (setter has precedence)
						if ((cfg.setter || (!cfg.setProperty && cfg.getter)) && setArgs.splice(2,1,'s')) return (cfg.setter || cfg.getter).apply(source,setArgs);
						// (otherwise) set the target property or given alias in the source object
						source[(action = cfg.setProperty || cfg.getProperty || alias)] = value;
						// flag success if value is now the same
						return source[action] === value;
					}
				} else { // otherwise, when getting...
					// if a function, return result of executing the function within the scope of the proxied object
					if (cfg.getter) return cfg.getter.apply(source,setArgs);
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
