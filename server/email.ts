import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken,
      },
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

export async function sendVerificationEmail(to: string, token: string, firstName: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const verifyUrl = `${getBaseUrl()}/api/auth/verify?token=${token}`;

    await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Verify your Verdara account',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: #10b981; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
              <span style="font-size: 24px; color: white; font-weight: bold;">V</span>
            </div>
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Welcome to Verdara</h1>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Thanks for creating your Verdara account. Please verify your email address to get started exploring the outdoors.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">This link will expire in 24 hours. If you didn't create a Verdara account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">DarkWave Studios - Verdara Outdoor Recreation Platform</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

function getBaseUrl(): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  if (process.env.REPLIT_DEPLOYMENT_URL) {
    return process.env.REPLIT_DEPLOYMENT_URL;
  }
  return `http://localhost:${process.env.PORT || 5000}`;
}
