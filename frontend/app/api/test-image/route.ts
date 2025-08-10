import { NextResponse } from "next/server";

export async function GET() {
  const testImageUrl =
    "https://d381hxsnkctmjc.cloudfront.net/media/images/chesapeake-farmland-fullres_35r9dz6.jpg";

  try {
    // Log environment variables
    const envInfo = {
      CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN,
      BACKEND_DOMAIN: process.env.BACKEND_DOMAIN,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Try to fetch the image
    const response = await fetch(testImageUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return NextResponse.json({
      success: true,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      env: envInfo,
      imageUrl: testImageUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        env: {
          CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN,
          BACKEND_DOMAIN: process.env.BACKEND_DOMAIN,
          NODE_ENV: process.env.NODE_ENV,
        },
        imageUrl: testImageUrl,
      },
      { status: 500 }
    );
  }
}
