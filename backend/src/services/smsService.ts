export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSms(to: string, message: string): Promise<SmsSendResult> {
  const phoneRegex = /^\+[1-9]\d{9,14}$/;

  if (!to || !message) {
    return { success: false, error: 'Recipient phone number and message are required.' };
  }

  if (!phoneRegex.test(to)) {
    return { success: false, error: 'Invalid phone number format. Please provide a valid international phone number (e.g., +233244000000).' };
  }

  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'SecureOpps';

  if (!apiKey) {
    return { success: false, error: 'SMS service configuration is missing on the server.' };
  }

  // Build URL encoded request params
  const params = new URLSearchParams({
    action: 'send-sms',
    api_key: apiKey,
    to: to,
    from: senderId,
    sms: message
  });

  try {
    const apiResponse = await fetch('https://sms.gonlinesites.com/app/sms/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!apiResponse.ok) {
      throw new Error(`SMS Gateway HTTP error: ${apiResponse.status}`);
    }

    const textResponse = await apiResponse.text();
    let apiData: any;
    try {
      apiData = JSON.parse(textResponse);
    } catch {
      throw new Error(`Failed to parse gateway response: ${textResponse.substring(0, 100)}`);
    }

    if (apiData.code === 'OK') {
      return {
        success: true,
        messageId: apiData.message_id
      };
    } else {
      const errorCode = String(apiData.code);
      let userMessage = 'Failed to send SMS due to a gateway error.';

      switch (errorCode) {
        case '100':
          userMessage = 'Bad gateway request. Please verify the API configuration.';
          break;
        case '101':
          userMessage = 'Invalid gateway action configured.';
          break;
        case '102':
          userMessage = 'SMS gateway authentication failed. Please contact the administrator.';
          break;
        case '103':
          userMessage = 'The recipient phone number is invalid. Use international format (e.g. +233XXXXXXXXX).';
          break;
        case '104':
          userMessage = 'SMS coverage is not active or available for the destination network.';
          break;
        case '105':
          userMessage = 'SMS gateway balance is insufficient to send this message.';
          break;
        case '106':
          userMessage = 'The Sender ID is invalid or not registered/approved.';
          break;
        case '109':
          userMessage = 'The schedule time for the SMS is invalid.';
          break;
        case '111':
          userMessage = 'The message was flagged as spam by the SMS gateway filter.';
          break;
        default:
          if (apiData.message) {
            userMessage = apiData.message;
          }
          break;
      }

      return {
        success: false,
        error: userMessage
      };
    }
  } catch (err: any) {
    console.error('[SmsService] Send failed:', err.message);
    return {
      success: false,
      error: err.message || 'Internal server error processing the SMS delivery request.'
    };
  }
}
