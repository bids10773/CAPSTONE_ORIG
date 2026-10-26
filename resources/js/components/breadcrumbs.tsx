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
                <Breadcrumb>
                    <BreadcrumbList className="font-bold">
                        {visibleBreadcrumbs.map((item, index) => {
                            const isLast =
                                index === visibleBreadcrumbs.length - 1;
                            return (
                                <Fragment key={index}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>
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
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
        </>
    );
}
