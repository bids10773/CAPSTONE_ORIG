import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function Breadcrumbs({
    breadcrumbs,
}: {
    breadcrumbs: BreadcrumbItemType[];
}) {
    const visibleBreadcrumbs = breadcrumbs.filter(
        (item) => !/dashboard$/i.test(item.title.trim()),
    );

    return (
        <>
            {visibleBreadcrumbs.length > 0 && (
                <Breadcrumb className="min-w-0">
                    <BreadcrumbList className="flex-nowrap overflow-hidden text-sm font-medium whitespace-nowrap">
                        {visibleBreadcrumbs.map((item, index) => {
                            const isLast =
                                index === visibleBreadcrumbs.length - 1;
                            return (
                                <Fragment key={index}>
                                    <BreadcrumbItem
                                        className={
                                            isLast ? 'min-w-0' : 'shrink-0'
                                        }
                                    >
                                        {isLast ? (
                                            <BreadcrumbPage
                                                className="truncate font-semibold"
                                                title={item.title}
                                            >
                                                {item.title}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link
                                                    href={item.href}
                                                    className="rounded-md focus-visible:ring-2 focus-visible:ring-moss-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
                                                >
                                                    {item.title}
                                                </Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && (
                                        <BreadcrumbSeparator className="shrink-0" />
                                    )}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
        </>
    );
}
