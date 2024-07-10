export function getCategoryPath(category: string): string {
    return `/${category}`;
}

export function getDatePath(category: string, date: string): string {
    return `${getCategoryPath(category)}/${date}`;
}

export function getVideoPath(category: string, videoId: string): string {
    return `${getCategoryPath(category)}/v/${videoId.substr(0,2).toUpperCase()}/${videoId}`;
}
