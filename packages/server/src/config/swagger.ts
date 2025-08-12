import swaggerJsdoc from 'swagger-jsdoc';
import type { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Firma-Sign API',
    version: '1.0.0',
    description: 'REST API for the Firma-Sign decentralized document signing system',
    contact: {
      name: 'FirmaChain',
      url: 'https://github.com/firmachain/firma-sign',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:8080/api',
      description: 'Development server',
    },
    {
      url: 'https://api.firma-sign.com/api',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/auth/connect',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      TransferStatus: {
        type: 'string',
        enum: ['pending', 'ready', 'partially-signed', 'completed'],
        description: 'Current status of the transfer',
      },
      DocumentStatus: {
        type: 'string',
        enum: ['draft', 'pending', 'in_progress', 'signed', 'completed', 'archived', 'deleted'],
        description: 'Current status of the document',
      },
      TransferType: {
        type: 'string',
        enum: ['incoming', 'outgoing'],
        description: 'Type of transfer',
      },
      SenderInfo: {
        type: 'object',
        properties: {
          senderId: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          publicKey: { type: 'string' },
          transport: { type: 'string' },
          timestamp: { type: 'number' },
          verificationStatus: {
            type: 'string',
            enum: ['verified', 'unverified'],
          },
        },
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fileName: { type: 'string' },
          fileSize: { type: 'number' },
          fileHash: { type: 'string' },
          status: { $ref: '#/components/schemas/DocumentStatus' },
          url: { type: 'string' },
          expires: { type: 'number', nullable: true },
        },
      },
      Recipient: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          identifier: { type: 'string' },
          transport: { type: 'string' },
          status: { type: 'string' },
          notifiedAt: { type: 'number', nullable: true },
          viewedAt: { type: 'number', nullable: true },
          signedAt: { type: 'number', nullable: true },
        },
      },
      Transfer: {
        type: 'object',
        properties: {
          transferId: { type: 'string' },
          type: { $ref: '#/components/schemas/TransferType' },
          sender: { 
            allOf: [{ $ref: '#/components/schemas/SenderInfo' }],
            nullable: true,
          },
          status: { $ref: '#/components/schemas/TransferStatus' },
          transport: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              deliveryStatus: { type: 'string' },
            },
          },
          documents: {
            type: 'array',
            items: { $ref: '#/components/schemas/Document' },
          },
          recipients: {
            type: 'array',
            items: { $ref: '#/components/schemas/Recipient' },
          },
          metadata: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
      CreateTransferRequest: {
        type: 'object',
        required: ['documents', 'recipients'],
        properties: {
          documents: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'fileName'],
              properties: {
                id: { type: 'string' },
                fileName: { type: 'string' },
                fileData: { 
                  type: 'string',
                  format: 'byte',
                  description: 'Base64 encoded file data',
                },
              },
            },
          },
          recipients: {
            type: 'array',
            items: {
              type: 'object',
              required: ['identifier', 'transport'],
              properties: {
                identifier: { type: 'string' },
                transport: {
                  type: 'string',
                  enum: ['p2p', 'email', 'discord', 'telegram', 'web'],
                },
                signerAssignments: {
                  type: 'object',
                  additionalProperties: { type: 'boolean' },
                },
                preferences: {
                  type: 'object',
                  properties: {
                    fallbackTransport: { type: 'string' },
                    notificationEnabled: { type: 'boolean' },
                  },
                },
              },
            },
          },
          metadata: {
            type: 'object',
            properties: {
              deadline: { type: 'string', format: 'date-time' },
              message: { type: 'string' },
              requireAllSignatures: { type: 'boolean' },
            },
          },
        },
      },
      SignDocumentsRequest: {
        type: 'object',
        required: ['signatures'],
        properties: {
          signatures: {
            type: 'array',
            items: {
              type: 'object',
              required: ['documentId', 'signature', 'status'],
              properties: {
                documentId: { type: 'string' },
                signature: { 
                  type: 'string',
                  format: 'byte',
                  description: 'Base64 encoded signature data',
                },
                components: {
                  type: 'array',
                  items: { type: 'object' },
                },
                status: {
                  type: 'string',
                  enum: ['signed', 'rejected'],
                },
                rejectReason: { type: 'string' },
              },
            },
          },
          returnTransport: { type: 'string' },
        },
      },
      ConnectRequest: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { 
            type: 'string',
            description: '6-character transfer code',
            example: 'ABC123',
          },
          transport: { 
            type: 'string',
            description: 'Optional transport hint',
          },
        },
      },
      ConnectResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          transferId: { type: 'string' },
          sessionToken: { type: 'string' },
          expiresIn: { type: 'number' },
        },
      },
      TransportInfo: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          enabled: { type: 'boolean' },
          configured: { type: 'boolean' },
          status: { type: 'string' },
          version: { type: 'string' },
          features: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication and session management',
    },
    {
      name: 'Transfers',
      description: 'Document transfer operations',
    },
    {
      name: 'Documents',
      description: 'Document management operations',
    },
    {
      name: 'Blockchain',
      description: 'Blockchain verification operations',
    },
    {
      name: 'System',
      description: 'System information and health checks',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    './src/api/routes/*.ts',
    './src/api/swagger/*.yml',
    './dist/api/routes/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);