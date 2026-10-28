import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, mockType } = body;

    // If mock scenario requested for judging demonstration:
    if (mockType === "fraud-gstin") {
      return NextResponse.json({
        success: true,
        data: {
          vendorName: "Shady Emergency Mart",
          gstin: "INVALID_GST_999",
          invoiceNo: "INV-SHADY-0099",
          amount: 45000,
          date: new Date().toISOString().split("T")[0],
          receiverAccount: "•••• 1111",
          items: [{ name: "Generic Relief Bags", qty: "100 units", rate: 450 }],
        },
      });
    }

    if (mockType === "fraud-duplicate") {
      return NextResponse.json({
        success: true,
        data: {
          vendorName: "Kisan Agro Relief Supplies",
          gstin: "27AABCK1234F1Z5",
          invoiceNo: "INV-2026-KA-4412", // Existing invoice!
          amount: 85000,
          date: new Date().toISOString().split("T")[0],
          receiverAccount: "•••• 4892",
          items: [{ name: "500kg Rice Sacks (Duplicate Claim)", qty: "500 kg", rate: 170 }],
        },
      });
    }

    if (mockType === "fraud-overbudget") {
      return NextResponse.json({
        success: true,
        data: {
          vendorName: "Aashray Shelter & Tarp Mills",
          gstin: "27AAZCA1122D1Z4",
          invoiceNo: "INV-2026-AS-9901",
          amount: 250000, // Budget is only 120,000!
          date: new Date().toISOString().split("T")[0],
          receiverAccount: "•••• 7712",
          items: [{ name: "Deluxe Tarpaulins and Tents", qty: "500 units", rate: 500 }],
        },
      });
    }

    // Default valid invoice parsing (representing AI OCR extraction from bill photo)
    return NextResponse.json({
      success: true,
      data: {
        vendorName: "Sanjivani Lifecare Pharma",
        gstin: "27AAGCS9876Q1Z2",
        invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
        amount: 35000,
        date: new Date().toISOString().split("T")[0],
        receiverAccount: "•••• 9104",
        items: [
          { name: "Emergency Trauma Bandages & Gauze", qty: "150 packs", rate: 100 },
          { name: "Broad-Spectrum Pediatric Antibiotics", qty: "100 bottles", rate: 200 },
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to parse bill" },
      { status: 500 }
    );
  }
}
