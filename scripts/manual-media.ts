import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import sharp from 'sharp';
import type { ManualAsset } from '../lib/manual-types';

const VERSION = 'gif-vp9-34-h264-24-webp80-v1';
export class ManualMediaProcessor {
  private cache: Record<string, { key: string; asset: ManualAsset }> = {};
  readonly files = new Set<string>();
  readonly totals = { count: 0, cached: 0, original: 0, converted: 0 };
  constructor(private root: string, private lang: string, private warnings: string[]) {}
  private disk(src: string) { return path.join(this.root, 'public', src); }
  private cacheFile() { return path.join(this.root, 'content/manual/.media-cache', `${this.lang}.json`); }
  async init() { try { this.cache = JSON.parse(await fs.readFile(this.cacheFile(), 'utf8').catch(() => '{}')); } catch { this.warnings.push(`${this.lang}: 媒体缓存损坏，将重新转换。`); this.cache = {}; } }
  async save() { await fs.mkdir(path.dirname(this.cacheFile()), { recursive: true }); const temporary=`${this.cacheFile()}.tmp`;await fs.writeFile(temporary, JSON.stringify(this.cache, null, 2));await fs.rename(temporary,this.cacheFile()); }
  private run(args: string[]) {
    if (!ffmpeg) throw new Error('ffmpeg-static is unavailable');
    const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`Media conversion failed: ${result.stderr}`);
  }
  async convert(buffer: Buffer, filename: string, id: string): Promise<ManualAsset> {
    const md5 = createHash('md5').update(buffer).digest('hex');
    const key = `${VERSION}:${md5}:${id}`;
    const isGif = /\.gif$/i.test(filename);
    const base = `/manual-assets/${this.lang}/video/${id}`;
    const original = isGif ? `/manual-assets/${this.lang}/gif-original/${path.basename(filename)}` : undefined;
    const input = original ? this.disk(original) : path.join(this.root, 'content/manual/.media-cache', `${this.lang}-${id}${path.extname(filename)}`);
    await fs.mkdir(path.dirname(input), { recursive: true });
    await fs.writeFile(input, buffer);
    const cached = this.cache[filename];
    const paths = (a: ManualAsset) => [...new Set([a.src, a.webm, a.mp4, a.poster, a.original].filter(Boolean) as string[])];
    let asset: ManualAsset;
    if (cached?.key === key && (await Promise.all(paths(cached.asset).map(f => fs.access(this.disk(f)).then(() => true, () => false)))).every(Boolean)) {
      asset = { ...cached.asset }; if(isGif)this.totals.cached++;
    } else {
      const probe = spawnSync(ffprobe.path, ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames,width,height,duration:format=duration', '-of', 'json', input], { encoding: 'utf8' });
      if (probe.status !== 0) throw new Error(`ffprobe failed for ${filename}: ${probe.stderr}`);
      const info = JSON.parse(probe.stdout); const stream = info.streams?.[0];
      const frames = Number(stream?.nb_read_frames);
      if (!Number.isFinite(frames) || frames < 1) throw new Error(`Invalid frame count: ${filename}`);
      await fs.mkdir(path.dirname(this.disk(`${base}.webm`)), { recursive: true });
      const scale = "scale='trunc(min(1600,iw)/2)*2':'trunc(ih*min(1600,iw)/iw/2)*2'";
      const poster = `${base}-poster.webp`;
      this.run(['-i', input, '-vf', scale, '-vframes', '1', '-c:v', 'libwebp', '-quality', '80', this.disk(poster)]);
      asset = { id, type: 'image', src: poster, poster, original, originalFilename: filename, md5, frames, duration: Number(info.format?.duration ?? stream.duration ?? 0), width: stream.width, height: stream.height, originalBytes: buffer.length, convertedBytes: (await fs.stat(this.disk(poster))).size, paragraph: -1, context: '' };
      if (!isGif || frames > 1) {
        const webm = `${base}.webm`, mp4 = `${base}.mp4`;
        // GIFs have no audio; supplementary real videos retain any original audio track.
        this.run(['-i', input, '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-vf', scale, '-threads', '8', '-row-mt', '1', ...(isGif?['-an']:['-c:a','libopus']), this.disk(webm)]);
        this.run(['-i', input, '-c:v', 'libx264', '-crf', '24', '-pix_fmt', 'yuv420p', '-vf', scale, '-movflags', '+faststart', '-threads', '2', ...(isGif?['-an']:['-c:a','aac']), this.disk(mp4)]);
        const bytes = (await fs.stat(this.disk(webm))).size + (await fs.stat(this.disk(mp4))).size + asset.convertedBytes!;
        if (isGif && bytes > buffer.length) {
          asset.fallbackReason = 'Video formats exceed original GIF size';
          await fs.unlink(this.disk(webm)); await fs.unlink(this.disk(mp4));
        } else Object.assign(asset, { type: 'video', src: webm, webm, mp4, convertedBytes: bytes });
      }
      this.cache[filename] = { key, asset: { ...asset } };
      // Persist per file: a long conversion can be interrupted without losing progress.
      await this.save();
      console.log(`${this.lang}: ${filename} — ${frames} frames, ${asset.type}`);
    }
    const dimensions=await sharp(this.disk(asset.poster!)).metadata();
    Object.assign(asset,{originalWidth:asset.width,originalHeight:asset.height,convertedWidth:dimensions.width,convertedHeight:dimensions.height});
    this.cache[filename]={key,asset:{...asset}};await this.save();
    if (asset.fallbackReason) this.warnings.push(`${this.lang}: ${filename} 转视频后体积增大，使用 WebP 首帧静图。`);
    paths(asset).forEach(src => this.files.add(this.disk(src)));
    if (isGif) { this.totals.count++; this.totals.original += buffer.length; this.totals.converted += asset.convertedBytes!; }
    if (!original) await fs.unlink(input);
    return asset;
  }
}
