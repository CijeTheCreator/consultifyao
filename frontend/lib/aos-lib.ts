import { connect, message, result, createDataItemSigner } from '@permaweb/aoconnect';

const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'DEVELOPMENT';
console.log("Environment is: ", process.env.NEXT_PUBLIC_ENVIRONMENT)

const { message: devMessage, result: devResult } = isDevelopment
  ? connect({
    MU_URL: `http://localhost:4002`,
    SU_URL: "http://localhost:4003",
    CU_URL: `http://localhost:4004`,
    GATEWAY_URL: `http://localhost:4000`
  })
  : { message: null, result: null };

const messageFunc = isDevelopment ? devMessage : message;
const resultFunc = isDevelopment ? devResult : result;

interface AOSTag {
  name: string;
  value: string;
}

interface AOSMessageOptions {
  process: string;
  tags: AOSTag[];
  data?: any;
  signer?: any;
  timeoutMs?: number;
}

export async function sendAOSMessage({
  process,
  data,
  tags,
  signer,
  timeoutMs = 60000, // 1 minute default timeout
}: AOSMessageOptions): Promise<string | false> {
  try {
    // Use provided signer or create one from arweave wallet
    const messageSigner = signer || createDataItemSigner((window as any).arweaveWallet);

    // Send the message
    const messageId = await messageFunc({
      process,
      data,
      tags,
      signer: messageSigner,
    });

    // Poll for result with timeout
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const messageResult = await resultFunc({
          message: messageId,
          process,
        });

        // Check if we have messages and get the last one's data
        if (messageResult.Messages && messageResult.Messages.length > 0) {
          const lastMessage = messageResult.Messages[messageResult.Messages.length - 1];
          return lastMessage.Data || '';
        }
      } catch (error) {
        // Result might not be ready yet, continue polling
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Timeout reached
    return false;
  } catch (error) {
    console.error('AOS message error:', error);
    return false;
  }
}
