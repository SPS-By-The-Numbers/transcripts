// Converts seconds into a classname with the timestamp that can be searched for.
// TODO: consider using seconds only.
export function toTimeClassName(seconds) {
    if (seconds) {
        return `ts-${toHhmmss(seconds)}`;
    }
    return '';
}

export function toHhmmss(seconds: number) {
  return new Date(seconds * 1000).toISOString().slice(11, 19);
}

export function fromHhmmss(hhmmss: string): number {
    const parts = hhmmss.split(':');
    return Number(parts[2]) + (Number(parts[1]) * 60) + (Number(parts[0]) * 60 * 60);
}

export function toSpeakerColorClass(speakerNum: number) {
  return `c-${speakerNum % 7}`;
}

