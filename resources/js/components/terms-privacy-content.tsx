import privacyPolicy from '../../content/privacy-policy.json';
import terms from '../../content/terms.json';

type PolicySection = {
    title: string;
    paragraphs?: string[];
    items?: string[];
};

const termsSections: PolicySection[] = terms.sections;

const privacySections: PolicySection[] = privacyPolicy.sections;

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
                {privacyPolicy.contact.name}
            </p>
            <p>{privacyPolicy.contact.address}</p>
            <p>Email: {privacyPolicy.contact.email}</p>
            <p>Contact Number: {privacyPolicy.contact.phone}</p>
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
                        Last Updated: {terms.updated}
                    </p>
                </header>
                <p>{terms.introduction}</p>
                <PolicySections sections={termsSections} />
                <section className="space-y-2">
                    <h4 className="font-semibold text-slate-900">
                        {termsSections.length + 1}. Contact us
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
                        Last Updated: {privacyPolicy.updated}
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
                        {privacySections.length + 1}. Contact us
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
