import path from 'path';
import { readdir, readFile } from 'fs/promises';
import * as fs from 'fs';
import { isEqual, parseISO, startOfDay } from 'date-fns';

function buildTranscriptFolderPath(category, id) {
    return path.join(process.cwd(), 'data', 'transcripts', category, id[0]);
}

export async function getAllCategories() {
    const entries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts'),
        { withFileTypes: true }
    );

    return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
}

export async function getAllVideosForCategory(category) {
    const prefixDirectoryEntries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts', category),
        {
            withFileTypes: true
        }
    );

    const prefixPaths = prefixDirectoryEntries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(entry.path, entry.name));

    const allVideos = [];

    // Inspect directories sequentially to limit the number of concurrently open files
    for (const prefixPath of prefixPaths) {
        const metadataEntries = await readdir(
            prefixPath,
            {
                withFileTypes: true
            }
        );

        // Files are usually videoId.mp4, videoId.json, videoId.metadata.json,
        // and optionally videoId.props.json.
        //
        // Look for videoId.json as that determines if the transcription is available.
        const videoIds = metadataEntries
            .filter(entry => entry.isFile())
            .filter(entry => entry.name.endsWith('.json'))
            .filter(entry => ! entry.name.endsWith('.metadata.json'))
            .map(entry => entry.name.split('.')[0]);

        for (const videoId of videoIds) {
            const videoData = {};
            videoData.metadata = JSON.parse(
                await readFile(path.join(prefixPath, `${videoId}.metadata.json`)));

            const propFilePath = path.join(prefixPath, `${videoId}.props.json`);
            if (fs.existsSync(propFilePath)) {
                videoData.props = JSON.parse(
                    await readFile(path.join(prefixPath, `${videoId}.props.json`)));
            } else {
              videoData.props = {};
            }

            videoData.date = videoData.props.date || videoData.metadata.publish_date;
            videoData.transcription_path = path.join(prefixPath, `${videoId}.json`);

            allVideos.push(videoData);
        }
    }

    return allVideos;
}

export async function getDatesForCategory(category) {
    const allVideos = await getAllVideosForCategory(category);

    return [... new Set(allVideos.map(
        video => parseISO(video.date)
    ))].sort((a,b) => b-a);
}

export async function getAllVideosForPublishDate(category, date) {
    const categoryVideos = await getAllVideosForCategory(category);

    return categoryVideos
        .filter(video => {
            const publishDate = startOfDay(parseISO(video.date));
            return isEqual(publishDate, startOfDay(date));
        });
}

export async function getVideoForDateAndTitle(category, date, title) {
    const allVideosForDate = await getAllVideosForPublishDate(category, date);

    return allVideosForDate.find(video => video.metadata.title === title);
}

export async function getTranscript(category, id) {
    const transcriptPath = path.join(buildTranscriptFolderPath(category, id), `${id}.json`);
    return await readFile(transcriptPath).then(
        JSON.parse
    ).catch((err) => {
        if (err.code === 'ENOENT') {
            return { segments: [] };
        }
        else {
            return Promise.reject(err);
        }
    });
}

export async function getSpeakerMapping(category, id) {
    const speakerPath = path.join(buildTranscriptFolderPath(category, id), `${id}.speakers.json`);

    // Not all transcripts are expected to be mapped, so handle missing files by returning an empty object
    if (!fs.existsSync(speakerPath)) {
        return {};
    }

    return JSON.parse(await readFile(speakerPath));
}
