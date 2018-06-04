const mixin = require('mixin');
const recurly = require('../');

/**
 * Error accessor.
 *
 * @param {String} name
 * @param {Object} options
 * @return {Error}
 */

export default function errors (name, options) {
  const error = errors.get(name, options);
  logEvent(error);
  return error;
}

/**
 * Defined errors.
 *
 * @type {Object}
 * @private
 */

errors.map = {};

/**
 * Base url for documention.
 *
 * @type {String}
 * @private
 */

errors.baseURL = '';

/**
 * Sets the `baseURL` for docs.
 *
 * @param {String} url
 * @public
 */

errors.doc = function (baseURL) {
  errors.baseURL = baseURL;
};

/**
 * Gets errors defined by `name`.
 *
 * @param {String} name
 * @param {Object} context
 * @return {Error}
 * @public
 */

errors.get = function (name, context) {
  if (!(name in errors.map)) {
    throw new Error(`invalid error: ${name}`);
  } else {
    return new errors.map[name](context);
  }
};

/**
 * Registers an error defined by `name` with `config`.
 *
 * @param {String} name
 * @param {Object} config
 * @return {Error}
 * @public
 */

errors.add = function (name, config) {
  config = config || {};

  function RecurlyError (context) {
    Error.call(this);

    this.name = this.code = name;
    if (config.message instanceof Function) {
      this.message = config.message(context);
    } else {
      this.message = config.message;
    }
    mixin(this, context || {});

    if (config.help) {
      this.help = errors.baseURL + config.help;
      this.message += ' (need help? ' + this.help + ')';
    }
  };

  RecurlyError.prototype = new Error();
  return errors.map[name] = RecurlyError;
};

function logEvent (error) {
  let type = 'client';
  if (error.classification) type += `:${error.classification}`;
  console.log('hmm')
  if (recurly.event) recurly.event.send({ name: 'error', type });
}

/**
 * Internal definations.
 *
 * TODO(gjohnson): open source this as a component
 * and move these out.
 */

errors.doc('https://docs.recurly.com/js');

errors.add('not-configured', {
  message: 'Not configured. You must first call recurly.configure().',
  classification: 'merchant',
  help: '#identify-your-site'
});

errors.add('config-missing-public-key', {
  message: 'The publicKey setting is required.',
  classification: 'merchant',
  help: '#identify-your-site'
});

errors.add('config-missing-fields', {
  message: 'The fields setting is required.',
  classification: 'merchant'
});

errors.add('missing-hosted-field-target', {
  message: c => `Target element not found for ${c.type} field using selector '${c.selector}'`,
  classification: 'merchant'
});

errors.add('api-error', {
  message: 'There was an error with your request.',
  classification: 'metal'
});

errors.add('api-timeout', {
  message: 'The API request timed out.',
  classification: 'metal'
});

errors.add('validation', {
  message: 'There was an error validating your request.',
  classification: 'customer'
});

errors.add('missing-callback', {
  message: 'Missing callback',
  classification: 'merchant'
});

errors.add('invalid-options', {
  message: 'Options must be an object',
  classification: 'merchant'
});

errors.add('invalid-option', {
  message: c => `Option ${c.name} must be ${c.expect}`,
  classification: 'merchant'
});

errors.add('missing-plan', {
  message: 'A plan must be specified.',
  classification: 'merchant'
});

errors.add('missing-coupon', {
  message: 'A coupon must be specified.',
  classification: 'merchant'
});

errors.add('invalid-item', {
  message: 'The given item does not appear to be a valid recurly plan, coupon, addon, or taxable address.',
  classification: 'merchant'
});

errors.add('invalid-addon', {
  message: 'The given addon_code is not among the valid addons for the specified plan.',
  classification: 'merchant'
});

errors.add('invalid-currency', {
  message: c => `The given currency (${c.currency}) is not among the valid codes for the specified plan(s): ${c.allowed}.`,
  classification: 'merchant'
});

errors.add('invalid-plan-currency', {
  message: c => `The requested plan (${c.planCode}) does not support the possible checkout currencies: ${c.currencies}.`,
  classification: 'merchant'
});

errors.add('invalid-subscription-currency', {
  message: 'The given subscription does not support the currencies of this Checkout instance\'s existing subscriptions',
  classification: 'merchant'
});

errors.add('unremovable-item', {
  message: 'The given item cannot be removed.',
  classification: 'merchant'
});

errors.add('fraud-data-collector-request-failed', {
  message: c => `There was an error getting the data collector fields: ${c.error}`,
  classification: 'metal'
});

errors.add('fraud-data-collector-missing-form', {
  message: c => `There was an error finding a form to inject the data collector fields using selector '${c.selector}'`,
  classification: 'merchant'
});

errors.add('gift-card-currency-mismatch', {
  message: 'The giftcard currency does not match the given currency.',
  classification: 'merchant'
});

errors.add('apple-pay-not-supported', {
  message: 'Apple Pay is not supported by this device or browser.',
  classification: 'environment'
});

errors.add('apple-pay-not-available', {
  message: 'Apple Pay is supported by this device, but the customer has not configured Apple Pay.',
  classification: 'environment'
});

errors.add('apple-pay-config-missing', {
  message: c => `Missing Apple Pay configuration option: '${c.opt}'`,
  classification: 'merchant'
});

errors.add('apple-pay-config-invalid', {
  message: c => `Apple Pay configuration option '${c.opt}' is not among your available options: ${c.set}.
                 Please refer to your site configuration if the available options is incorrect.`,
  classification: 'merchant'
});

errors.add('apple-pay-factory-only', {
  message: 'Apple Pay must be initialized by calling recurly.ApplePay',
  classification: 'merchant'
});

errors.add('apple-pay-init-error', {
  message: c => {
    let message = 'Apple Pay did not initialize due to a fatal error';
    if (c.err) message += `: ${c.err.message}`;
    return message;
  },
  classification: 'metal'
});

errors.add('apple-pay-payment-failure', {
  message: 'Apply Pay could not charge the customer',
  classification: 'metal'
});

errors.add('paypal-factory-only', {
  message: 'PayPal must be initialized by calling recurly.PayPal',
  classification: 'merchant'
});

errors.add('paypal-config-missing', {
  message: c => `Missing PayPal configuration option: '${c.opt}'`,
  classification: 'merchant'
});

errors.add('paypal-load-error', {
  message: 'Client libraries failed to load',
  classification: 'environment'
});

errors.add('paypal-client-error', {
  message: 'PayPal encountered an unexpected error',
  classification: 'metal'
});

errors.add('paypal-tokenize-error', {
  message: 'An error occurred while attempting to generate the PayPal token',
  classification: 'metal'
});

errors.add('paypal-tokenize-recurly-error', {
  message: 'An error occurred while attempting to generate the Recurly token',
  classification: 'metal'
});

errors.add('paypal-braintree-not-ready', {
  message: 'Braintree PayPal is not yet ready to create a checkout flow',
  classification: 'merchant'
});

errors.add('paypal-braintree-api-error', {
  message: 'Braintree API experienced an error',
  classification: 'metal'
});

errors.add('paypal-braintree-tokenize-braintree-error', {
  message: 'An error occurred while attempting to generate the Braintree token',
  classification: 'metal'
});

errors.add('paypal-braintree-tokenize-recurly-error', {
  message: 'An error occurred while attempting to generate the Braintree token within Recurly',
  classification: 'metal'
});
