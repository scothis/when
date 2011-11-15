(function(global, doh) {

	function assertIsPromise(it) {
		doh.assertTrue(when.isPromise(it));
	}

	function assertIsNotPromise(it) {
		doh.assertFalse(when.isPromise(it));
	}

	function assertResolutionEquals(expected, dohDeferred) {
		return function(result) {
			dohDeferred.callback(expected === result);
		};
	}

	function rejecter(dohDeferred) {
		return function(e) {
			dohDeferred.errback(e);
		};
	}

	doh.assertIsPromise = assertIsPromise;
	doh.assertIsNotPromise = assertIsNotPromise;
	doh.assertResolutionEquals = assertResolutionEquals;
	doh.rejecter = rejecter;

	function getArrayAssertion(dohd, expected, expectedLength) {
		// Use expectedLength if supplied, otherwise length of expected results
		var len = arguments.length > 2 ? expectedLength : expected.length;

		// Return a promise handler that will verify the results
		return function(val) {
			var success = len === val.length;

			// This test may be overlay lax
			// The question of order and array position for when.some
			// is still up in the air, so this test simply ensures
			// that the results values are somewhere in the expected
			// set.
			for (var i = 0; i < len; i++) {
				success = success && (expected.indexOf(val[i]) >= 0);
			}

			dohd.callback(success);
		}
	}

	doh.asyncHelper = {
		deferN: function(n) {
			// Create an array of N values, and N deferreds.
			// Each deferred will resolve to its corresponding value
			// after a random timeout
			
			var values, deferreds, i = 0;

			values = [];
			deferreds = [];

			for (; i < n; i++) {
				values.push(i);
				deferreds.push(when.defer());
			}

			for (i = 0; i < n; i++) {
				(function(i) {
					setTimeout(function() {
						deferreds[i].resolve(values[i]);
					}, Math.random() * 50);
				})(i);
			}

			return { values: values, promises: deferreds };
		},
		assertSome: function(expected, promisesOrValues, howMany, howManyExpected) {
			var dohd = new doh.Deferred();

			if (arguments.length < 3) {
				howMany = promisesOrValues.length
			}
			if (arguments.length < 4) {
				howManyExpected = howMany
			}

			when.some(promisesOrValues, howMany,
				getArrayAssertion(dohd, expected, Math.min(expected.length, howManyExpected)),
				doh.rejecter(dohd)
			);

			return dohd;
		},
		assertAll: function(expected, promisesOrValues) {
			var dohd = new doh.Deferred();

			when.all(promisesOrValues,
				getArrayAssertion(dohd, expected),
				doh.rejecter(dohd)
			);

			return dohd;
		}
	}

})(this, doh);