// ─── Message Templates ─────────────────────────────────────────────────────────
// Professional phishing-simulation email and SMS templates.
// All templates contain a {{SIMULATION_LINK}} placeholder that is replaced
// at send-time with the actual campaign simulation URL.
// Email templates also support {{PLATFORM}} and {{RECIPIENT_NAME}} placeholders.

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  /** Full email body. Line breaks represented with \n. */
  body: string;
  /** Short description shown in the picker */
  description: string;
  category: 'Account Security' | 'Policy & Compliance' | 'IT Notice' | 'Data Protection';
}

export interface SmsTemplate {
  id: string;
  name: string;
  /** Plain-text SMS body — keep under 160 characters (single SMS segment) */
  body: string;
  description: string;
  category: 'Account Security' | 'Policy & Compliance' | 'IT Notice' | 'Data Protection';
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'et-001',
    name: 'Account Temporarily Suspended',
    subject: 'Action Required: Your {{PLATFORM}} Account Has Been Temporarily Suspended',
    description: 'Informs the recipient their account is suspended due to suspicious activity.',
    category: 'Account Security',
    body: `Dear User,

We are writing to inform you that your {{PLATFORM}} account has been temporarily suspended due to a series of suspicious login attempts detected on your profile.

To protect the security of your account and personal information, access has been restricted until your identity is verified.

What happened?
Our security systems flagged multiple failed login attempts from an unrecognised device and location. As a precautionary measure, your account has been locked to prevent unauthorised access.

What you need to do:
Please verify your identity immediately to restore full access to your account. Failure to complete verification within 48 hours may result in permanent account closure.

Verify Your Account Now: {{SIMULATION_LINK}}

If you believe this action was taken in error, or if you did not initiate these login attempts, it is even more urgent that you complete the verification process immediately.

For assistance, please contact our support team or visit our Help Centre.

Regards,
{{PLATFORM}} Security Team
This is an automated security notification. Please do not reply directly to this email.`,
  },
  {
    id: 'et-002',
    name: 'Unusual Sign-In Activity Detected',
    subject: 'Security Alert: Unusual Sign-In Activity on Your Account',
    description: 'Alerts the recipient of a login from an unrecognised device or location.',
    category: 'Account Security',
    body: `Dear Account Holder,

We detected a sign-in to your {{PLATFORM}} account from a device and location we do not recognise.

Sign-In Details:
- Date & Time: Today
- Location: Unknown Location (unverified)
- Device: Unknown Browser
- IP Address: masked for security

If this was you, no action is required.

If this was NOT you, your account may be compromised. We strongly urge you to secure your account immediately by clicking the link below.

Secure My Account: {{SIMULATION_LINK}}

Upon clicking, you will be guided through our account-recovery process, which includes resetting your password and reviewing active sessions.

Please act quickly — unverified access will be blocked within 24 hours if no action is taken.

Stay Safe,
{{PLATFORM}} Account Protection Team
This message was sent to protect your account. Do not share this link with anyone.`,
  },
  {
    id: 'et-003',
    name: 'Password Expiry Notification',
    subject: 'Important: Your {{PLATFORM}} Password Will Expire in 24 Hours',
    description: 'Warns the recipient that their password is about to expire.',
    category: 'Policy & Compliance',
    body: `Dear {{PLATFORM}} User,

As part of our ongoing commitment to account security, all user passwords are required to be updated every 90 days in line with our Security Policy.

Our records indicate that your current password is due to expire within the next 24 hours.

What happens if I don't update my password?
Once your password expires, you will be locked out of your account and will need to go through a full account recovery process, which may take up to 5 business days.

Update your password now to avoid disruption:

Update Password: {{SIMULATION_LINK}}

Password Requirements:
- Minimum 10 characters
- At least one uppercase letter
- At least one number
- At least one special character (e.g., !, @, #)
- Must not match your last 5 passwords

If you have recently updated your password and continue to receive this notice, please contact your IT Support team immediately.

Thank you for helping us keep our systems secure.

Kind Regards,
IT Security & Compliance Team`,
  },
  {
    id: 'et-004',
    name: 'Email Account Storage Limit Reached',
    subject: 'Urgent: Your Email Storage Is Full — Action Required',
    description: 'Informs the recipient their mailbox is full and prompts account verification.',
    category: 'IT Notice',
    body: `Dear User,

Your email account has reached 100% of its allocated storage capacity (5 GB / 5 GB used). As a result:

- You are no longer receiving new emails.
- Sent messages may be bouncing back to senders.
- Shared calendar and file syncing has been paused.

To restore full email functionality, you must verify your account and request a storage extension immediately.

Verify Account and Extend Storage: {{SIMULATION_LINK}}

Once verified, your mailbox storage will be automatically upgraded to 15 GB at no additional cost as part of our infrastructure upgrade programme.

Please complete this step within the next 6 hours to avoid further disruption to your communications.

IT Support Team
Internal use only — do not forward this message.`,
  },
  {
    id: 'et-005',
    name: 'Mandatory Two-Factor Authentication Setup',
    subject: '{{PLATFORM}}: Mandatory Two-Factor Authentication — Setup Required by End of Week',
    description: 'Prompts the user to set up 2FA as part of a security policy mandate.',
    category: 'Policy & Compliance',
    body: `Dear Team Member,

Following a recent organisation-wide security audit, management has mandated that all staff must enable Two-Factor Authentication (2FA) on their {{PLATFORM}} accounts by the close of business this Friday.

Why is this required?
Two-factor authentication adds a critical layer of protection to your account. With 2FA enabled, even if your password is compromised, an attacker cannot access your account without a second form of verification.

Accounts without 2FA enabled after the deadline will be temporarily disabled until compliance is achieved.

Set Up Two-Factor Authentication: {{SIMULATION_LINK}}

The setup takes less than 3 minutes. You will be guided step by step through the process.

Supported 2FA methods:
- Authenticator App (Google Authenticator, Microsoft Authenticator)
- SMS One-Time Password (OTP)
- Hardware Security Key (YubiKey)

If you require assistance, please reach out to the IT Help Desk.

Thank you for your cooperation in keeping our organisation secure.

Warm regards,
IT Security & Compliance Department`,
  },
  {
    id: 'et-006',
    name: 'Data Breach Notification',
    subject: 'Security Notice: Your Data May Have Been Exposed — Immediate Action Required',
    description: 'Notifies the recipient of a potential data breach affecting their account.',
    category: 'Data Protection',
    body: `Dear Valued User,

We are writing to inform you of a security incident that may have affected your {{PLATFORM}} account.

What happened?
Our security team identified unauthorised access to a portion of our user database. An investigation is currently underway. As a precautionary measure, we are notifying all affected users.

What information may be involved?
- Email address
- Encrypted password hash
- Account display name
- Last login date and IP address

What we are doing:
- We have secured the vulnerability that allowed the breach.
- We have engaged an independent cybersecurity firm to conduct a full forensic audit.
- We have notified the relevant data protection authority.

What you should do immediately:
1. Change your password on this platform.
2. Change your password on any other platform where you use the same credentials.
3. Enable Two-Factor Authentication.

Secure Your Account Now: {{SIMULATION_LINK}}

We sincerely apologise for this incident and are committed to safeguarding your data.

Respectfully,
{{PLATFORM}} Data Protection Officer`,
  },
  {
    id: 'et-007',
    name: 'Mandatory Security Training Overdue',
    subject: 'Overdue: Complete Your Cybersecurity Awareness Training',
    description: 'Reminds staff of overdue security awareness training with urgency.',
    category: 'Policy & Compliance',
    body: `Dear {{RECIPIENT_NAME}},

Our records indicate that you have not yet completed your mandatory Cybersecurity Awareness Training, which was due last week.

This training is a compliance requirement under our Information Security Policy and is linked to your continued system access privileges.

Current Status: OVERDUE

Failure to complete the training within the next 48 hours will result in:
- Temporary suspension of access to company systems and email.
- A formal note on your HR compliance record.
- Escalation to your line manager.

This training typically takes 20-30 minutes to complete and covers:
- Identifying phishing emails and suspicious links
- Password best practices
- Safe use of company devices
- Reporting security incidents

Start Your Training Now: {{SIMULATION_LINK}}

If you believe you have already completed this training and are receiving this notice in error, click the link above to confirm your completion status.

Kind Regards,
Human Resources & IT Compliance Team`,
  },
  {
    id: 'et-008',
    name: 'Account Verification Required',
    subject: 'Verify Your {{PLATFORM}} Account to Continue Using Our Services',
    description: 'Requests account re-verification following a policy update.',
    category: 'Account Security',
    body: `Dear User,

As part of a scheduled platform-wide security upgrade, we are required to re-verify all active user accounts to ensure they meet our updated identity standards.

Why is this necessary?
Following new data protection regulations that came into effect this month, all service providers are required to confirm the identity of active account holders. This is a one-time process.

Your account has been flagged for verification. Until this is completed, some features will be limited:
- You will not be able to make purchases or transactions.
- File uploads and sharing will be restricted.
- Third-party app integrations will be paused.

This verification takes less than 2 minutes.

Verify My Identity: {{SIMULATION_LINK}}

You will be asked to confirm your registered email address and answer a short security question. No sensitive financial data is required.

If you do not complete verification within 72 hours, your account will be downgraded to a restricted tier.

Thank you for your prompt attention.

Sincerely,
{{PLATFORM}} Compliance & Identity Team`,
  },
  {
    id: 'et-009',
    name: 'Suspicious Account Transaction Alert',
    subject: 'Alert: Suspicious Transaction Detected on Your {{PLATFORM}} Account',
    description: 'Alerts the recipient of a suspicious transaction requiring review.',
    category: 'Account Security',
    body: `Dear Account Holder,

Our fraud detection system has flagged a suspicious transaction or activity on your {{PLATFORM}} account that may not have been authorised by you.

Transaction Details:
- Type: Account Settings Change / Withdrawal Attempt
- Status: Pending Review — HOLD PLACED
- Date & Time: Today

If you initiated this transaction, no further action is needed and the hold will be lifted within 2 business hours once our review is complete.

If you did NOT authorise this transaction, you must act immediately to prevent further unauthorised activity.

Review and Dispute Transaction: {{SIMULATION_LINK}}

Upon clicking, you will be directed to our secure dispute resolution portal where you can confirm or reject the flagged activity and secure your account.

Do not ignore this email. If unverified, the hold on your account may become permanent pending a full investigation.

Yours sincerely,
{{PLATFORM}} Fraud & Risk Management Team
This is an automated alert generated by our security systems.`,
  },
  {
    id: 'et-010',
    name: 'Annual System Access Review',
    subject: 'Action Required: Annual System Access Review — Reconfirm Your Permissions',
    description: 'Annual access review requiring staff to reconfirm their system permissions.',
    category: 'IT Notice',
    body: `Dear {{RECIPIENT_NAME}},

As part of our annual IT Access Governance Review, all staff members are required to reconfirm their current system access permissions to ensure continued access to company platforms and resources.

Accounts that are not reconfirmed within 5 business days will have access automatically revoked as a security precaution, in accordance with our IT Access Policy.

Reconfirm My Access: {{SIMULATION_LINK}}

The process takes approximately 3 minutes. You will be asked to confirm which systems and datasets you actively use in your current role.

Your manager has been notified to expect a summary report of their team's access status by the end of the week.

Should you have any questions or believe your role requires different access levels, please speak with your line manager or contact the IT Help Desk.

Thank you for your compliance.

Best regards,
IT Governance & Access Management`,
  },
];

// ─── SMS Templates ─────────────────────────────────────────────────────────────
// Keep body under 160 characters to fit a single SMS segment.
// {{LINK}} will be replaced with the simulation URL at send time.

export const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'st-001',
    name: 'Account Suspended Alert',
    description: 'Alerts recipient of a temporary account suspension.',
    category: 'Account Security',
    body: 'ALERT: Your account has been suspended due to suspicious activity. Verify your identity now: {{LINK}}',
  },
  {
    id: 'st-002',
    name: 'Unusual Login Detected',
    description: 'Notifies recipient of an unrecognised login attempt.',
    category: 'Account Security',
    body: 'Security Notice: Sign-in from unknown device detected. If this was not you, secure your account now: {{LINK}}',
  },
  {
    id: 'st-003',
    name: 'Password Expiry Warning',
    description: 'Warns recipient their password is about to expire.',
    category: 'Policy & Compliance',
    body: 'Reminder: Your account password expires in 24hrs. Update now to avoid lockout: {{LINK}}',
  },
  {
    id: 'st-004',
    name: 'Mandatory 2FA Setup',
    description: 'Prompts recipient to enable two-factor authentication.',
    category: 'Policy & Compliance',
    body: 'Action Required: Enable 2FA on your account before Friday to maintain access. Set up here: {{LINK}}',
  },
  {
    id: 'st-005',
    name: 'Account Verification Required',
    description: 'Requests identity re-verification for continued service access.',
    category: 'Account Security',
    body: 'Your account requires re-verification to continue. Complete the 2-min process to avoid interruption: {{LINK}}',
  },
  {
    id: 'st-006',
    name: 'Data Breach Alert',
    description: 'Alerts recipient that their data may have been exposed.',
    category: 'Data Protection',
    body: 'Security Alert: Your account data may have been exposed in a breach. Secure your account now: {{LINK}}',
  },
  {
    id: 'st-007',
    name: 'Training Overdue',
    description: 'Reminds staff of overdue cybersecurity awareness training.',
    category: 'Policy & Compliance',
    body: 'OVERDUE: Your Cybersecurity Awareness Training must be completed today to retain system access: {{LINK}}',
  },
  {
    id: 'st-008',
    name: 'Suspicious Transaction Alert',
    description: 'Alerts recipient of a suspicious account transaction.',
    category: 'Account Security',
    body: 'Fraud Alert: A suspicious transaction on your account is on hold. Review it immediately: {{LINK}}',
  },
  {
    id: 'st-009',
    name: 'System Access Review',
    description: 'Prompts staff to reconfirm their IT system access permissions.',
    category: 'IT Notice',
    body: 'Annual Access Review: Reconfirm your system permissions within 5 days to avoid automatic revocation: {{LINK}}',
  },
  {
    id: 'st-010',
    name: 'Email Mailbox Full',
    description: 'Informs recipient their email mailbox has reached full capacity.',
    category: 'IT Notice',
    body: 'Your mailbox is full (100%). You are no longer receiving emails. Verify now to extend storage: {{LINK}}',
  },
];
