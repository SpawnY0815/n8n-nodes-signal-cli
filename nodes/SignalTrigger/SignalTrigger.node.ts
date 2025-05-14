"use strict";

const {
  ITriggerFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeApiError,
} = require('n8n-workflow');
const WebSocket = require('ws');
const debug = require('debug');

const signalTriggerDebug = debug('n8n:nodes:signal-trigger');

class SignalTrigger {
  constructor() {
    this.description = /** @type {INodeTypeDescription} */ ({
      displayName: 'Signal Trigger',
      name: 'signalTrigger',
      group: ['trigger'],
      version: 1,
      description: 'Triggers when a new message is received',
      defaults: {
        name: 'Signal Trigger',
      },
      inputs: [],
      outputs: ['main'],
      credentials: [
        {
          name: 'signalCliApi',
          required: true,
        },
      ],
      properties: [],
    });
  }

  /**
   * @this {ITriggerFunctions}
   * @returns {Promise<import('n8n-workflow').ITriggerResponse>}
   */
  async trigger() {
    const credentials = await this.getCredentials('signalCliApi');

    if (!credentials.url) {
      throw new NodeApiError(this.getNode(), {
        message: 'Signal CLI API URL is not set in credentials',
      });
    }
    if (!credentials.account) {
      throw new NodeApiError(this.getNode(), {
        message: 'Signal CLI account is not set in credentials',
      });
    }

    // Build WebSocket URL with phone number (account)
    const baseUrl = credentials.url.replace(/\/+$/, '');
    const url = `${baseUrl}/v1/receive/${encodeURIComponent(credentials.account)}`;

    const ws = new WebSocket(url);

    // Handle incoming WebSocket messages
    ws.on('message', (data) => {
      signalTriggerDebug('Received message: %s', data.toString());
      try {
        const parsed = JSON.parse(data.toString());
//        const message = parsed.dataMessage?.message;
        const message = parsed.envelope?.dataMessage?.message;

        if (message) {
          /** @type {INodeExecutionData} */
          const item = { json: { message } };
          this.emit([this.helpers.returnJsonArray([item])]);
        }
      } catch (error) {
        this.logger.error('Error parsing WebSocket message', { error });
      }
    });

    return new Promise((resolve, reject) => {
      // On successful connection
      ws.on('open', () => {
        signalTriggerDebug('WebSocket connected to %s', url);
        resolve({
          closeFunction: async () => {
            ws.close();
          },
        });
      });

      // On connection error
      ws.on('error', (err) => {
        this.logger.error('WebSocket error', { error: err });
        reject(err);
      });
    });
  }
}

exports.SignalTrigger = SignalTrigger;