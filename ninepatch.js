/**
 * Creates a NinePatch image.
 * @constructor
 * @param {string} src - The source image path. If ending with .9.png, the patches do not need to be specified.
 * @param {number} stretch - Whether to stretch the image. If false, it will tile.
 * @param {number} patch1 - If only patch 1 is specified, all sides will have an equal patch size.
 * @param {number} patch2 - If patch 2 is also specified, patch 1 will be the x patch size and patch 2 will be the y patch size.
 * @param {number} patch3 - If patches 3-4 are specified, patches will be specifying each side, clockwise starting at the top.
 * @param {number} patch4 - If patches 3-4 are specified, patches will be specifying each side, clockwise starting at the top.
 */

class NinePatch {
    constructor(src, stretch, patch1, patch2, patch3, patch4) {
        this.stretch = stretch;

        this.patches = new Array(9).fill(0);

        // todo: apparently img.pixels is faster than just get, so use that primarily later
        // however, this only runs on load, so it doesn't matter too much. also, it probably isn't that big of a difference
        loadImage(src, (img) => {
            if (src.endsWith(".9.png")) {
                let vertLayer = img.get(0, 0, img.width, 1);
                let horizLayer = img.get(0, 0, 1, img.height);

                for (let i = 0; i < vertLayer.width; i++) {
                    if (vertLayer.get(i, 0)[3] === 0) {
                        patch1 = i;
                    }
                    if (patch1 !== undefined && vertLayer.get(i, 0)[3] !== 0) {
                        patch2 = i - 1;
                        break;
                    }
                }
                for (let i = 0; i < horizLayer.height; i++) {
                    if (horizLayer.get(0, i)[3] === 0) {
                        patch3 = i;
                    }
                    if (patch3 !== undefined && horizLayer.get(0, i)[3] !== 0) {
                        patch4 = i - 1;
                        break;
                    }
                }

                img = img.get(1, 1, img.width - 1, img.height - 1); // remove the borders
            } else {
                if (patch1 === undefined) {
                    patch1 = 0;
                }
                if (patch2 === undefined) {
                    patch2 = patch1;
                }
                if (patch3 === undefined && patch4 === undefined) {
                    patch3 = patch1;
                    patch4 = patch2;
                } else if ((patch3 === undefined || patch4 === undefined) && patch3 !== patch4) {
                    console.error("Patch 3 and 4 must be specified together or not at all.");
                }
            }

            this.patches[0] = img.get(0, 0, patch4, patch1); // top left
            this.patches[1] = img.get(patch4, 0, img.width - patch2 - patch4, patch1); // top middle
            this.patches[2] = img.get(img.width - patch2, 0, patch2, patch1); // top right
            this.patches[3] = img.get(img.width - patch2, patch1, patch2, img.height - patch1 - patch3); // middle right
            this.patches[4] = img.get(img.width - patch2, img.height - patch3, patch2, patch3); // bottom right
            this.patches[5] = img.get(patch4, img.height - patch3, img.width - patch2 - patch4, patch3); // bottom middle
            this.patches[6] = img.get(0, img.height - patch3, patch4, patch3); // bottom left
            this.patches[7] = img.get(0, patch1, patch4, img.height - patch1 - patch3); // middle left
            this.patches[8] = img.get(patch4, patch1, img.width - patch2 - patch4, img.height - patch1 - patch3); // middle
        }, (err) => {
            console.error(`Failed to load image ${src}: ${err}\nMake sure the file exists and is not corrupted.`);
        });
    }
    gen(wo, ho) {
        // make sure at least the corners fit
        let w = max(this.patches[3].width + this.patches[7].width, wo);
        let h = max(this.patches[1].height + this.patches[5].height, ho);

        // make the graphics object
        let temp = createGraphics(w, h);
        temp.noSmooth();

        // draw the middle
        if (this.stretch) {
            temp.image(this.patches[8], this.patches[0].width, this.patches[0].height, w - this.patches[0].width - this.patches[2].width, h - this.patches[0].height - this.patches[6].height); // middle
        } else {
            console.error("Tiling not yet supported")
        }

        // draw the sides
        if (this.stretch) {
            if (wo === w) {
                temp.image(this.patches[1], this.patches[0].width, 0, w - this.patches[0].width - this.patches[2].width, this.patches[1].height); // top middle
                temp.image(this.patches[5], this.patches[6].width, h - this.patches[5].height, w - this.patches[6].width - this.patches[4].width, this.patches[5].height); // bottom middle
            }
            if (ho === h) {
                temp.image(this.patches[3], w - this.patches[3].width, this.patches[7].height - 1, this.patches[3].width, h - this.patches[7].height - this.patches[4].height + 1); // right middle -- i don't know why i need this little hack, but it works...
                temp.image(this.patches[7], 0, this.patches[0].height, this.patches[7].width, h - this.patches[0].height - this.patches[6].height); // left middle
            }
        } else {
            // let extra = (w - this.patches[2].width - this.patches[0].width) % this.patches[1].width;
            // for (let i = this.patches[0].width - extra; i < w - this.patches[2].width; i += this.patches[1].width) {
            //     if (i < this.patches[0].width) {
            //         temp.image(this.patches[1].get(floor(extra * 0.5), 0, this.patches[1].width - floor(extra * 0.5), this.patches[1].height), i - floor(extra * -0.5), 0)
            //     } else if (i > w - this.patches[2].width - this.patches[1].width) {
            //         temp.image(this.patches[1].get(0, 0, this.patches[1].width - floor(extra * 0.5), this.patches[1].height), i, 0)
            //     } else {
            //         temp.image(this.patches[1], i, 0);
            //     }
            // }
        }

        // draw the corners first (they're easy)
        temp.image(this.patches[0], 0, 0); // top left
        temp.image(this.patches[2], w - this.patches[2].width, 0); // top right
        temp.image(this.patches[4], w - this.patches[4].width, h - this.patches[4].height); // bottom right
        temp.image(this.patches[6], 0, h - this.patches[6].height); // bottom left

        return temp.get();
    }
}