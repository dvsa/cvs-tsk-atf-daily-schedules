import 'source-map-support/register';
// import serverless from 'serverless-http';
// import { Context, APIGatewayEvent } from 'aws-lambda';
import { sendEvents } from './eventbridge/send';

const {
  NODE_ENV, SERVICE, AWS_PROVIDER_REGION, AWS_PROVIDER_STAGE,
} = process.env;

console.log(
  `\nRunning Service:\n '${SERVICE}'\n mode: ${NODE_ENV}\n stage: '${AWS_PROVIDER_STAGE}'\n region: '${AWS_PROVIDER_REGION}'\n\n`,
);

const handler = async (event: {
  requestContext: { accountId: string };
}): Promise<{ statusCode: number; body: string }> => {
  console.log('event');
  console.log(JSON.stringify(event, null, 2));

  await sendEvents(event);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function execccuted successfully!',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        input: event,
      },
      null,
      2,
    ),
  };
};

export { handler };
