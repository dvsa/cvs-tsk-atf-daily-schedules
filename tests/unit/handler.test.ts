import { APIGatewayEvent } from 'aws-lambda';
import { mocked } from 'ts-jest/utils';
import { handler } from '../../src/handler';
import { createMajorVersionNumber } from '../../src/utils';
import { sendEvents } from '../../src/eventbridge/send';
import { SendResponse } from '../../src/eventbridge/SendResponse';
import { getEvents } from '../../src/wms/ExportEvents';
import { FacillitySchedules } from '../../src/wms/Interfaces/DynamicsCE';

jest.mock('../../src/eventbridge/send');
jest.mock('../../src/wms/ExportEvents');
jest.mock('../../src/utils');
const mCreateMajorVersionNumber = mocked(createMajorVersionNumber, true);

describe('Application entry', () => {
  let event: APIGatewayEvent;
  mocked(getEvents).mockResolvedValue(Array<FacillitySchedules>());

  beforeEach(() => {
    event = { httpMethod: 'get' } as APIGatewayEvent;
    mCreateMajorVersionNumber.mockReturnValue('1');
  });

  afterEach(() => {
    jest.resetAllMocks().restoreAllMocks();
  });

  describe('Handler', () => {
    it('Events processed succesfully gives 200', async () => {
      const mSendResponse: SendResponse = { SuccessCount: 1, FailCount: 0 };
      mocked(sendEvents).mockResolvedValue(mSendResponse);
      const response: { statusCode: number, body: string } = await handler(event);
      expect(response.statusCode).toEqual(200);
      expect(typeof response.body).toBe('string');
    });

    it('Events processed unsuccesfully gives 500', async () => {
      mocked(sendEvents).mockRejectedValue(new Error('Oh no!'));
      const response: { statusCode: number, body: string } = await handler(event);
      expect(response.statusCode).toEqual(500);
      expect(typeof response.body).toBe('string');
    });
  });
});
