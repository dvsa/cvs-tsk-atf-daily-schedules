import { APIGatewayEvent } from 'aws-lambda';
import { mocked } from 'ts-jest/utils';
import { handler } from '../../src/handler';
import * as Utils from '../../src/utils';
import { sendEvents } from '../../src/eventbridge/send';

jest.mock('../../src/eventbridge/send');

describe('Application entry', () => {
  let event: APIGatewayEvent;

  beforeEach(() => {
    event = { httpMethod: 'get' } as APIGatewayEvent;
    jest.spyOn(Utils, 'createMajorVersionNumber').mockReturnValue('1');
  });

  afterEach(() => {
    jest.resetAllMocks().restoreAllMocks();
  });

  describe('Handler', () => {
    it('Events processed succesfully gives 200', async () => {
      mocked(sendEvents).mockResolvedValue(1);
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
