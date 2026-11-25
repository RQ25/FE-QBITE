"use client";

import React from "react";
import CustomerHeader from "./header";
import CustomerFooter from "./footer";

interface CustomerTemplateProps {
  children: React.ReactNode;
  title?: string;
  cartCount?: number;
  recentOrdersCount?: number;
  onOpenCart?: () => void;
  onOpenOrders?: () => void;
}

export default function CustomerTemplate({
  children,
  cartCount,
  recentOrdersCount,
  onOpenCart,
  onOpenOrders,
}: CustomerTemplateProps) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#FCF0E4] text-[#292D2B]">
      <CustomerHeader
        cartCount={cartCount}
        recentOrdersCount={recentOrdersCount}
        onOpenCart={onOpenCart}
        onOpenOrders={onOpenOrders}
      />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-8">
        {children}
      </main>

      <CustomerFooter />
    </div>
  );
}