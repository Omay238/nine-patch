![nine patch logo](./images/logo-large.png)
# nine patch
p5.js library for adding 9 patch images

## introduction

this was created because I wanted an easy way to add nine patch images to a p5js sketch for my website. I made the initial version in a couple of hours over two weeks, with a couple basic features but enough to satisfy my desires.

## quickstart

to install the library, add it in a script below wherever you are including p5.js in your sketch.  
`<script src="https://cdn.jsdelivr.net/gh/Omay238/nine-patch@latest/ninepatch.min.js"></script>`  
then, in a preload function, create a nine patch image using one of the following.
```javascript
let ninepatch = new NinePatch("{PATH_TO_IMAGE}.9.png", "stretch") // to create a stretching nine patch image based on the patch markings on the image
let ninepatchagain = new NinePatch("{PATH_TO_IMAGE}.jpg", "tile", 1, 2, 3, 4) // to create a tiling nine patch image with specified borders
```

for reference, check the example usage in [example/index.html](example/index.html)

## 9 png format

the format used here, i'm unsure if it's standard, however i believe it's fairly simple. to create an image, take an image you want to be scaled, and put a black border on the top and left sides adjacent to what is considered the center. here is a version i did for the logo of the project.

![logo with nine patch border](./images/logo-large.9.png)

###### note the extra pixels on the top and left. compare to the original at the top of this file