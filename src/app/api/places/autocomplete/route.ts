import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!input) {
      return NextResponse.json(
        { error: 'Input parameter is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${apiKey}&components=country:us`
    );

    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in places autocomplete API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place suggestions' },
      { status: 500 }
    );
  }
}
