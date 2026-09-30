import AppLogoIcon from '@/components/app-logo-icon';
import { ClinicStatusLogo } from '@/components/clinic-status-logo';

export default function AppLogo() {
    return (
        <>
            <ClinicStatusLogo
                className="aspect-square size-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
                labelClassName="text-[6px]"
            >
                <AppLogoIcon className="size-5 fill-current text-white" />
            </ClinicStatusLogo>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Living Myth Industrial Clinic
                </span>
            </div>
        </>
    );
}
