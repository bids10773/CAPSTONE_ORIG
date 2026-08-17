import { Link } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useLogoutModal } from '@/contexts/logout-modal-context';
import type { User } from '@/types';

type Props = {
    user: User;
    showProfileSettings?: boolean;
};

export function UserMenuContent({ user, showProfileSettings = false }: Props) {
    const { openModal } = useLogoutModal();

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {showProfileSettings && (
                    <DropdownMenuItem asChild>
                        <Link
                            href="/settings/profile"
                            className="cursor-pointer"
                        >
                            <Settings className="mr-2" />
                            Profile Settings
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuGroup>
            {showProfileSettings && <DropdownMenuSeparator />}
            <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => openModal()}
                data-test="logout-button"
            >
                <LogOut className="mr-2" />
                Log out
            </DropdownMenuItem>
        </>
    );
}
