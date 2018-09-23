const resemble = require('node-resemble-js');
const fs = require('fs');
const sharp = require('sharp');

module.exports = {

    /*
    * Since we're working with async steps, we are able to return a promise
    * to make sure that the results are ready, by the moment that the 
    * test has finished.
    */
    areScreenshotEqual: async (imgPath, imgSrc, save = false) => {
        return new Promise(async (resolve, reject) => {
            const originalName = imgPath;

            /*
            * If the first parameter is a String, load the image from the 
            * file path, else, use the parameter as-is.
            */
            if (typeof imgPath == 'string') {
                imgPath = fs.readFileSync(`./cases/${imgPath}.png`);
            }

            /*
            * Use "sharp" to get original image information
            * regarding dimensions
            */
            const originalImage = sharp(imgPath);
            const metadata = await originalImage.metadata();

            /*
            * Use "sharp" to resize the new image to match the original
            * image dimensions. With this, we avoid error caused by displaced
            * pixels.
            */
            const sampleImage = await sharp(imgSrc)
                                        .resize(metadata.width, metadata.height)
                                        .toBuffer();
            
            /*
            * Compare both image, ignoring the color schema. Grayscale is enough to
            * ensure that the translation were made correctly. If you need to compare 
            * color variation, you should consider making this parameter optional.
            */                            
            resemble(imgPath)
                .compareTo(sampleImage)
                .ignoreColors()
                .onComplete((data) => {

                    /*
                    * If the difference between both images, is greater than 12.5%, then we output
                    * the diff into a new folder, for debugging purposes.
                    */
                    if (typeof originalName == 'string' && parseFloat(data.misMatchPercentage) > 12.5) {
                        data.getDiffImage().pack().pipe(fs.createWriteStream('./temp/' + originalName + '.png'));
                
                        fs.writeFile('./temp/' + originalName + '.orig.png', imgSrc, function(err) {
                            if (err) {
                                throw(err);
                            }

                            resolve();
                        });
                    }

                    /*
                    * If the difference between the images is below 12.5% we consider the images
                    * equal and resolve the promise correctly, otherwise, throw an error.
                    */
                    data.misMatchPercentage < 12.5 ? resolve(data) : reject(
                       new Error(`Image ${originalName} don\'t match by ${data.misMatchPercentage}% with the original sample.`)
                    )
                });
        });
    },

}