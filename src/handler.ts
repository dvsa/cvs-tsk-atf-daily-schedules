import 'source-map-support/register';
import { APIGatewayEvent } from 'aws-lambda';
import { sendEvents } from './eventbridge/send';

const {
  NODE_ENV, SERVICE, AWS_PROVIDER_REGION, AWS_PROVIDER_STAGE,
} = process.env;

console.log(
  `\nRunning Service:\n '${SERVICE}'\n mode: ${NODE_ENV}\n stage: '${AWS_PROVIDER_STAGE}'\n region: '${AWS_PROVIDER_REGION}'\n\n`,
);

const handler = async (event: APIGatewayEvent): Promise<{ statusCode: number; body: string }> => {
  console.log(`Function triggered by event: ${event.httpMethod}`);

  const tempData = { one: 1, two: 2 };
  await sendEvents(tempData);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Data processed successfully.',
        input: tempData,
      },
      null,
      2,
    ),
  };
};

export { handler };
