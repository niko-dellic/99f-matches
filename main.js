const fs = require("fs");
const Papa = require("papaparse");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");
const path = require("path"); // Import the 'path' module
const { captureRejectionSymbol } = require("events");

// Read and parse the CSV file
const jsonData = JSON.parse(
  fs.readFileSync("./aliens_first_round_final.json", "utf8")
);

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
});

// partition the json into sets of four
const pagedJson = [];

for (let i = 0; i < jsonData.aliens.length; i += 4) {
  // get flatten of json with combined keys
  //   slice into 4
  const partition = jsonData.aliens.slice(i, i + 4);
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

// create a test variable with a slice of the first three pages
const test = pagedJson.slice(0, 3);

// console.log(test[0]);

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();

  // Inject the HTML content into the page
  const htmlContent = template({ data: [test[0]] });

  console.log(htmlContent);

  await page.setContent(htmlContent);

  // Add the CSS style to the page
  const css = fs.readFileSync("./styles.css", "utf8");
  await page.addStyleTag({ content: css });

  // You can adjust the page settings and PDF options as needed
  await page.pdf({
    path: "output.pdf",
    // format 8.5 x 11 inches
    width: "17in",
    height: "11in",
    printBackground: true, // Include background colors and images
  });

  await browser.close();
})();
