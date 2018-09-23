const resemble = require('node-resemble-js');
const fs = require('fs');
const sharp = require('sharp');

module.exports = {

    areScreenshotEqual: async (imgPath, imgSrc, save = false) => {
        return new Promise(async (resolve, reject) => {
            const originalName = imgPath;

            if (typeof imgPath == 'string') {
                imgPath = fs.readFileSync(`./cases/${imgPath}.png`);
            }

            const originalImage = sharp(imgPath);
            const metadata = await originalImage.metadata();
            const sampleImage = await sharp(imgSrc)
                                        .resize(metadata.width, metadata.height)
                                        .toBuffer();
            
            resemble(imgPath)
                .compareTo(sampleImage)
                .ignoreColors()
                .onComplete((data) => {
                    if (typeof originalName == 'string' && parseFloat(data.misMatchPercentage) > 12.5) {
                        data.getDiffImage().pack().pipe(fs.createWriteStream('./temp/' + originalName + '.png'));
                
                        fs.writeFile('./temp/' + originalName + '.orig.png', imgSrc, function(err) {
                            if (err) {
                                throw(err);
                            }

                            resolve();
                        });
                    }

                    data.misMatchPercentage < 12.5 ? resolve(data) : reject(
                       new Error(`Image ${originalName} don\'t match by ${data.misMatchPercentage}% with the original sample.`)
                    )
                });
        });
    },

    areScreenshotDifferent: async (imgPath, imgSrc, save = false) => {
        return new Promise(async (resolve, reject) => {
            const originalName = imgPath;
            
            if (typeof imgPath == 'string') {
                imgPath = fs.readFileSync(`./cases/${imgPath}.png`);
            }

            const originalImage = sharp(imgPath);
            const metadata = await originalImage.metadata();
            const sampleImage = await sharp(imgSrc)
                                        .resize(metadata.width, metadata.height)
                                        .toBuffer();

            resemble(imgPath)
                .compareTo(imgSrc)
                .ignoreColors()
                .onComplete((data) => {
                    if (typeof originalName == 'string' && parseFloat(data.misMatchPercentage) < 12.5) {
                        data.getDiffImage().pack().pipe(fs.createWriteStream('./temp/' + originalName + '.png'));
                    }

                    data.misMatchPercentage > 12.5 ? resolve(data) : reject(
                        new Error(`Image ${originalName} matchs by ${100 - data.misMatchPercentage}% with the original sample.`)
                    )
                });
        });
    }

}