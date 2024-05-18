import { NextRequest } from "next/server";
import { VideoData, getAllVideosForDateRange } from "utilities/metadata-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const category: string | null = searchParams.get('category');
  const start: string | null = searchParams.get('start');
  const end: string | null = searchParams.get('end');

  if (category === null ||
    (start === null && end === null)
  ) {
    return new Response("Error: parameters 'category', and at least one of 'start' and 'end' required", { status: 422 });
  }

  const videos: VideoData[] = await getAllVideosForDateRange(category, start, end);

  return Response.json({ data: videos });
}