import each from 'component-each';
import Emitter from 'component-emitter';
import dom from '../util/dom';
import errors from './errors';

const debug = require('debug')('recurly:fraud');

export class Fraud extends Emitter {
  constructor (recurly) {
    super();

    this.recurly = recurly;
    this.selector = this.recurly.config.fields.number.selector;
    this.dataCollectorInitiated = false;
    this.form = undefined;

    if (this.shouldCollectData) {
      recurly.ready(this.dataCollector.bind(this));
    }
  }

  get shouldCollectData () {
    return !!this.recurly.config.fraud.kount.dataCollector;
  }

  /**
   * gets the fraud params present including injected form fields
   * as well as grabbing litle session id if configured
   */
  params (data) {
    let fraudParams = [];

    if (this.recurly.config.fraud.kount.dataCollector && data['fraud_session_id']) {
      fraudParams.push({
        processor: 'kount',
        session_id: data.fraud_session_id
      });
    }

    if (this.recurly.config.fraud.litle.sessionId) {
      fraudParams.push({
        processor: 'litle_threat_metrix',
        session_id: this.recurly.config.fraud.litle.sessionId
      });
    }

    if (this.recurly.config.fraud.braintree.deviceData) {
      fraudParams.push({
        processor: 'braintree',
        session_id: this.recurly.config.fraud.braintree.deviceData
      });
    }

    return fraudParams;
  }

  /**
   * requests the data collector form fields from the
   * Recurly server and injects them into the payment form
   */
  dataCollector () {
    if (this.dataCollectorInitiated) return;

    this.dataCollectorInitiated = true;

    this.getForm();

    this.recurly.request.get({
      route: '/fraud_data_collector',
      done: (error, response) => {
        debug("response from recurly data collector", error, response);
        if (error) {
          throw errors('fraud-data-collector-request-failed', { error });
        } else if (response.content) {
          this.addNodes(response.content);
          this.emit('ready');
        }
      }
    });
  }

  addNodes (contentString) {
    var tempContainer = document.createElement('div');
    tempContainer.innerHTML = contentString;

    each(tempContainer.childNodes, node => this.form.appendChild(node));
  }

  getForm () {
    this.form = dom.findNodeInParents(window.document.querySelector(this.selector), 'form');

    if (!dom.element(this.form)) {
      throw errors('fraud-data-collector-missing-form', { selector: this.selector });
    }
  }
}
