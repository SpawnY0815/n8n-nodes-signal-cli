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

    // Build WebSocket URL
    const baseUrl = credentials.url.replace(/\/+$/, '');
    const url = `${baseUrl}/v1/receive/${encodeURIComponent(credentials.account)}`;
    const ws = new WebSocket(url);

    ws.on('message', (raw) => {
      signalTriggerDebug('Raw message: %s', raw.toString());
      let payload;
      try {
        payload = JSON.parse(raw.toString());
      } catch (err) {
        this.logger.error('Invalid JSON from WebSocket', { error: err });
        return;
      }

      const { envelope, account } = payload;

      // 1) nur echte eingehende Nachrichten (dataMessage.message !== null)
      if (!envelope.dataMessage?.message) return;

      // 2) keine Self-Loop: Quelle darf nicht unser eigenes Konto sein
      if (envelope.source === account) return;

      // alles ok → weiteremitten
      /** @type {INodeExecutionData} */
      const item = { json: payload };
      this.emit([ this.helpers.returnJsonArray([item]) ]);
    });

    return new Promise((resolve, reject) => {
      ws.on('open', () => {
        signalTriggerDebug('WebSocket connected to %s', url);
        resolve({
          closeFunction: async () => {
            ws.close();
          },
        });
      });

      ws.on('error', (err) => {
        this.logger.error('WebSocket error', { error: err });
        reject(err);
      });
    });
  }
}

exports.SignalTrigger = SignalTrigger;
