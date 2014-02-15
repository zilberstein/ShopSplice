(function () {

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/amplify/amplify.js                                                                   //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
/*!                                                                                              // 1
 * AmplifyJS 1.1.0 - Core, Store, Request                                                        // 2
 *                                                                                               // 3
 * Copyright 2011 appendTo LLC. (http://appendto.com/team)                                       // 4
 * Dual licensed under the MIT or GPL licenses.                                                  // 5
 * http://appendto.com/open-source-licenses                                                      // 6
 *                                                                                               // 7
 * http://amplifyjs.com                                                                          // 8
 */                                                                                              // 9
/*!                                                                                              // 10
 * Amplify Core 1.1.0                                                                            // 11
 *                                                                                               // 12
 * Copyright 2011 appendTo LLC. (http://appendto.com/team)                                       // 13
 * Dual licensed under the MIT or GPL licenses.                                                  // 14
 * http://appendto.com/open-source-licenses                                                      // 15
 *                                                                                               // 16
 * http://amplifyjs.com                                                                          // 17
 */                                                                                              // 18
(function( global, undefined ) {                                                                 // 19
                                                                                                 // 20
var slice = [].slice,                                                                            // 21
	subscriptions = {};                                                                             // 22
                                                                                                 // 23
var amplify = global.amplify = {                                                                 // 24
	publish: function( topic ) {                                                                    // 25
		var args = slice.call( arguments, 1 ),                                                         // 26
			topicSubscriptions,                                                                           // 27
			subscription,                                                                                 // 28
			length,                                                                                       // 29
			i = 0,                                                                                        // 30
			ret;                                                                                          // 31
                                                                                                 // 32
		if ( !subscriptions[ topic ] ) {                                                               // 33
			return true;                                                                                  // 34
		}                                                                                              // 35
                                                                                                 // 36
		topicSubscriptions = subscriptions[ topic ].slice();                                           // 37
		for ( length = topicSubscriptions.length; i < length; i++ ) {                                  // 38
			subscription = topicSubscriptions[ i ];                                                       // 39
			ret = subscription.callback.apply( subscription.context, args );                              // 40
			if ( ret === false ) {                                                                        // 41
				break;                                                                                       // 42
			}                                                                                             // 43
		}                                                                                              // 44
		return ret !== false;                                                                          // 45
	},                                                                                              // 46
                                                                                                 // 47
	subscribe: function( topic, context, callback, priority ) {                                     // 48
		if ( arguments.length === 3 && typeof callback === "number" ) {                                // 49
			priority = callback;                                                                          // 50
			callback = context;                                                                           // 51
			context = null;                                                                               // 52
		}                                                                                              // 53
		if ( arguments.length === 2 ) {                                                                // 54
			callback = context;                                                                           // 55
			context = null;                                                                               // 56
		}                                                                                              // 57
		priority = priority || 10;                                                                     // 58
                                                                                                 // 59
		var topicIndex = 0,                                                                            // 60
			topics = topic.split( /\s/ ),                                                                 // 61
			topicLength = topics.length,                                                                  // 62
			added;                                                                                        // 63
		for ( ; topicIndex < topicLength; topicIndex++ ) {                                             // 64
			topic = topics[ topicIndex ];                                                                 // 65
			added = false;                                                                                // 66
			if ( !subscriptions[ topic ] ) {                                                              // 67
				subscriptions[ topic ] = [];                                                                 // 68
			}                                                                                             // 69
	                                                                                                // 70
			var i = subscriptions[ topic ].length - 1,                                                    // 71
				subscriptionInfo = {                                                                         // 72
					callback: callback,                                                                         // 73
					context: context,                                                                           // 74
					priority: priority                                                                          // 75
				};                                                                                           // 76
	                                                                                                // 77
			for ( ; i >= 0; i-- ) {                                                                       // 78
				if ( subscriptions[ topic ][ i ].priority <= priority ) {                                    // 79
					subscriptions[ topic ].splice( i + 1, 0, subscriptionInfo );                                // 80
					added = true;                                                                               // 81
					break;                                                                                      // 82
				}                                                                                            // 83
			}                                                                                             // 84
                                                                                                 // 85
			if ( !added ) {                                                                               // 86
				subscriptions[ topic ].unshift( subscriptionInfo );                                          // 87
			}                                                                                             // 88
		}                                                                                              // 89
                                                                                                 // 90
		return callback;                                                                               // 91
	},                                                                                              // 92
                                                                                                 // 93
	unsubscribe: function( topic, callback ) {                                                      // 94
		if ( !subscriptions[ topic ] ) {                                                               // 95
			return;                                                                                       // 96
		}                                                                                              // 97
                                                                                                 // 98
		var length = subscriptions[ topic ].length,                                                    // 99
			i = 0;                                                                                        // 100
                                                                                                 // 101
		for ( ; i < length; i++ ) {                                                                    // 102
			if ( subscriptions[ topic ][ i ].callback === callback ) {                                    // 103
				subscriptions[ topic ].splice( i, 1 );                                                       // 104
				break;                                                                                       // 105
			}                                                                                             // 106
		}                                                                                              // 107
	}                                                                                               // 108
};                                                                                               // 109
                                                                                                 // 110
}( this ) );                                                                                     // 111
/*!                                                                                              // 112
 * Amplify Store - Persistent Client-Side Storage 1.1.0                                          // 113
 *                                                                                               // 114
 * Copyright 2011 appendTo LLC. (http://appendto.com/team)                                       // 115
 * Dual licensed under the MIT or GPL licenses.                                                  // 116
 * http://appendto.com/open-source-licenses                                                      // 117
 *                                                                                               // 118
 * http://amplifyjs.com                                                                          // 119
 */                                                                                              // 120
(function( amplify, undefined ) {                                                                // 121
                                                                                                 // 122
var store = amplify.store = function( key, value, options, type ) {                              // 123
	var type = store.type;                                                                          // 124
	if ( options && options.type && options.type in store.types ) {                                 // 125
		type = options.type;                                                                           // 126
	}                                                                                               // 127
	return store.types[ type ]( key, value, options || {} );                                        // 128
};                                                                                               // 129
                                                                                                 // 130
store.types = {};                                                                                // 131
store.type = null;                                                                               // 132
store.addType = function( type, storage ) {                                                      // 133
	if ( !store.type ) {                                                                            // 134
		store.type = type;                                                                             // 135
	}                                                                                               // 136
                                                                                                 // 137
	store.types[ type ] = storage;                                                                  // 138
	store[ type ] = function( key, value, options ) {                                               // 139
		options = options || {};                                                                       // 140
		options.type = type;                                                                           // 141
		return store( key, value, options );                                                           // 142
	};                                                                                              // 143
}                                                                                                // 144
store.error = function() {                                                                       // 145
	return "amplify.store quota exceeded";                                                          // 146
};                                                                                               // 147
                                                                                                 // 148
var rprefix = /^__amplify__/;                                                                    // 149
function createFromStorageInterface( storageType, storage ) {                                    // 150
	store.addType( storageType, function( key, value, options ) {                                   // 151
		var storedValue, parsed, i, remove,                                                            // 152
			ret = value,                                                                                  // 153
			now = (new Date()).getTime();                                                                 // 154
                                                                                                 // 155
		if ( !key ) {                                                                                  // 156
			ret = {};                                                                                     // 157
			remove = [];                                                                                  // 158
			i = 0;                                                                                        // 159
			try {                                                                                         // 160
				// accessing the length property works around a localStorage bug                             // 161
				// in Firefox 4.0 where the keys don't update cross-page                                     // 162
				// we assign to key just to avoid Closure Compiler from removing                             // 163
				// the access as "useless code"                                                              // 164
				// https://bugzilla.mozilla.org/show_bug.cgi?id=662511                                       // 165
				key = storage.length;                                                                        // 166
                                                                                                 // 167
				while ( key = storage.key( i++ ) ) {                                                         // 168
					if ( rprefix.test( key ) ) {                                                                // 169
						parsed = JSON.parse( storage.getItem( key ) );                                             // 170
						if ( parsed.expires && parsed.expires <= now ) {                                           // 171
							remove.push( key );                                                                       // 172
						} else {                                                                                   // 173
							ret[ key.replace( rprefix, "" ) ] = parsed.data;                                          // 174
						}                                                                                          // 175
					}                                                                                           // 176
				}                                                                                            // 177
				while ( key = remove.pop() ) {                                                               // 178
					storage.removeItem( key );                                                                  // 179
				}                                                                                            // 180
			} catch ( error ) {}                                                                          // 181
			return ret;                                                                                   // 182
		}                                                                                              // 183
                                                                                                 // 184
		// protect against name collisions with direct storage                                         // 185
		key = "__amplify__" + key;                                                                     // 186
                                                                                                 // 187
		if ( value === undefined ) {                                                                   // 188
			storedValue = storage.getItem( key );                                                         // 189
			parsed = storedValue ? JSON.parse( storedValue ) : { expires: -1 };                           // 190
			if ( parsed.expires && parsed.expires <= now ) {                                              // 191
				storage.removeItem( key );                                                                   // 192
			} else {                                                                                      // 193
				return parsed.data;                                                                          // 194
			}                                                                                             // 195
		} else {                                                                                       // 196
			if ( value === null ) {                                                                       // 197
				storage.removeItem( key );                                                                   // 198
			} else {                                                                                      // 199
				parsed = JSON.stringify({                                                                    // 200
					data: value,                                                                                // 201
					expires: options.expires ? now + options.expires : null                                     // 202
				});                                                                                          // 203
				try {                                                                                        // 204
					storage.setItem( key, parsed );                                                             // 205
				// quota exceeded                                                                            // 206
				} catch( error ) {                                                                           // 207
					// expire old data and try again                                                            // 208
					store[ storageType ]();                                                                     // 209
					try {                                                                                       // 210
						storage.setItem( key, parsed );                                                            // 211
					} catch( error ) {                                                                          // 212
						throw store.error();                                                                       // 213
					}                                                                                           // 214
				}                                                                                            // 215
			}                                                                                             // 216
		}                                                                                              // 217
                                                                                                 // 218
		return ret;                                                                                    // 219
	});                                                                                             // 220
}                                                                                                // 221
                                                                                                 // 222
// localStorage + sessionStorage                                                                 // 223
// IE 8+, Firefox 3.5+, Safari 4+, Chrome 4+, Opera 10.5+, iPhone 2+, Android 2+                 // 224
for ( var webStorageType in { localStorage: 1, sessionStorage: 1 } ) {                           // 225
	// try/catch for file protocol in Firefox                                                       // 226
	try {                                                                                           // 227
		if ( window[ webStorageType ].getItem ) {                                                      // 228
			createFromStorageInterface( webStorageType, window[ webStorageType ] );                       // 229
		}                                                                                              // 230
	} catch( e ) {}                                                                                 // 231
}                                                                                                // 232
                                                                                                 // 233
// globalStorage                                                                                 // 234
// non-standard: Firefox 2+                                                                      // 235
// https://developer.mozilla.org/en/dom/storage#globalStorage                                    // 236
if ( window.globalStorage ) {                                                                    // 237
	// try/catch for file protocol in Firefox                                                       // 238
	try {                                                                                           // 239
		createFromStorageInterface( "globalStorage",                                                   // 240
			window.globalStorage[ window.location.hostname ] );                                           // 241
		// Firefox 2.0 and 3.0 have sessionStorage and globalStorage                                   // 242
		// make sure we default to globalStorage                                                       // 243
		// but don't default to globalStorage in 3.5+ which also has localStorage                      // 244
		if ( store.type === "sessionStorage" ) {                                                       // 245
			store.type = "globalStorage";                                                                 // 246
		}                                                                                              // 247
	} catch( e ) {}                                                                                 // 248
}                                                                                                // 249
                                                                                                 // 250
// userData                                                                                      // 251
// non-standard: IE 5+                                                                           // 252
// http://msdn.microsoft.com/en-us/library/ms531424(v=vs.85).aspx                                // 253
(function() {                                                                                    // 254
	// IE 9 has quirks in userData that are a huge pain                                             // 255
	// rather than finding a way to detect these quirks                                             // 256
	// we just don't register userData if we have localStorage                                      // 257
	if ( store.types.localStorage ) {                                                               // 258
		return;                                                                                        // 259
	}                                                                                               // 260
                                                                                                 // 261
	// append to html instead of body so we can do this from the head                               // 262
	var div = document.createElement( "div" ),                                                      // 263
		attrKey = "amplify";                                                                           // 264
	div.style.display = "none";                                                                     // 265
	document.getElementsByTagName( "head" )[ 0 ].appendChild( div );                                // 266
                                                                                                 // 267
	// we can't feature detect userData support                                                     // 268
	// so just try and see if it fails                                                              // 269
	// surprisingly, even just adding the behavior isn't enough for a failure                       // 270
	// so we need to load the data as well                                                          // 271
	try {                                                                                           // 272
		div.addBehavior( "#default#userdata" );                                                        // 273
		div.load( attrKey );                                                                           // 274
	} catch( e ) {                                                                                  // 275
		div.parentNode.removeChild( div );                                                             // 276
		return;                                                                                        // 277
	}                                                                                               // 278
                                                                                                 // 279
	store.addType( "userData", function( key, value, options ) {                                    // 280
		div.load( attrKey );                                                                           // 281
		var attr, parsed, prevValue, i, remove,                                                        // 282
			ret = value,                                                                                  // 283
			now = (new Date()).getTime();                                                                 // 284
                                                                                                 // 285
		if ( !key ) {                                                                                  // 286
			ret = {};                                                                                     // 287
			remove = [];                                                                                  // 288
			i = 0;                                                                                        // 289
			while ( attr = div.XMLDocument.documentElement.attributes[ i++ ] ) {                          // 290
				parsed = JSON.parse( attr.value );                                                           // 291
				if ( parsed.expires && parsed.expires <= now ) {                                             // 292
					remove.push( attr.name );                                                                   // 293
				} else {                                                                                     // 294
					ret[ attr.name ] = parsed.data;                                                             // 295
				}                                                                                            // 296
			}                                                                                             // 297
			while ( key = remove.pop() ) {                                                                // 298
				div.removeAttribute( key );                                                                  // 299
			}                                                                                             // 300
			div.save( attrKey );                                                                          // 301
			return ret;                                                                                   // 302
		}                                                                                              // 303
                                                                                                 // 304
		// convert invalid characters to dashes                                                        // 305
		// http://www.w3.org/TR/REC-xml/#NT-Name                                                       // 306
		// simplified to assume the starting character is valid                                        // 307
		// also removed colon as it is invalid in HTML attribute names                                 // 308
		key = key.replace( /[^-._0-9A-Za-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u37f-\u1fff\u200c-\u200d\u203f\u2040\u2070-\u218f]/g, "-" );
                                                                                                 // 310
		if ( value === undefined ) {                                                                   // 311
			attr = div.getAttribute( key );                                                               // 312
			parsed = attr ? JSON.parse( attr ) : { expires: -1 };                                         // 313
			if ( parsed.expires && parsed.expires <= now ) {                                              // 314
				div.removeAttribute( key );                                                                  // 315
			} else {                                                                                      // 316
				return parsed.data;                                                                          // 317
			}                                                                                             // 318
		} else {                                                                                       // 319
			if ( value === null ) {                                                                       // 320
				div.removeAttribute( key );                                                                  // 321
			} else {                                                                                      // 322
				// we need to get the previous value in case we need to rollback                             // 323
				prevValue = div.getAttribute( key );                                                         // 324
				parsed = JSON.stringify({                                                                    // 325
					data: value,                                                                                // 326
					expires: (options.expires ? (now + options.expires) : null)                                 // 327
				});                                                                                          // 328
				div.setAttribute( key, parsed );                                                             // 329
			}                                                                                             // 330
		}                                                                                              // 331
                                                                                                 // 332
		try {                                                                                          // 333
			div.save( attrKey );                                                                          // 334
		// quota exceeded                                                                              // 335
		} catch ( error ) {                                                                            // 336
			// roll the value back to the previous value                                                  // 337
			if ( prevValue === null ) {                                                                   // 338
				div.removeAttribute( key );                                                                  // 339
			} else {                                                                                      // 340
				div.setAttribute( key, prevValue );                                                          // 341
			}                                                                                             // 342
                                                                                                 // 343
			// expire old data and try again                                                              // 344
			store.userData();                                                                             // 345
			try {                                                                                         // 346
				div.setAttribute( key, parsed );                                                             // 347
				div.save( attrKey );                                                                         // 348
			} catch ( error ) {                                                                           // 349
				// roll the value back to the previous value                                                 // 350
				if ( prevValue === null ) {                                                                  // 351
					div.removeAttribute( key );                                                                 // 352
				} else {                                                                                     // 353
					div.setAttribute( key, prevValue );                                                         // 354
				}                                                                                            // 355
				throw store.error();                                                                         // 356
			}                                                                                             // 357
		}                                                                                              // 358
		return ret;                                                                                    // 359
	});                                                                                             // 360
}() );                                                                                           // 361
                                                                                                 // 362
// in-memory storage                                                                             // 363
// fallback for all browsers to enable the API even if we can't persist data                     // 364
(function() {                                                                                    // 365
	var memory = {},                                                                                // 366
		timeout = {};                                                                                  // 367
                                                                                                 // 368
	function copy( obj ) {                                                                          // 369
		return obj === undefined ? undefined : JSON.parse( JSON.stringify( obj ) );                    // 370
	}                                                                                               // 371
                                                                                                 // 372
	store.addType( "memory", function( key, value, options ) {                                      // 373
		if ( !key ) {                                                                                  // 374
			return copy( memory );                                                                        // 375
		}                                                                                              // 376
                                                                                                 // 377
		if ( value === undefined ) {                                                                   // 378
			return copy( memory[ key ] );                                                                 // 379
		}                                                                                              // 380
                                                                                                 // 381
		if ( timeout[ key ] ) {                                                                        // 382
			clearTimeout( timeout[ key ] );                                                               // 383
			delete timeout[ key ];                                                                        // 384
		}                                                                                              // 385
                                                                                                 // 386
		if ( value === null ) {                                                                        // 387
			delete memory[ key ];                                                                         // 388
			return null;                                                                                  // 389
		}                                                                                              // 390
                                                                                                 // 391
		memory[ key ] = value;                                                                         // 392
		if ( options.expires ) {                                                                       // 393
			timeout[ key ] = setTimeout(function() {                                                      // 394
				delete memory[ key ];                                                                        // 395
				delete timeout[ key ];                                                                       // 396
			}, options.expires );                                                                         // 397
		}                                                                                              // 398
                                                                                                 // 399
		return value;                                                                                  // 400
	});                                                                                             // 401
}() );                                                                                           // 402
                                                                                                 // 403
}( this.amplify = this.amplify || {} ) );                                                        // 404
/*!                                                                                              // 405
 * Amplify Request 1.1.0                                                                         // 406
 *                                                                                               // 407
 * Copyright 2011 appendTo LLC. (http://appendto.com/team)                                       // 408
 * Dual licensed under the MIT or GPL licenses.                                                  // 409
 * http://appendto.com/open-source-licenses                                                      // 410
 *                                                                                               // 411
 * http://amplifyjs.com                                                                          // 412
 */                                                                                              // 413
(function( amplify, undefined ) {                                                                // 414
                                                                                                 // 415
function noop() {}                                                                               // 416
function isFunction( obj ) {                                                                     // 417
	return ({}).toString.call( obj ) === "[object Function]";                                       // 418
}                                                                                                // 419
                                                                                                 // 420
function async( fn ) {                                                                           // 421
	var isAsync = false;                                                                            // 422
	setTimeout(function() {                                                                         // 423
		isAsync = true;                                                                                // 424
	}, 1 );                                                                                         // 425
	return function() {                                                                             // 426
		var that = this,                                                                               // 427
			args = arguments;                                                                             // 428
		if ( isAsync ) {                                                                               // 429
			fn.apply( that, args );                                                                       // 430
		} else {                                                                                       // 431
			setTimeout(function() {                                                                       // 432
				fn.apply( that, args );                                                                      // 433
			}, 1 );                                                                                       // 434
		}                                                                                              // 435
	};                                                                                              // 436
}                                                                                                // 437
                                                                                                 // 438
amplify.request = function( resourceId, data, callback ) {                                       // 439
	// default to an empty hash just so we can handle a missing resourceId                          // 440
	// in one place                                                                                 // 441
	var settings = resourceId || {};                                                                // 442
                                                                                                 // 443
	if ( typeof settings === "string" ) {                                                           // 444
		if ( isFunction( data ) ) {                                                                    // 445
			callback = data;                                                                              // 446
			data = {};                                                                                    // 447
		}                                                                                              // 448
		settings = {                                                                                   // 449
			resourceId: resourceId,                                                                       // 450
			data: data || {},                                                                             // 451
			success: callback                                                                             // 452
		};                                                                                             // 453
	}                                                                                               // 454
                                                                                                 // 455
	var request = { abort: noop },                                                                  // 456
		resource = amplify.request.resources[ settings.resourceId ],                                   // 457
		success = settings.success || noop,                                                            // 458
		error = settings.error || noop;                                                                // 459
	settings.success = async( function( data, status ) {                                            // 460
		status = status || "success";                                                                  // 461
		amplify.publish( "request.success", settings, data, status );                                  // 462
		amplify.publish( "request.complete", settings, data, status );                                 // 463
		success( data, status );                                                                       // 464
	});                                                                                             // 465
	settings.error = async( function( data, status ) {                                              // 466
		status = status || "error";                                                                    // 467
		amplify.publish( "request.error", settings, data, status );                                    // 468
		amplify.publish( "request.complete", settings, data, status );                                 // 469
		error( data, status );                                                                         // 470
	});                                                                                             // 471
                                                                                                 // 472
	if ( !resource ) {                                                                              // 473
		if ( !settings.resourceId ) {                                                                  // 474
			throw "amplify.request: no resourceId provided";                                              // 475
		}                                                                                              // 476
		throw "amplify.request: unknown resourceId: " + settings.resourceId;                           // 477
	}                                                                                               // 478
                                                                                                 // 479
	if ( !amplify.publish( "request.before", settings ) ) {                                         // 480
		settings.error( null, "abort" );                                                               // 481
		return;                                                                                        // 482
	}                                                                                               // 483
                                                                                                 // 484
	amplify.request.resources[ settings.resourceId ]( settings, request );                          // 485
	return request;                                                                                 // 486
};                                                                                               // 487
                                                                                                 // 488
amplify.request.types = {};                                                                      // 489
amplify.request.resources = {};                                                                  // 490
amplify.request.define = function( resourceId, type, settings ) {                                // 491
	if ( typeof type === "string" ) {                                                               // 492
		if ( !( type in amplify.request.types ) ) {                                                    // 493
			throw "amplify.request.define: unknown type: " + type;                                        // 494
		}                                                                                              // 495
                                                                                                 // 496
		settings.resourceId = resourceId;                                                              // 497
		amplify.request.resources[ resourceId ] =                                                      // 498
			amplify.request.types[ type ]( settings );                                                    // 499
	} else {                                                                                        // 500
		// no pre-processor or settings for one-off types (don't invoke)                               // 501
		amplify.request.resources[ resourceId ] = type;                                                // 502
	}                                                                                               // 503
};                                                                                               // 504
                                                                                                 // 505
}( amplify ) );                                                                                  // 506
                                                                                                 // 507
                                                                                                 // 508
                                                                                                 // 509
                                                                                                 // 510
                                                                                                 // 511
(function( amplify, $, undefined ) {                                                             // 512
                                                                                                 // 513
var xhrProps = [ "status", "statusText", "responseText", "responseXML", "readyState" ],          // 514
    rurlData = /\{([^\}]+)\}/g;                                                                  // 515
                                                                                                 // 516
amplify.request.types.ajax = function( defnSettings ) {                                          // 517
	defnSettings = $.extend({                                                                       // 518
		type: "GET"                                                                                    // 519
	}, defnSettings );                                                                              // 520
                                                                                                 // 521
	return function( settings, request ) {                                                          // 522
		var xhr,                                                                                       // 523
			url = defnSettings.url,                                                                       // 524
			abort = request.abort,                                                                        // 525
			ajaxSettings = $.extend( true, {}, defnSettings, { data: settings.data } ),                   // 526
			aborted = false,                                                                              // 527
			ampXHR = {                                                                                    // 528
				readyState: 0,                                                                               // 529
				setRequestHeader: function( name, value ) {                                                  // 530
					return xhr.setRequestHeader( name, value );                                                 // 531
				},                                                                                           // 532
				getAllResponseHeaders: function() {                                                          // 533
					return xhr.getAllResponseHeaders();                                                         // 534
				},                                                                                           // 535
				getResponseHeader: function( key ) {                                                         // 536
					return xhr.getResponseHeader( key );                                                        // 537
				},                                                                                           // 538
				overrideMimeType: function( type ) {                                                         // 539
					return xhr.overrideMideType( type );                                                        // 540
				},                                                                                           // 541
				abort: function() {                                                                          // 542
					aborted = true;                                                                             // 543
					try {                                                                                       // 544
						xhr.abort();                                                                               // 545
					// IE 7 throws an error when trying to abort                                                // 546
					} catch( e ) {}                                                                             // 547
					handleResponse( null, "abort" );                                                            // 548
				},                                                                                           // 549
				success: function( data, status ) {                                                          // 550
					settings.success( data, status );                                                           // 551
				},                                                                                           // 552
				error: function( data, status ) {                                                            // 553
					settings.error( data, status );                                                             // 554
				}                                                                                            // 555
			};                                                                                            // 556
                                                                                                 // 557
		amplify.publish( "request.ajax.preprocess",                                                    // 558
			defnSettings, settings, ajaxSettings, ampXHR );                                               // 559
                                                                                                 // 560
		$.extend( ajaxSettings, {                                                                      // 561
			success: function( data, status ) {                                                           // 562
				handleResponse( data, status );                                                              // 563
			},                                                                                            // 564
			error: function( _xhr, status ) {                                                             // 565
				handleResponse( null, status );                                                              // 566
			},                                                                                            // 567
			beforeSend: function( _xhr, _ajaxSettings ) {                                                 // 568
				xhr = _xhr;                                                                                  // 569
				ajaxSettings = _ajaxSettings;                                                                // 570
				var ret = defnSettings.beforeSend ?                                                          // 571
					defnSettings.beforeSend.call( this, ampXHR, ajaxSettings ) : true;                          // 572
				return ret && amplify.publish( "request.before.ajax",                                        // 573
					defnSettings, settings, ajaxSettings, ampXHR );                                             // 574
			}                                                                                             // 575
		});                                                                                            // 576
		$.ajax( ajaxSettings );                                                                        // 577
                                                                                                 // 578
		function handleResponse( data, status ) {                                                      // 579
			$.each( xhrProps, function( i, key ) {                                                        // 580
				try {                                                                                        // 581
					ampXHR[ key ] = xhr[ key ];                                                                 // 582
				} catch( e ) {}                                                                              // 583
			});                                                                                           // 584
			// Playbook returns "HTTP/1.1 200 OK"                                                         // 585
			// TODO: something also returns "OK", what?                                                   // 586
			if ( /OK$/.test( ampXHR.statusText ) ) {                                                      // 587
				ampXHR.statusText = "success";                                                               // 588
			}                                                                                             // 589
			if ( data === undefined ) {                                                                   // 590
				// TODO: add support for ajax errors with data                                               // 591
				data = null;                                                                                 // 592
			}                                                                                             // 593
			if ( aborted ) {                                                                              // 594
				status = "abort";                                                                            // 595
			}                                                                                             // 596
			if ( /timeout|error|abort/.test( status ) ) {                                                 // 597
				ampXHR.error( data, status );                                                                // 598
			} else {                                                                                      // 599
				ampXHR.success( data, status );                                                              // 600
			}                                                                                             // 601
			// avoid handling a response multiple times                                                   // 602
			// this can happen if a request is aborted                                                    // 603
			// TODO: figure out if this breaks polling or multi-part responses                            // 604
			handleResponse = $.noop;                                                                      // 605
		}                                                                                              // 606
                                                                                                 // 607
		request.abort = function() {                                                                   // 608
			ampXHR.abort();                                                                               // 609
			abort.call( this );                                                                           // 610
		};                                                                                             // 611
	};                                                                                              // 612
};                                                                                               // 613
                                                                                                 // 614
                                                                                                 // 615
                                                                                                 // 616
amplify.subscribe( "request.ajax.preprocess", function( defnSettings, settings, ajaxSettings ) { // 617
	var mappedKeys = [],                                                                            // 618
		data = ajaxSettings.data;                                                                      // 619
                                                                                                 // 620
	if ( typeof data === "string" ) {                                                               // 621
		return;                                                                                        // 622
	}                                                                                               // 623
                                                                                                 // 624
	data = $.extend( true, {}, defnSettings.data, data );                                           // 625
                                                                                                 // 626
	ajaxSettings.url = ajaxSettings.url.replace( rurlData, function ( m, key ) {                    // 627
		if ( key in data ) {                                                                           // 628
		    mappedKeys.push( key );                                                                    // 629
		    return data[ key ];                                                                        // 630
		}                                                                                              // 631
	});                                                                                             // 632
                                                                                                 // 633
	// We delete the keys later so duplicates are still replaced                                    // 634
	$.each( mappedKeys, function ( i, key ) {                                                       // 635
		delete data[ key ];                                                                            // 636
	});                                                                                             // 637
                                                                                                 // 638
	ajaxSettings.data = data;                                                                       // 639
});                                                                                              // 640
                                                                                                 // 641
                                                                                                 // 642
                                                                                                 // 643
amplify.subscribe( "request.ajax.preprocess", function( defnSettings, settings, ajaxSettings ) { // 644
	var data = ajaxSettings.data,                                                                   // 645
		dataMap = defnSettings.dataMap;                                                                // 646
                                                                                                 // 647
	if ( !dataMap || typeof data === "string" ) {                                                   // 648
		return;                                                                                        // 649
	}                                                                                               // 650
                                                                                                 // 651
	if ( $.isFunction( dataMap ) ) {                                                                // 652
		ajaxSettings.data = dataMap( data );                                                           // 653
	} else {                                                                                        // 654
		$.each( defnSettings.dataMap, function( orig, replace ) {                                      // 655
			if ( orig in data ) {                                                                         // 656
				data[ replace ] = data[ orig ];                                                              // 657
				delete data[ orig ];                                                                         // 658
			}                                                                                             // 659
		});                                                                                            // 660
		ajaxSettings.data = data;                                                                      // 661
	}                                                                                               // 662
});                                                                                              // 663
                                                                                                 // 664
                                                                                                 // 665
                                                                                                 // 666
var cache = amplify.request.cache = {                                                            // 667
	_key: function( resourceId, url, data ) {                                                       // 668
		data = url + data;                                                                             // 669
		var length = data.length,                                                                      // 670
			i = 0,                                                                                        // 671
			checksum = chunk();                                                                           // 672
                                                                                                 // 673
		while ( i < length ) {                                                                         // 674
			checksum ^= chunk();                                                                          // 675
		}                                                                                              // 676
                                                                                                 // 677
		function chunk() {                                                                             // 678
			return data.charCodeAt( i++ ) << 24 |                                                         // 679
				data.charCodeAt( i++ ) << 16 |                                                               // 680
				data.charCodeAt( i++ ) << 8 |                                                                // 681
				data.charCodeAt( i++ ) << 0;                                                                 // 682
		}                                                                                              // 683
                                                                                                 // 684
		return "request-" + resourceId + "-" + checksum;                                               // 685
	},                                                                                              // 686
                                                                                                 // 687
	_default: (function() {                                                                         // 688
		var memoryStore = {};                                                                          // 689
		return function( resource, settings, ajaxSettings, ampXHR ) {                                  // 690
			// data is already converted to a string by the time we get here                              // 691
			var cacheKey = cache._key( settings.resourceId,                                               // 692
					ajaxSettings.url, ajaxSettings.data ),                                                      // 693
				duration = resource.cache;                                                                   // 694
                                                                                                 // 695
			if ( cacheKey in memoryStore ) {                                                              // 696
				ampXHR.success( memoryStore[ cacheKey ] );                                                   // 697
				return false;                                                                                // 698
			}                                                                                             // 699
			var success = ampXHR.success;                                                                 // 700
			ampXHR.success = function( data ) {                                                           // 701
				memoryStore[ cacheKey ] = data;                                                              // 702
				if ( typeof duration === "number" ) {                                                        // 703
					setTimeout(function() {                                                                     // 704
						delete memoryStore[ cacheKey ];                                                            // 705
					}, duration );                                                                              // 706
				}                                                                                            // 707
				success.apply( this, arguments );                                                            // 708
			};                                                                                            // 709
		};                                                                                             // 710
	}())                                                                                            // 711
};                                                                                               // 712
                                                                                                 // 713
if ( amplify.store ) {                                                                           // 714
	$.each( amplify.store.types, function( type ) {                                                 // 715
		cache[ type ] = function( resource, settings, ajaxSettings, ampXHR ) {                         // 716
			var cacheKey = cache._key( settings.resourceId,                                               // 717
					ajaxSettings.url, ajaxSettings.data ),                                                      // 718
				cached = amplify.store[ type ]( cacheKey );                                                  // 719
                                                                                                 // 720
			if ( cached ) {                                                                               // 721
				ajaxSettings.success( cached );                                                              // 722
				return false;                                                                                // 723
			}                                                                                             // 724
			var success = ampXHR.success;                                                                 // 725
			ampXHR.success = function( data ) {	                                                          // 726
				amplify.store[ type ]( cacheKey, data, { expires: resource.cache.expires } );                // 727
				success.apply( this, arguments );                                                            // 728
			};                                                                                            // 729
		};                                                                                             // 730
	});                                                                                             // 731
	cache.persist = cache[ amplify.store.type ];                                                    // 732
}                                                                                                // 733
                                                                                                 // 734
amplify.subscribe( "request.before.ajax", function( resource ) {                                 // 735
	var cacheType = resource.cache;                                                                 // 736
	if ( cacheType ) {                                                                              // 737
		// normalize between objects and strings/booleans/numbers                                      // 738
		cacheType = cacheType.type || cacheType;                                                       // 739
		return cache[ cacheType in cache ? cacheType : "_default" ]                                    // 740
			.apply( this, arguments );                                                                    // 741
	}                                                                                               // 742
});                                                                                              // 743
                                                                                                 // 744
                                                                                                 // 745
                                                                                                 // 746
amplify.request.decoders = {                                                                     // 747
	// http://labs.omniti.com/labs/jsend                                                            // 748
	jsend: function( data, status, ampXHR, success, error ) {                                       // 749
		if ( data.status === "success" ) {                                                             // 750
			success( data.data );                                                                         // 751
		} else if ( data.status === "fail" ) {                                                         // 752
			error( data.data, "fail" );                                                                   // 753
		} else if ( data.status === "error" ) {                                                        // 754
			delete data.status;                                                                           // 755
			error( data, "error" );                                                                       // 756
		}                                                                                              // 757
	}                                                                                               // 758
};                                                                                               // 759
                                                                                                 // 760
amplify.subscribe( "request.before.ajax", function( resource, settings, ajaxSettings, ampXHR ) { // 761
	var _success = ampXHR.success,                                                                  // 762
		_error = ampXHR.error,                                                                         // 763
		decoder = $.isFunction( resource.decoder )                                                     // 764
			? resource.decoder                                                                            // 765
			: resource.decoder in amplify.request.decoders                                                // 766
				? amplify.request.decoders[ resource.decoder ]                                               // 767
				: amplify.request.decoders._default;                                                         // 768
                                                                                                 // 769
	if ( !decoder ) {                                                                               // 770
		return;                                                                                        // 771
	}                                                                                               // 772
                                                                                                 // 773
	function success( data, status ) {                                                              // 774
		_success( data, status );                                                                      // 775
	}                                                                                               // 776
	function error( data, status ) {                                                                // 777
		_error( data, status );                                                                        // 778
	}                                                                                               // 779
	ampXHR.success = function( data, status ) {                                                     // 780
		decoder( data, status, ampXHR, success, error );                                               // 781
	};                                                                                              // 782
	ampXHR.error = function( data, status ) {                                                       // 783
		decoder( data, status, ampXHR, success, error );                                               // 784
	};                                                                                              // 785
});                                                                                              // 786
                                                                                                 // 787
}( amplify, jQuery ) );                                                                          // 788
                                                                                                 // 789
///////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
