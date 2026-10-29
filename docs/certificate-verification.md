# Public medical certificate verification

Laboratory, X-ray, pre-employment/annual examination, and company bulk reports also support QR verification through a separate report route. See [report verification](report-verification.md) for release prerequisites and deployment details.

Issued print/PDF certificates include a locally generated QR image and clickable verification link on `https://lmichealth.company/verify/certificate/{token}`. The random 64-character token is unique, hidden from model serialization, and remains stable after issuance and voiding. Drafts and approved-but-unissued certificates have no public verification link.

The public page requires no login. It shows only the clinic, certificate number, masked patient name, physician name, issue date, and current Issued/Voided status. It does not disclose diagnoses, recommendations, patient reference numbers, license numbers, signatures, or internal IDs. Unknown and unissued tokens return 404. Requests are limited to 30/minute/IP, and verification responses use no-store, noindex, and no-referrer policies.

The migration adds tokens to existing issued/void certificates without changing their certificate numbers, clinical content, timestamps, or generating workflow notifications. Previously downloaded PDFs must be downloaded again to include a QR code.

## Deployment

Deploy the changed application and migration to the Laravel application serving the domain, then run:

```sh
php artisan migrate --force
php artisan config:cache
```

Set production environment values:

```dotenv
APP_URL=https://lmichealth.company
MEDICAL_CERTIFICATE_VERIFICATION_URL=https://lmichealth.company
```

The domain must serve this application over HTTPS. If production APP_URL uses a different canonical hostname, include `lmichealth.company` in `TRUSTED_HOSTS`. The installed Bacon QR library generates PNGs locally using PHP GD; no external QR service receives the verification URL. Existing Excel dependencies already require GD.

Migration has been applied to the local development database. Public-domain deployment is separate: local records/tokens only verify publicly when the same records and tokens exist in the deployed database. Generate/distribute final PDFs from the deployed system rather than expecting a QR generated against an independent local database to verify remotely.

QR lookup confirms that a matching clinic record exists and shows whether it has been voided. It is not a certificate-based digital PDF signature and cannot by itself prove every printed statement is unchanged. Recipients should compare the visible details and contact the clinic for discrepancies.
