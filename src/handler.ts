import 'source-map-support/register';
import { APIGatewayEvent } from 'aws-lambda';
import { sendEvents } from './eventbridge/send';
import { getEvents } from './wms/ExportEvents';

const {
  NODE_ENV, SERVICE, AWS_PROVIDER_REGION, AWS_PROVIDER_STAGE,
} = process.env;

console.log(
  `\nRunning Service:\n '${SERVICE}'\n mode: ${NODE_ENV}\n stage: '${AWS_PROVIDER_STAGE}'\n region: '${AWS_PROVIDER_REGION}'\n\n`,
);

const handler = async (event: APIGatewayEvent): Promise<{ statusCode: number; body: string }> => {
  console.log(`Function triggered by event: ${event.httpMethod}`);

  try {
    await sendEvents(await getEvents());

    console.log('Data processed successfully.');
    return { statusCode: 200, body: 'Data processed successfully.' };
  } catch (error) {
    console.error(error);

    return { statusCode: 500, body: 'Data processed unsuccessfully.' };
  }
};

export { handler };
