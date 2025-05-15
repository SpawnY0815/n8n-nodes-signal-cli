"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signal = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('n8n:signal');

class Signal {
    constructor() {
        this.description = {
            displayName: 'Signal',
            name: 'signal',
            group: ['output'],
            version: 1,
            description: 'Interact with Signal CLI API',
            defaults: { name: 'Signal' },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [{ name: 'signalCliApi', required: true }],
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        { name: 'Contact', value: 'contact' },
                        { name: 'Group',   value: 'group'   },
                        { name: 'Message', value: 'message' },
                        { name: 'Reaction',value: 'reaction'},
                        { name: 'Receipt', value: 'receipt' },
                    ],
                    default: 'message',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: { show: { resource: ['message'] } },
                    options: [{ name: 'Send', value: 'send', action: 'Send a message' }],
                    default: 'send',
                },
                {
                    displayName: 'Account',
                    name: 'account',
                    type: 'string',
                    description: 'Phone number (international format)',
                    default: '',
                    required: true,
                    displayOptions: { show: { resource: ['message'] } },
                },
                {
                    displayName: 'Recipient',
                    name: 'recipient',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'Phone number (international format) or full group ID',
                    displayOptions: { show: { resource: ['message'], operation: ['send'] } },
                },
                {
                    displayName: 'Message',
                    name: 'message',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'The message to be sent',
                    displayOptions: { show: { resource: ['message'], operation: ['send'] } },
                },
                // … Properties für group, contact, reaction und receipt bleiben unverändert
            ],
        };
    }

    async execute() {
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        const credentials = await this.getCredentials('signalCliApi');

        if (!credentials.url) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Signal CLI API URL is not set in credentials');
        }

        const rpcUrl = `${credentials.url}/api/v1/rpc`;

        try {
            let response;
            debug('Signal Node: Executing with resource=%s, operation=%s', resource, operation);

            if (resource === 'message' && operation === 'send') {
                const account   = this.getNodeParameter('account', 0);
                const recipient = this.getNodeParameter('recipient', 0);
                const message   = this.getNodeParameter('message', 0);

                const postBody = { number: account, message, recipients: [recipient] };
                debug('Signal Node: Sending message with postBody=%o', postBody);
                response = await axios_1.default.post(`${credentials.url}/v2/send`, postBody);

            } else if (resource === 'group' && operation === 'create') {
                const account = this.getNodeParameter('account', 0);
                const name    = this.getNodeParameter('name', 0);
                const members = this.getNodeParameter('members', 0).split(',');
                const requestBody = {
                    jsonrpc: '2.0',
                    method: 'updateGroup',
                    params: { account, name, members },
                    id: (0, uuid_1.v4)(),
                };
                response = await axios_1.default.post(rpcUrl, requestBody);

            } else if (resource === 'group' && operation === 'list') {
                const account = this.getNodeParameter('account', 0);
                const requestBody = {
                    jsonrpc: '2.0',
                    method: 'listGroups',
                    params: { account },
                    id: (0, uuid_1.v4)(),
                };
                response = await axios_1.default.post(rpcUrl, requestBody);

            } else if (resource === 'contact' && operation === 'update') {
                const account   = this.getNodeParameter('account', 0);
                const recipient = this.getNodeParameter('recipient', 0);
                const name      = this.getNodeParameter('name', 0);
                const requestBody = {
                    jsonrpc: '2.0',
                    method: 'updateContact',
                    params: { account, recipient, name },
                    id: (0, uuid_1.v4)(),
                };
                response = await axios_1.default.post(rpcUrl, requestBody);

            } else if (resource === 'contact' && operation === 'list') {
                const account = this.getNodeParameter('account', 0);
                const requestBody = {
                    jsonrpc: '2.0',
                    method: 'listContacts',
                    params: { account },
                    id: (0, uuid_1.v4)(),
                };
                response = await axios_1.default.post(rpcUrl, requestBody);

            } else if (resource === 'reaction' && operation === 'send') {
                const account      = this.getNodeParameter('account', 0);
                const recipient    = this.getNodeParameter('recipient', 0);
                const reaction     = this.getNodeParameter('reaction', 0);
                const targetAuthor = this.getNodeParameter('targetAuthor', 0);
                const timestamp    = this.getNodeParameter('timestamp', 0);
                const requestBody = {
                    jsonrpc: '2.0',
                    method: 'sendReaction',
                    params: { account, recipient, reaction, targetAuthor, timestamp },
                    id: (0, uuid_1.v4)(),
                };
                response = await axios_1.default.post(rpcUrl, requestBody);

            } else if (resource === 'reaction' && operation === 'remove') {
                const account      = this.getNodeParameter('account', 0);
                const recipient    = this.getNodeParameter('recipient', 0);
                const reaction     = this.getNodeParameter('reaction', 0);
                const targetAuthor = this.getNodeParameter('targetAuthor', 0);
                const timestamp    = this.getNodeParameter('timestamp', 0);
                const requestBody = {
                    jsonrpc: '2.0',
                    method: 'sendReaction',
                    params: { account, recipient, reaction, targetAuthor, timestamp, remove: true },
                    id: (0, uuid_1.v4)(),
                };
                response = await axios_1.default.post(rpcUrl, requestBody);

            } else if (resource === 'receipt' && operation === 'send') {
                const account     = this.getNodeParameter('account', 0);
                const recipient   = this.getNodeParameter('recipient', 0);
                const receiptType = this.getNodeParameter('receiptType', 0);
                const timestamp   = this.getNodeParameter('timestamp', 0);
                const requestBody = {
                    jsonrpc: '2.0',
                    method: 'sendReceipt',
                    params: { account, recipient, receiptType, timestamp },
                    id: (0, uuid_1.v4)(),
                };
                response = await axios_1.default.post(rpcUrl, requestBody);
            }

            const item = { json: response.data };
            return [[item]];

        } catch (error) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Error interacting with Signal API', { itemIndex: 0 });
        }
    }
}

exports.Signal = Signal;
//# sourceMappingURL=Signal.node.js.map