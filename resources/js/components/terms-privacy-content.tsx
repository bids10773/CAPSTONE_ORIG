type PolicySection = {
    title: string;
    paragraphs?: string[];
    items?: string[];
};

const termsSections: PolicySection[] = [
    {
        title: 'Purpose and scope',
        paragraphs: [
            'The LMIC system is designed to support clinic operations such as appointment scheduling, patient registration, company referrals, bulk or onsite medical service requests, medical service tracking, release of authorized results, inquiries, and other clinic-related services.',
            'The system is intended to assist clinic operations and communication. It does not replace professional medical consultation, diagnosis, or emergency medical care.',
        ],
    },
    {
        title: 'User accounts and responsibilities',
        paragraphs: [
            'Users must provide accurate and complete information when registering or using the system.',
            'Patients are responsible for maintaining the confidentiality of their account credentials.',
            'Company accounts are created and authorized by LMIC administrators. The person authorized to use a company account must ensure that the account is used only for legitimate company-related transactions with the clinic.',
            'Users must not share passwords or allow unauthorized persons to access their accounts.',
        ],
    },
    {
        title: 'Acceptable use',
        paragraphs: [
            'Users agree to use the system only for legitimate clinic-related purposes.',
            'Users must not attempt to gain unauthorized access, interfere with system operation, manipulate records, submit false information, impersonate another person or organization, upload malicious files, or use the system for fraudulent or unlawful activities.',
            'LMIC may suspend or deactivate accounts that violate these Terms or pose a security risk.',
        ],
    },
    {
        title: 'Appointments and clinic services',
        paragraphs: [
            'Appointment requests are subject to clinic availability, confirmation, and applicable clinic policies.',
            'Submitting an appointment request does not necessarily guarantee immediate acceptance.',
            "Patients are responsible for providing correct appointment information and arriving within the clinic's required schedule.",
            'Walk-in services, company referrals, and bulk or onsite medical services may follow separate clinic procedures.',
        ],
    },
    {
        title: 'Company transactions',
        paragraphs: [
            'Company users may submit employee referrals, bulk or onsite medical service requests, inquiries, and other authorized company transactions.',
            'Submission of a request does not automatically mean that it has been approved. LMIC administrators may review, verify, accept, reschedule, or reject requests based on clinic availability and requirements.',
            'Company users are responsible for ensuring that employee information submitted to the clinic is accurate and lawfully provided.',
        ],
    },
    {
        title: 'Medical information and results',
        paragraphs: [
            'Medical information available through the system is confidential.',
            'Users may only access information they are authorized to view.',
            "Medical results may be released only after completion of the clinic's required procedures and verification process.",
            "Users must not attempt to access another patient's medical information.",
        ],
    },
    {
        title: 'Inquiries',
        paragraphs: [
            'The Send Inquiry feature is intended for questions, clarification, and communication with LMIC.',
            'Submitting an inquiry does not automatically create or modify an appointment, company account, medical record, bulk request, or medical result.',
            'For transactions that already have a dedicated system feature, users should use the appropriate module.',
        ],
    },
    {
        title: 'System accuracy and availability',
        paragraphs: [
            'LMIC makes reasonable efforts to maintain accurate system information. However, errors, delays, system interruptions, or incomplete information may occasionally occur.',
            'Users should contact the clinic if they notice incorrect account, appointment, or medical service information.',
            "LMIC may temporarily suspend access to the system for maintenance, updates, security reasons, technical problems, or circumstances beyond the clinic's control.",
            'Continuous or uninterrupted availability cannot be guaranteed.',
        ],
    },
    {
        title: 'Account security',
        paragraphs: [
            'Users are responsible for protecting their account credentials.',
            'Users should immediately inform LMIC if they suspect unauthorized access to their account.',
            'LMIC may implement security measures including password requirements, temporary passwords, login restrictions, role-based access controls, account verification, and activity monitoring.',
        ],
    },
    {
        title: 'Intellectual property',
        paragraphs: [
            'The system interface, content, documentation, branding, and other materials belonging to LMIC or the system developers may not be copied, reproduced, modified, or distributed without authorization, except where permitted by law or academic agreement.',
        ],
    },
    {
        title: 'Changes to these Terms',
        paragraphs: [
            'LMIC may update these Terms and Conditions when system functions, clinic procedures, or applicable requirements change.',
            'Continued use of the system after an updated version becomes effective indicates acceptance of the revised Terms.',
        ],
    },
];

const privacySections: PolicySection[] = [
    {
        title: 'Information we collect',
        paragraphs: [
            "Depending on the user's role and the services being used, the system may collect:",
        ],
        items: [
            'Name and basic personal information',
            'Date of birth, age, sex, and contact information',
            'Email address and account information',
            'Appointment information',
            'Company and employment-related information',
            'Company representative information',
            'Medical service requirements',
            'Medical examination and laboratory-related records',
            'X-ray and diagnostic information',
            'Medical clearance information',
            'Uploaded documents and files',
            'Inquiry messages',
            'System activity and transaction records',
            'Other information necessary to provide clinic services',
        ],
    },
    {
        title: 'Data minimization and sensitive information',
        paragraphs: [
            'Only information relevant to legitimate clinic and system purposes should be collected.',
            'Because LMIC provides medical services, some information processed through the system may be considered sensitive personal information.',
            'Medical information is handled with additional care and should only be accessed by authorized personnel according to their assigned responsibilities.',
        ],
    },
    {
        title: 'How information is used',
        paragraphs: ['Information may be used to:'],
        items: [
            'Create and manage user accounts',
            'Schedule and manage appointments',
            'Process walk-in patients',
            'Track completion of medical services',
            'Manage company referrals',
            'Process bulk or onsite medical service requests',
            'Record and manage examination or diagnostic information',
            'Generate authorized medical clearances and reports',
            'Communicate with patients and company users',
            'Respond to inquiries',
            'Send account, appointment, and service notifications',
            'Maintain system security',
            'Generate operational and statistical reports',
            'Improve clinic processes and system performance',
            'Meet applicable legal, regulatory, academic, and administrative requirements',
        ],
    },
    {
        title: 'Access and disclosure',
        paragraphs: [
            'Access to information is restricted according to user role and responsibility.',
            'For example, patients should only access their own authorized records, company users should only access information related to authorized company transactions, and clinic personnel should only access information necessary to perform their assigned duties.',
            'Administrators may access information necessary for authorized system and clinic administration.',
            'LMIC does not disclose personal or medical information to unauthorized parties.',
            'Information may be shared with authorized clinic personnel, diagnostic personnel, partner service providers, company representatives when properly authorized, or government and regulatory authorities when required by applicable law or legitimate public-health requirements.',
            'Only the information necessary for the intended purpose should be disclosed.',
        ],
    },
    {
        title: 'Company-submitted information',
        paragraphs: [
            'Companies submitting employee information through referrals or bulk medical service requests are responsible for ensuring that they have the appropriate authority or lawful basis to provide such information to LMIC.',
            'LMIC will use submitted employee information only for legitimate clinic and medical service purposes.',
        ],
    },
    {
        title: 'Security',
        paragraphs: [
            'LMIC and the system administrators may use reasonable technical and organizational safeguards such as authentication, access controls, secure passwords, role-based permissions, database protections, activity monitoring, backups, and restricted access to sensitive information.',
            'However, no electronic system can guarantee absolute security.',
            'Users must also protect their credentials and avoid sharing passwords.',
        ],
    },
    {
        title: 'Data retention',
        paragraphs: [
            'Personal and medical information will be retained only for as long as necessary for legitimate clinic, medical, administrative, legal, academic, or regulatory purposes.',
            "Actual retention periods should follow LMIC's approved records-management policy and applicable requirements.",
        ],
    },
    {
        title: 'Your privacy rights',
        paragraphs: [
            'Subject to applicable Philippine data-protection requirements, users may have rights concerning their personal information, including requesting access to information, requesting correction of inaccurate information, raising concerns about processing, and requesting appropriate action regarding their personal data.',
            'Certain medical, administrative, or legally required records may need to be retained even when a user requests deletion.',
        ],
    },
    {
        title: 'Cookies and system communications',
        paragraphs: [
            'The system may use cookies or similar technologies necessary for login sessions, account authentication, security, user preferences, and proper system operation.',
            'These technologies should not be used to disclose confidential medical information to unauthorized parties.',
            'The system may send emails for purposes such as account verification, temporary credentials, password-related notifications, appointment updates, inquiry responses, and other legitimate clinic communications.',
            'Users are responsible for ensuring that the email address associated with their account is accurate.',
        ],
    },
    {
        title: 'Analytics and planning',
        paragraphs: [
            'The system may use de-identified or aggregated information for operational analysis, patient-volume analysis, trend analysis, forecasting, research, and clinic resource planning.',
            'Where possible, information used for statistical or forecasting purposes should avoid directly identifying individual patients unless identification is legitimately required.',
        ],
    },
    {
        title: 'Medical results',
        paragraphs: [
            'Medical results must not be made publicly available.',
            'Results should only be accessible to authorized users after applicable clinic procedures, verification, and final evaluation requirements have been completed.',
        ],
    },
    {
        title: 'Changes to this Privacy Policy',
        paragraphs: [
            'This Privacy Policy may be updated when the system, clinic procedures, or applicable privacy requirements change.',
            'Significant updates should be communicated through the system where appropriate.',
        ],
    },
];

function PolicySections({ sections }: { sections: PolicySection[] }) {
    return sections.map((section, index) => (
        <section key={section.title} className="space-y-2">
            <h4 className="font-semibold text-slate-900">
                {index + 1}. {section.title}
            </h4>
            {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && (
                <ul className="list-disc space-y-1 pl-5 marker:text-moss-500">
                    {section.items.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            )}
        </section>
    ));
}

function ContactDetails() {
    return (
        <address className="rounded-xl border border-moss-100 bg-moss-50 p-4 not-italic">
            <p className="font-semibold text-slate-900">
                Living Myth Industrial Clinic
            </p>
            <p>Brgy. Banlic, Canlubang, Calamba City, Laguna</p>
            <p>Email: {' livingmythindustrialclinic@gmail.com'}</p>
            <p>Contact Number: +63 922 889 6850</p>
        </address>
    );
}

export default function TermsPrivacyContent() {
    return (
        <div className="space-y-10">
            <article className="space-y-5" aria-labelledby="terms-heading">
                <header>
                    <h3
                        id="terms-heading"
                        className="text-lg font-semibold text-slate-950"
                    >
                        Terms and Conditions
                    </h3>
                    <p className="mt-1 text-xs font-medium text-moss-700">
                        Last Updated: September 2026
                    </p>
                </header>
                <p>
                    Welcome to the Living Myth Industrial Clinic (LMIC)
                    Web-Based Medical Services Management System. By creating an
                    account, accessing, or using this system, you agree to
                    comply with these Terms and Conditions.
                </p>
                <PolicySections sections={termsSections} />
                <section className="space-y-2">
                    <h4 className="font-semibold text-slate-900">
                        12. Contact us
                    </h4>
                    <p>
                        For questions regarding these Terms and Conditions,
                        users may contact:
                    </p>
                    <ContactDetails />
                </section>
            </article>

            <div className="border-t border-slate-200" />

            <article className="space-y-5" aria-labelledby="privacy-heading">
                <header>
                    <h3
                        id="privacy-heading"
                        className="text-lg font-semibold text-slate-950"
                    >
                        Privacy Policy
                    </h3>
                    <p className="mt-1 text-xs font-medium text-moss-700">
                        Last Updated: September 2026
                    </p>
                </header>
                <p>
                    Living Myth Industrial Clinic respects the privacy of
                    patients, company representatives, employees, clinic
                    personnel, and other users of its Web-Based Medical Services
                    Management System.
                </p>
                <p>
                    This Privacy Policy explains how information may be
                    collected, used, stored, and protected when users access the
                    system.
                </p>
                <PolicySections sections={privacySections} />
                <section className="space-y-2">
                    <h4 className="font-semibold text-slate-900">
                        13. Contact us
                    </h4>
                    <p>
                        Users who have questions or concerns regarding privacy
                        or their personal information may contact:
                    </p>
                    <ContactDetails />
                </section>
            </article>
        </div>
    );
}
