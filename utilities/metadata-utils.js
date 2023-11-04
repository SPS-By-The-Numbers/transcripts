import path from 'path';
import { readdir, readFile } from 'fs/promises';
import { isEqual, parseJSON, startOfDay } from 'date-fns';

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

export async function getAllMetadataForCategory(category) {
    const prefixDirectoryEntries = await readdir(
        path.join(process.cwd(), 'data', 'transcripts', category),
        {
            withFileTypes: true
        }
    );

    const prefixPaths = prefixDirectoryEntries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(entry.path, entry.name));

    const allMetadata = [];

    // Inspect directories sequentially to limit the number of concurrently open files
    for (let prefixPath of prefixPaths) {
        const metadataEntries = await readdir(
            prefixPath,
            {
                withFileTypes: true
            }
        );

        const metadataFiles = metadataEntries
            .filter(entry => entry.isFile() && entry.name.endsWith('.metadata.json'));

        const curPrefixMetadata = await Promise.all(metadataFiles.map(entry =>
            readFile(path.join(entry.path, entry.name))
                .then(contents => JSON.parse(contents))
        ));

        allMetadata.push(...curPrefixMetadata);
    }

    return allMetadata;
}

export async function getDatesForCategory(category) {
    const metadata = await getAllMetadataForCategory(category);

    return [... new Set(metadata.map(
        metadata => parseJSON(metadata.publish_date)
    ))];
}

export async function getAllMetadataForPublishDate(category, date) {
    const categoryMetadata = await getAllMetadataForCategory(category);

    return categoryMetadata
        .filter(metadata => {
            const publishDate = startOfDay(parseJSON(metadata.publish_date));
            return isEqual(publishDate, date);
        });
}

export async function getMetadataForDateAndTitle(category, date, title) {
    const allMetadataForDate = await getAllMetadataForPublishDate(category, date);

    return allMetadataForDate.find(metadata => metadata.title === title);
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
    return await readFile(speakerPath).then(
        JSON.parse
    ).catch((err) => {
        if (err.code === 'ENOENT') {
            return {}
        }
        else {
            return Promise.reject(err);
        }
    });
}