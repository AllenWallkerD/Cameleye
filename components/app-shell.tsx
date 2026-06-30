"use client";

import { type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";
import { AddTransactionDrawer } from "./add-transaction-drawer";
import { Icon } from "./icons";
import { useApp } from "./app-provider";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, addTxOpen, openAddTransaction, closeAddTransaction } = useApp();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      {/* mobile floating add button */}
      <button
        onClick={openAddTransaction}
        aria-label={t("tx.add")}
        className="grad-accent fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full text-white shadow-lg shadow-accent/40 lg:hidden"
      >
        <Icon.plus width={24} height={24} />
      </button>

      <BottomNav />

      {/* the single, app-wide add-transaction drawer */}
      <AddTransactionDrawer open={addTxOpen} onClose={closeAddTransaction} />
    </div>
  );
}
