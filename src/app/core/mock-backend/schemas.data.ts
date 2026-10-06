import { RawRequestSchema } from '../models';

/** The two schemas from the challenge brief, verbatim. */
export const MOCK_SCHEMAS: readonly RawRequestSchema[] = [
  {
    id: 'software-request',
    title: 'Software Request',
    sections: [
      {
        id: 'requested-item',
        title: 'Requested Item',
        fields: [
          { id: 1758177604, label: 'Item Name', type: 'text', required: true },
          { id: 75484637462, label: 'Quantity', type: 'number', required: true },
        ],
      },
      {
        id: 'vendor-info',
        title: 'Vendor Information',
        fields: [
          { id: 4957463729, label: 'Vendor Name', type: 'text', required: true },
          {
            id: 8462736152,
            label: 'Vendor Location',
            type: 'radio',
            required: true,
            options: ['USA', 'UK', 'Other'],
          },
          { id: 6482937561, label: 'Website', type: 'text', required: false },
        ],
      },
    ],
  },
  {
    id: 'hardware-request',
    title: 'Hardware Request',
    sections: [
      {
        id: 'requested-item',
        title: 'Requested Item',
        fields: [
          { id: 75329829348985, label: 'Item Name', type: 'text', required: true },
          { id: 85781623672346, label: 'Quantity', type: 'number', required: false },
          { id: 2389182391823812, label: 'Requires shipping', type: 'toggle', default: false },
        ],
      },
      {
        id: 'vendor-info',
        title: 'Vendor Information',
        fields: [
          { id: 9542834823423, label: 'Vendor Name', type: 'text', required: true },
          {
            id: 5587934758234,
            label: 'Vendor Location',
            type: 'radio',
            required: true,
            options: ['USA', 'UK', 'Other'],
          },
        ],
      },
    ],
  },
];
