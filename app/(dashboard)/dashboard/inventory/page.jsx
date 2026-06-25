"use client";

import { InventoryStats } from "@/components/inventory/InventoryStats";
import { ImeiTable } from "@/components/inventory/ImeiTable";
import { AccessoryStockTable } from "@/components/inventory/AccessoryStockTable";
import { TransfersTable } from "@/components/inventory/TransfersTable";
import { LowStockAlerts } from "@/components/inventory/LowStockAlerts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-2xl mx-auto animate-in fade-in-0 duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage phone units, accessories and stock transfers.
        </p>
      </div>

      {/* Stats */}
      <InventoryStats />

      {/* Tabs */}
      <Tabs defaultValue="imei">
        <TabsList>
          <TabsTrigger value="imei">IMEI Units</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="imei" className="mt-4">
          <ImeiTable />
        </TabsContent>

        <TabsContent value="accessories" className="mt-4">
          <AccessoryStockTable />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <TransfersTable />
        </TabsContent>

        <TabsContent value="low-stock" className="mt-4">
          <LowStockAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
