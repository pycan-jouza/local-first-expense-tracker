"use client";

import { AccountProvider } from "@/contexts/AccountContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { HlcProvider } from "@/contexts/HlcContext";
import { QueryCacheProvider } from "@/contexts/QueryCacheContext";
import { WebsocketProvider } from "@/contexts/WebsocketContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <>
      <header>
        <nav>
          <ul>
            <li>
              <h1>lofextra (beta)</h1>
            </li>
          </ul>

          <ul>
            {pathname !== "/dashboard" && (
              <li>
                <Link href="/dashboard">dashboard</Link>
              </li>
            )}

            {!pathname.includes("statistics") && (
              <li>
                <Link href="/dashboard/statistics">statistics</Link>
              </li>
            )}

            {!pathname.includes("categories") && (
              <li>
                <Link href="/dashboard/categories">categories</Link>
              </li>
            )}

            {!pathname.includes("account") && (
              <li>
                <Link href="/dashboard/account">account</Link>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <DatabaseProvider>
        <QueryCacheProvider>
          <AccountProvider>
            <HlcProvider>
              <WebsocketProvider>{children}</WebsocketProvider>
            </HlcProvider>
          </AccountProvider>
        </QueryCacheProvider>
      </DatabaseProvider>
    </>
  );
}
