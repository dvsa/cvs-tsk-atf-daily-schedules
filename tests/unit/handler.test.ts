import { handler } from '../../src/handler';
import * as Utils from '../../src/utils';

describe('Application entry', () => {
  let event: { requestContext: { accountId: string } };

  beforeEach(() => {
    event = {} as { requestContext: { accountId: string } };
    jest.spyOn(Utils, 'createMajorVersionNumber').mockReturnValue('1');
  });

  afterEach(() => {
    jest.resetAllMocks().restoreAllMocks();
  });

  describe('Handler', () => {
    it('should call the express wrapper', async () => {
      event = { requestContext: { accountId: 'accountId' } };

      const response: { statusCode: number, body: string } = await handler(event);
      expect(response.statusCode).toEqual(200);
      expect(typeof response.body).toBe('string');
    });
  });
});
