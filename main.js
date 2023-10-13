const fs = require("fs");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const path = require("path"); // Import the 'path' module
const express = require("express");

// Read and parse the CSV file
const jsonData = JSON.parse(
  fs.readFileSync("./aliens_first_round_final.json", "utf8")
);

const app = express();

// Serve the fonts directory
app.use("/fonts", express.static(path.join(__dirname, "fonts")));

const port = 3000;

// const server = app.listen(port, () => {
//   console.log(`Local font server is running on port ${port}`);
// });

// Load the Handlebars template from file
const templateHtml = fs.readFileSync("./template.html", "utf8");
const template = handlebars.compile(templateHtml);

// add the matches to the aliens
jsonData.aliens.map((alien, index) => {
  alien.match = jsonData.matches[alien.id];

  //   if match is an array, grab the first item
  if (Array.isArray(alien.match)) {
    alien.match = alien.match[0];
  }

  // Resolve the image path and add it to the alien data
  alien.imagePath = path.resolve(__dirname, alien.imgurl); // Assuming 'image' is the key for the image path in your JSON data
  const imageNum = alien.imgurl.split("/")[1].split(".")[0];
  const imgType = alien.imgurl.split("/")[1].split(".")[1];
  alien.githubPath = `https://github.com/niko-dellic/99f-matches/blob/main/img/${imageNum}.${imgType}?raw=true`;
});

// partition the json into sets of four

const matchMaker = [];

// restructure the json for matches to be in the same object
Object.keys(jsonData.matches).forEach((entry, index) => {
  const pair = jsonData.matches[entry][0];
  const cutie = jsonData.aliens.find((alien) => alien.id === entry);

  //   update the cutie keys with the cutie prefix
  const keys = Object.keys(cutie);
  const newKeys = keys.map((key) => `cutie-${key}`);
  // add the new keys to the cutie object
  newKeys.forEach((key, index) => {
    cutie[key] = cutie[keys[index]];
    //   delete the old key or maybe not
    // delete cutie[keys[index]];
  });
  const matchmate = jsonData.aliens.find((alien) => alien.id === pair) || {};

  //   if not emptry object
  if (Object.keys(matchmate).length > 0) {
    //   update the matchmate keys with the matchmate prefix
    const matchKeys = Object.keys(matchmate);
    const newMatchKeys = matchKeys
      .map((key) => {
        // if the key does not contain "cutie"
        if (!key.includes("cutie") && !key.includes("matchmate")) {
          return `matchmate-${key}`;
        }
      })
      .filter((key) => key !== undefined);

    // add the new keys to the cutie object
    newMatchKeys.forEach((key, index) => {
      cutie[key] = matchmate[keys[index]];
    });

    matchMaker.push(cutie);
  }
});

const pagedJson = [];
const partitionSize = 4;

for (let i = 0; i < matchMaker.length; i += partitionSize) {
  // get flatten of json with combined keys
  //   slice into partitionSize
  const partition = matchMaker.slice(i, i + partitionSize);
  const flatten = [];
  // get flatten of json with combined keys
  const newElement = {};

  partition.forEach((element, index) => {
    // rename keys to be unique with the index
    const keys = Object.keys(element);
    const newKeys = keys.map((key) => `${key}${index}`);

    // combine keys and values
    newKeys.forEach((key, index) => {
      newElement[key] = element[keys[index]];
    });
  });

  pagedJson.push(newElement);
}

// slice none of the json
// const plot = pagedJson.slice(0, 2);

const start = pagedJson.length - 1;
// const end = 8;
const end = pagedJson.length;

const plot = pagedJson.slice(start, end);

// prettier-ignore
(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  for (const dataItem of plot) {
    const page = await browser.newPage();

    // Inject the HTML content into the page for the current data item
    const htmlContent = template({ data: [dataItem] });

    await page.setContent(htmlContent);

    // Add the CSS style to the page
    const css = fs.readFileSync("./styles.css", "utf8");
    await page.addStyleTag({ content: css });
    await page.addStyleTag({ content: 
      `
      @font-face {
        font-family: 'michroma';
        src: local('michroma'), url('./fonts/michroma.ttf') format('truetype');
      }
      body {
        font-family: 'michroma', sans-serif !important;
      }
    `
  });

  // wait for selector
  await page.waitForSelector("h1.your-name")



    // Perform additional operations for each data item if needed

    // Generate a PDF for each data item
    // await page.pdf({
    //   path: `./output/output_${plot.indexOf(dataItem) + start}.pdf`, // Use a unique name for each PDF
    //   width: "17in",
    //   height: "11in",
    //   margin: {
    //     top: "0.25in",
    //     bottom: "0.25in",
    //     left: "0.25in",
    //     right: "0.25in",
    //   },
    //   printBackground: true,
    // });


    // console log the viewporet size

    await page.setViewport({ 
      // make 4k @ 16:9
      width: 2048,
      height: 1152,
    });
    const viewport = await page.viewport();

    console.log(viewport)


    await page.screenshot({
      path: `./output/output_${plot.indexOf(dataItem) + start}.png`,
      fullPage: true,
    });

    console.log(`wrote output_${plot.indexOf(dataItem) + start}.png`)

    // Close the page
    await page.close();
  }

  await browser.close();
  console.log("Goodbye!");
})();
