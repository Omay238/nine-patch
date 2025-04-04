/**
 * Creates a NinePatch image.
 * @constructor
 * @param {string} src - The source image path. If ending with .9.png, the patches do not need to be specified.
 * @param {string} fillMode - The way that the image is filled. It can be "stretch" or "tile". Stretch will stretch the borders and center, while tile will tile the texture, truncating at the sides.
 * @param {number} patch1 - If only patch 1 is specified, all sides will have an equal patch size. Defaults to 0.
 * @param {number} patch2 - If patch 2 is also specified, patch 1 will be the x patch size and patch 2 will be the y patch size.
 * @param {number} patch3 - If patches 3-4 are specified, patches will be specifying each side, clockwise starting at the top.
 * @param {number} patch4 - If patches 3-4 are specified, patches will be specifying each side, clockwise starting at the top.
 */

// later, it'd be nice to have multiple constructors or something for the different amount of patches

class NinePatch {
    constructor(src, fillMode, patch1, patch2, patch3, patch4) {
        this.fillMode = fillMode;

        this.patches = new Array(9).fill(0);

        // this is almost definitely not the best way, but it's the most obvious
        // can't do default values because the others should be based on the previous ones.

        this.topPatch = patch1;
        this.rightPatch = patch2;
        this.bottomPatch = patch3;
        this.leftPatch = patch4;

        if (this.topPatch === undefined) {
            this.topPatch = 0;
        }
        if (this.rightPatch === undefined) {
            this.rightPatch = this.topPatch;
        }
        if (this.bottomPatch === undefined && this.leftPatch === undefined) {
            this.bottomPatch = this.topPatch;
            this.leftPatch = this.rightPatch;
        } else if (this.bottomPatch === undefined || this.leftPatch === undefined) {
            console.warn("Patch 3 and 4 should be specified together or not at all.\nIf they aren't both specified, they are ignored.");
        }

        // todo: apparently img.pixels is faster than img.get, so use that primarily later
        // however, this only runs on load, so it doesn't matter too much.
        // also, it probably isn't that big of a difference.

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

            this.patches[0] = img.get(
                0,
                0,
                this.leftPatch,
                this.topPatch
            ); // top left

            this.patches[1] = img.get(
                this.leftPatch,
                0,
                img.width - this.rightPatch - this.leftPatch,
                this.topPatch
            ); // top middle

            this.patches[2] = img.get(
                img.width - this.rightPatch,
                0,
                this.rightPatch,
                this.topPatch
            ); // top right

            this.patches[3] = img.get(
                img.width - this.rightPatch,
                this.topPatch,
                this.rightPatch,
                img.height - this.topPatch - this.bottomPatch
            ); // middle right

            this.patches[4] = img.get(
                img.width - this.rightPatch,
                img.height - this.bottomPatch,
                this.rightPatch,
                this.bottomPatch
            ); // bottom right

            this.patches[5] = img.get(
                this.leftPatch,
                img.height - this.bottomPatch,
                img.width - this.rightPatch - this.leftPatch,
                this.bottomPatch
            ); // bottom middle

            this.patches[6] = img.get(
                0,
                img.height - this.bottomPatch,
                this.leftPatch,
                this.bottomPatch
            ); // bottom left

            this.patches[7] = img.get(
                0,
                this.topPatch,
                this.leftPatch,
                img.height - this.topPatch - this.bottomPatch
            ); // middle left

            this.patches[8] = img.get(
                this.leftPatch,
                this.topPatch,
                img.width - this.rightPatch - this.leftPatch,
                img.height - this.topPatch - this.bottomPatch
            ); // middle
        }, (err) => {
            console.error(`Failed to load image ${src}: ${err}\nMake sure the file exists and is not corrupted.`);
        });
    }
    gen(wo, ho, segmentScale = 1) {
        let scaleTopPatch = this.topPatch * segmentScale;
        let scaleRightPatch = this.rightPatch * segmentScale;
        let scaleBottomPatch = this.bottomPatch * segmentScale;
        let scaleLeftPatch = this.leftPatch * segmentScale;

        let scaleMiddleWidth = this.patches[8].width * segmentScale;
        let scaleMiddleHeight = this.patches[8].height * segmentScale;

        // make the size a multiple of the segment scale
        wo = Math.round(wo / segmentScale) * segmentScale;
        ho = Math.round(ho / segmentScale) * segmentScale;

        // make sure at least the corners fit
        let w = max(scaleLeftPatch + scaleRightPatch, wo);
        let h = max(scaleTopPatch + scaleBottomPatch, ho);

        // make overflows for tiling
        let overflowX = (w - this.leftPatch - this.rightPatch) % this.patches[8].width;
        let overflowY = (h - this.topPatch - this.bottomPatch) % this.patches[8].height;
        console.log(overflowX, overflowY);

        // make the graphics object
        let temp = createGraphics(w, h);
        temp.noSmooth();

        // draw the middle
        if (this.fillMode === "stretch") {
            temp.image(
                this.patches[8],
                scaleLeftPatch,
                scaleTopPatch,
                w - scaleLeftPatch - scaleRightPatch,
                h - scaleTopPatch - scaleBottomPatch
            ); // middle
        } else if (this.fillMode === "tile") {
            let imgSrc = this.patches[8];

            let imgR, imgB, imgC;
            if (overflowX > 0) {
                imgR = imgSrc.get(
                    0,
                    0,
                    overflowX,
                    imgSrc.height
                );
            }
            if (overflowY > 0) {
                imgB = imgSrc.get(
                    0,
                    0,
                    imgSrc.width,
                    overflowY
                );
            }
            if (overflowX > 0 && overflowY > 0) {
                imgC = imgSrc.get(
                    0,
                    0,
                    overflowX,
                    overflowY
                );
            }

            for (let x = scaleLeftPatch; x < w - scaleRightPatch; x += scaleMiddleWidth) {
                for (let y = scaleTopPatch; y < h - scaleBottomPatch; y += scaleMiddleHeight) {
                    let img = imgSrc;

                    if (x >= w - scaleRightPatch - scaleMiddleWidth && y >= h - scaleBottomPatch - scaleMiddleHeight && overflowX > 0 && overflowY > 0) {
                        img = imgC;
                    } else if (x >= w - scaleRightPatch - scaleMiddleWidth && overflowX > 0) {
                        img = imgR;
                    } else if (y > h - scaleBottomPatch - scaleMiddleHeight && overflowY > 0) {
                        img = imgB;
                    }

                    temp.image(img, x, y, img.width * segmentScale, img.height * segmentScale);
                }
            }
        }

        // draw the sides
        if (this.fillMode === "stretch") {
            // need to only draw sides if they exist
            if (wo === w) {
                temp.image(
                    this.patches[1],
                    scaleLeftPatch,
                    0,
                    w - scaleLeftPatch - scaleRightPatch,
                    scaleTopPatch
                ); // top middle

                temp.image(
                    this.patches[5],
                    scaleLeftPatch,
                    h - scaleBottomPatch,
                    w - scaleLeftPatch - scaleRightPatch,
                    scaleBottomPatch
                ); // bottom middle
            }
            if (ho === h) {
                temp.image(
                    this.patches[3],
                    w - scaleRightPatch,
                    scaleBottomPatch - 1,
                    scaleTopPatch,
                    h - scaleTopPatch - scaleBottomPatch + 1
                ); // right middle -- i don't know why i need to offset by one, but this works.

                temp.image(
                    this.patches[7],
                    0,
                    scaleTopPatch,
                    scaleLeftPatch,
                    h - scaleTopPatch - scaleBottomPatch
                ); // left middle
            }
        } else if (this.fillMode === "tile") {

        }

        // draw the corners first (they're easy)
        temp.image(
            this.patches[0],
            0,
            0,
            scaleLeftPatch,
            scaleTopPatch
        ); // top left

        temp.image(
            this.patches[2],
            w - scaleRightPatch,
            0,
            scaleRightPatch,
            scaleTopPatch
        ); // top right

        temp.image(
            this.patches[4],
            w - scaleRightPatch,
            h - scaleBottomPatch,
            scaleRightPatch,
            scaleBottomPatch
        ); // bottom right

        temp.image(
            this.patches[6],
            0,
            h - scaleBottomPatch,
            scaleLeftPatch,
            scaleBottomPatch
        ); // bottom left

        let out = temp.get();

        temp.remove();

        return out;
    }
}