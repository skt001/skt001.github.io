#!/usr/bin/env python3
# update.py - builds media.json (an index of the images/videos under this folder).
# Mac/Linux counterpart of update.ps1; keep the extension lists and output format in sync with it.

import json
import os
import sys
import time

IMAGE_EXTS = (
    "jpg jpeg jpe jfif jif jfi pjpeg pjp png apng gif webp bmp dib avif avifs svg svgz ico cur "
    "heic heif heics heifs hif tif tiff jxl jp2 j2k j2c jpf jpx jpm jxr wdp hdp tga icb vda vst pcx "
    "pbm pgm ppm pnm pam xbm xpm psd psb exr hdr dds icns wbmp "
    "dng cr2 cr3 crw nef nrw arw srf sr2 orf raf rw2 rwl pef srw x3f 3fr erf mef mrw kdc dcr iiq"
).split()
VIDEO_EXTS = (
    "mp4 webm mov qt m4v ogv ogg mpg mpeg mkv avi wmv flv 3gp 3g2 3gpp 3gp2 mp4v mpe mpv m1v m2v "
    "vob ogm asf wm rm rmvb divx f4v mts m2ts m2t tp trp ts mod dat mxf dv ivf y4m nsv amv lrv insv "
    "gifv wtv dvr-ms h264 h265 hevc 264 265"
).split()

KIND_OF = {e: "image" for e in IMAGE_EXTS}
KIND_OF.update({e: "video" for e in VIDEO_EXTS})


def main():
    t0 = time.perf_counter()
    root = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(root, "media.json")
    log_path = os.path.join(root, "update.log")
    log_lines = []

    def log(msg):
        print(msg)
        log_lines.append(msg)

    items = []
    n_dot_folders = 0
    skipped_links = []
    skipped_unreadable = []

    def on_walk_error(err):
        skipped_unreadable.append(getattr(err, "filename", str(err)))

    for dirpath, dirnames, filenames in os.walk(root, onerror=on_walk_error, followlinks=False):
        kept = []
        for d in sorted(dirnames):
            full = os.path.join(dirpath, d)
            if d.startswith("."):
                n_dot_folders += 1
                continue  # dot-folders are hidden by convention; not walked
            if os.path.islink(full):
                skipped_links.append(full)  # links are not followed, to avoid loops
                continue
            kept.append(d)
        dirnames[:] = kept

        for name in sorted(filenames):
            if name.startswith("."):
                continue  # dotfiles are hidden by convention; excluded
            dot = name.rfind(".")
            if dot <= 0 or dot == len(name) - 1:
                continue
            ext = name[dot + 1:].lower()
            kind = KIND_OF.get(ext)
            if not kind:
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            items.append({"path": rel, "kind": kind, "ext": ext})

    items.sort(key=lambda item: item["path"])

    try:
        tmp_path = out_path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False)
            f.write("\n")
        os.replace(tmp_path, out_path)
    except OSError as e:
        log("ERROR: " + str(e))
        write_log(log_path, log_lines)
        sys.exit(1)

    n_img = sum(1 for i in items if i["kind"] == "image")
    n_vid = sum(1 for i in items if i["kind"] == "video")
    elapsed = time.perf_counter() - t0
    log("media.json updated: {0} items (images {1}, videos {2}) in {3:.2f}s".format(
        len(items), n_img, n_vid, elapsed))

    if n_dot_folders or skipped_links or skipped_unreadable:
        log("Skipped: dot-folders {0}, links {1}, unreadable {2}".format(
            n_dot_folders, len(skipped_links), len(skipped_unreadable)))
        for s in skipped_links:
            log("  link: " + s)
        for s in skipped_unreadable:
            log("  unreadable: " + s)

    write_log(log_path, log_lines)


def write_log(log_path, lines):
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
