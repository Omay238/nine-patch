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

        //this is almost definitely not the best way, but it's the most obvious

        this.topPatch = patch1;
        this.rightPatch = patch2;
        this.bottomPatch = patch3;
        this.leftPatch = patch4;

        if (patch1 === undefined) {
            this.topPatch = 0;
        }
        if (patch2 === undefined) {
            this.rightPatch = this.topPatch;
        }
        if (patch3 === undefined && patch4 === undefined) {
            this.bottomPatch = this.topPatch;
            this.leftPatch = this.rightPatch;
        } else if ((patch3 === undefined || patch4 === undefined) && patch3 !== patch4) {
            console.error("Patch 3 and 4 must be specified together or not at all.");
        }

        // todo: apparently img.pixels is faster than just get, so use that primarily later
        // however, this only runs on load, so it doesn't matter too much. also, it probably isn't that big of a difference
        loadImage(src, (img) => {
            if (src.endsWith(".9.png")) {
                let vertLayer = img.get(0, 0, img.width, 1);
                let horizLayer = img.get(0, 0, 1, img.height);

                for (let i = 0; i < vertLayer.width; i++) {
                    if (vertLayer.get(i, 0)[3] === 0) {
                        this.leftPatch = i;
                    }
                    if (this.leftPatch !== undefined && vertLayer.get(i, 0)[3] !== 0) {
                        this.rightPatch = i - 1;
                        break;
                    }
                }
                for (let i = 0; i < horizLayer.height; i++) {
                    if (horizLayer.get(0, i)[3] === 0) {
                        this.topPatch = i;
                    }
                    if (this.topPatch !== undefined && horizLayer.get(0, i)[3] !== 0) {
                        this.bottomPatch = i - 1;
                        break;
                    }
                }

                img = img.get(1, 1, img.width - 1, img.height - 1); // remove the borders
            }

            this.patches[0] = img.get(0, 0, this.leftPatch, this.topPatch); // top left
            this.patches[1] = img.get(this.leftPatch, 0, img.width - this.rightPatch - this.leftPatch, this.topPatch); // top middle
            this.patches[2] = img.get(img.width - this.rightPatch, 0, this.rightPatch, this.topPatch); // top right
            this.patches[3] = img.get(img.width - this.rightPatch, this.topPatch, this.rightPatch, img.height - this.topPatch - this.bottomPatch); // middle right
            this.patches[4] = img.get(img.width - this.rightPatch, img.height - this.bottomPatch, this.rightPatch, this.bottomPatch); // bottom right
            this.patches[5] = img.get(this.leftPatch, img.height - this.bottomPatch, img.width - this.rightPatch - this.leftPatch, this.bottomPatch); // bottom middle
            this.patches[6] = img.get(0, img.height - this.bottomPatch, this.leftPatch, this.bottomPatch); // bottom left
            this.patches[7] = img.get(0, this.topPatch, this.leftPatch, img.height - this.topPatch - this.bottomPatch); // middle left
            this.patches[8] = img.get(this.leftPatch, this.topPatch, img.width - this.rightPatch - this.leftPatch, img.height - this.topPatch - this.bottomPatch); // middle
        }, (err) => {
            console.error(`Failed to load image ${src}: ${err}\nMake sure the file exists and is not corrupted.`);
        });
    }
    gen(wo, ho) {
        // make sure at least the corners fit
        let w = max(this.rightPatch + this.leftPatch, wo);
        let h = max(this.topPatch + this.bottomPatch, ho);

        // make the graphics object
        let temp = createGraphics(w, h);
        temp.noSmooth();

        // draw the middle
        if (this.stretch) {
            temp.image(this.patches[8], this.leftPatch, this.topPatch, w - this.rightPatch - this.leftPatch, h - this.topPatch - this.bottomPatch); // middle
        } else {
            console.error("Tiling is not supported yet.");
        }

        // draw the sides
        if (this.stretch) {
            // need to only draw sides if they exist
            if (wo === w) {
                temp.image(this.patches[1], this.leftPatch, 0, w - this.leftPatch - this.rightPatch, this.topPatch); // top middle
                temp.image(this.patches[5], this.leftPatch, h - this.bottomPatch, w - this.leftPatch - this.rightPatch, this.bottomPatch); // bottom middle
            }
            if (ho === h) {
                temp.image(this.patches[3], w - this.rightPatch, this.bottomPatch - 1, this.topPatch, h - this.topPatch - this.bottomPatch + 1); // right middle -- i don't know why i need this little hack, but it works...
                temp.image(this.patches[7], 0, this.topPatch, this.leftPatch, h - this.topPatch - this.bottomPatch); // left middle
            }
        } else {
            console.error("Tiling is not supported yet.");
        }

        // draw the corners first (they're easy)
        temp.image(this.patches[0], 0, 0); // top left
        temp.image(this.patches[2], w - this.rightPatch, 0); // top right
        temp.image(this.patches[4], w - this.rightPatch, h - this.bottomPatch); // bottom right
        temp.image(this.patches[6], 0, h - this.bottomPatch); // bottom left

        return temp.get();
    }
}