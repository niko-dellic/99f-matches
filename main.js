const fs = require("fs");
const Papa = require("papaparse");
const puppeteer = require("puppeteer");
const handlebars = require("handlebars");

// Read and parse the CSV file
const csvData = fs.readFileSync("./test.csv", "utf8");
const parsedData = Papa.parse(csvData, { header: true }).data;
const jsonData = JSON.parse(fs.readFileSync("./aliens.json", "utf8"));

// Load the Handlebars template from file
const templateHtml = fs.readFileSync("./template.html", "utf8");
const template = handlebars.compile(templateHtml);

// partition the json into sets of four
const pagedJson = [];

for (let i = 0; i < jsonData.length; i += 4) {
  // get flatten of json with combined keys
  //   slice into 4
  const partition = jsonData.slice(i, i + 4);
  const flatten = [];
  // get flatten of json with combined keys
  partition.forEach((element, index) => {
    // rename keys to be unique with the index
    const keys = Object.keys(element);
    const newKeys = keys.map((key) => `${key}${index}`);

    // combine keys and values
    const newElement = {};
    newKeys.forEach((key, index) => {
      newElement[key] = element[keys[index]];
    });

    flatten.push(newElement);
  });

  pagedJson.push(flatten);
}

console.log(pagedJson);

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();

  // Inject the HTML content into the page
  const htmlContent = template({ data: pagedJson[0] });

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
