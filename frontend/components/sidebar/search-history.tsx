import * as React from 'react';

import Link from 'next/link';

import { cn } from '@/lib/utils';
import { SidebarList } from './sidebar-list';
import { buttonVariants } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Icons } from '../shared/icons';
import { siteConfig } from '@/config/site';
import { SidebarClose } from './sidebar-close';
import { SignInButton } from '../layout/sign-in-button';
import { User } from '@/lib/types';

interface SearchHistoryProps {
    user: User;
}

export async function SearchHistory({ user }: SearchHistoryProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center mt-4 md:col-span-1 mx-4">
                <Link href="/" className="items-center space-x-2 flex">
                    <Icons.brain className="text-primary" />
                    <span className=" mx-2 font-urban text-xl font-bold">
                        {siteConfig.name}
                    </span>
                </Link>
                <div className="ml-auto">
                    <SidebarClose />
                </div>
            </div>
            {!user && <SignInButton />}

            <div className="mb-2 px-4 my-4">
                <Link
                    href="/"
                    className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10',
                    )}
                >
                    <Search className="-translate-x-2" strokeWidth={1.5} />
                    New Search
                </Link>
            </div>
            <SidebarList user={user} />
        </div>
    );
}