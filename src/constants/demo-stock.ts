import { Device, Profile } from "@/types";

export const DEMO_DEVICES: Device[] = [
    // ... existing devices ...
    {
        id: "demo-6",
        serialNumber: "SN-000006",
        model: "PS5 Spiderman Edition",
        category: "PS5",
        status: "Rented",
        health: 98,
        notes: "Premium limited edition unit",
        currentUser: "Ananya Iyer",
        lastService: "Feb 1, 2026",
        cost: 55000,
        purchaseDate: "2026-01-20",
        warrantyExpiry: "2027-01-20",
        supplier: "Sony India"
    }
];

export const DEMO_PROFILES: Profile[] = [
    {
        id: "demo-user-1",
        email: "rahul@example.com",
        full_name: "Rahul Sharma",
        role: "customer",
        kyc_status: "approved",
        wallet_balance: 5000,
        created_at: new Date().toISOString()
    },
    {
        id: "demo-user-2",
        email: "ananya@example.com",
        full_name: "Ananya Iyer",
        role: "customer",
        kyc_status: "approved",
        wallet_balance: 7500,
        created_at: new Date().toISOString()
    },
    {
        id: "demo-user-3",
        email: "admin@consolezone.in",
        full_name: "Admin User",
        role: "admin",
        kyc_status: "approved",
        wallet_balance: 0,
        created_at: new Date().toISOString()
    }
];
